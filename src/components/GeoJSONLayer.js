import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

class GeoJSONWorker{
    constructor(url){
        this.worker = new Worker('../workers/GeoJSONLayer.worker', import.meta.url)
        this.__init(url)
    }
    __init(url){
        this.post({ type: 'init', data: { url } })
    }
    post({ type, data }){
        this.worker.postMessage({ type, data })
    }
    renderTile({ coords, tile }){
        this.post({
            type: 'tile',
            data: { coords, tile }
        })
    }
    close(){
        this.worker.terminate()
    }
}

const GeoLayerGrid = L.GridLayer.extend({
    initialize: function(url, options) {
        L.setOptions(this, options);
        this.worker = new GeoJSONWorker(url)
    },
    createTile: function(coords, done){
        const tile = L.DomUtil.create('canvas')
        this.worker.renderTile({
            coords: coords,
            tile: tile
        })
    }
})


export default function GeoJSONLayer({url, options}){
    const map = useMap()
    useEffect(() => {
        const layer = new GeoLayerGrid(url, options)
        map.addLayer(layer)
        return () => {
            map.removeLayer(layer)
        }
    })
    return null
}