import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

class GeoJSONWorker{
    constructor(url, style, vtOptions){
        this.worker = new Worker(new URL('../workers/GeoJSONLayer.worker', import.meta.url))
        this.worker.addEventListener('message', this.onReceive.bind(this))
        this.listeners = new Map()
        this.__init(url, style, vtOptions)
    }
    __init(url, style, vtOptions){
        this.post({ type: 'init', data: { url, style, vtOptions } })
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
        this.worker = new GeoJSONWorker(url, this.options.style, this.options.vtOptions)

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
        L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled')
        const layer = new GeoLayerGrid(url, {
            vtOptions: {
                maxZoom: map.maxZoom,
                tolerance: 0,
            },
            ...options
        })
        map.addLayer(layer)
        return () => {
            L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled')
            map.removeLayer(layer)
            layer.close() // cleanup
        }
    })
    return null
}