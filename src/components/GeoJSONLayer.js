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
    click(latlng){
        this.post({ type: 'click', data: { latlng } })
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
        this.worker.listen('click', this.featureClicked.bind(this))
        this.clickCallback = this.onClickMap.bind(this)
        this.highlightLayer = null
        this.map = null
        this.bindedPopup = this.options.callbackConfig?.popup
    },
    onClickMap: function(e){
        const latlng = e.latlng
        this.dispatchClick({...latlng})
    },
    bindPopup: function(callback){
        this.bindedPopup = callback
    },
    onAdd: function(map){
        L.GridLayer.prototype.onAdd.apply(this, map)
        map.on('click', this.clickCallback)
        this.map = map		
        L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled')
    },
    onRemove: function(map){
        L.GridLayer.prototype.onRemove.call(this, map)
        this.ensureRemoveHighlight()
        map.off('click', this.clickCallback)
        L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled')
    },
    dispatchClick: function(latlng){
        this.worker.click(latlng)
    },
    ensureRemoveHighlight: function(){
        if (this.highlightLayer)
            this.map.removeLayer(this.highlightLayer)
    },
    highlightFeature: function(feature){
        this.ensureRemoveHighlight()
        if (!feature)
            return

        const featureCollection = {
            type: 'FeatureCollection',
            features: [feature]
        }
        this.highlightLayer = new L.geoJson(featureCollection, this.options.style.highlight)
        this.map.addLayer(this.highlightLayer)

    },
    featureClicked: function({feature, latlng}){
        this.highlightFeature(feature)
        if (!this.bindedPopup || !feature)
            return

        const content = this.bindedPopup(feature)
        L.popup()
            .setLatLng(latlng)
            .setContent(content)
            .openOn(this.map)
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
            try{
                map.removeLayer(layer)
            }finally{
                layer.close() // cleanup
            }
        }
    })
    return null
}