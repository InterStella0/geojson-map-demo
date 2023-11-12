import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

class GeoJSONWorker{
    constructor(url, style){
        this.worker = new Worker(new URL('../workers/GeoJSONLayer.worker', import.meta.url))
        this.worker.addEventListener('message', this.onReceive.bind(this))
        this.listeners = new Map()
        this.__init(url, style)
    }
    __init(url, style){
        this.post({ type: 'init', data: { url, style } })
    }
    listen(event, callback){
        this.listeners.set(event, callback)
    }
    onReceive(message){
        const data = message.data
        const type = data.type
        if (!type)
            return

        const listener = this.listeners.get(type)
        if (listener)
            listener({ ...data.data})
    }
    post({ type, data }, ...args){
        this.worker.postMessage({ type, data }, ...args)
    }
    renderTile(coords, canvas){
        this.post({
            type: 'tile',
            data: { coords, canvas }
        }, [canvas])
    }
    close(){
        this.worker.terminate()
    }
}

const GeoLayerGrid = L.GridLayer.extend({
    initialize: function(url, options) {
        L.setOptions(this, options)
        this.tileMapped = new Map()
        this.worker = new GeoJSONWorker(url, this.options.style)

    },
    createTile: function(coords){
        const tile = L.DomUtil.create('canvas', 'leaflet-tile')
        const size = this.getTileSize()
        tile.width = size.x
        tile.height = size.y
        const canvas = tile.transferControlToOffscreen()
        this.worker.renderTile(coords, canvas)
        const {x, y, z} = coords
        this.tileMapped.set(`${x},${y},${z}`, [null, tile])
        return tile
    },
    close: function(){
        this.worker.close()
    }
})


export default function GeoJSONLayer({url, options}){
    const map = useMap()
    useEffect(() => {
        const layer = new GeoLayerGrid(url, options)
        map.addLayer(layer)
        return () => {
            map.removeLayer(layer)
            layer.close() // cleanup
        }
    })
    return null
}