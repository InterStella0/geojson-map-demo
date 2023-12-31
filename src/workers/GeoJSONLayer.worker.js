import geojsonUtils from "geojson-utils";
import geojsonvt from "geojson-vt";


var originalData = null
var mappedVectorTile = null
var waitForFetch = waitFor()
var styleSet = {}
const FULL_CIRCLE = 2 * Math.PI  // 360 deg
// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', e => {
    const received = e.data
    processMessage(received.type, received.data)
})

function waitFor(){
    let resolver = null
    const waiter = new Promise((resolve) => {
        resolver = resolve
    })
    return {
        wait: () => waiter,
        set: resolver
    }
}
function processMessage(type, data){
    switch(type){
        case 'init':{
            fetchingJson(data.url, data.vtOptions)
            styleSet = data.style ?? {}
            break;
        }case 'tile':
            handleTile(data.canvas, data.coords)
            break;
        case 'hover':
        case 'click':
            if (!originalData)
                return
            handleClickOrHover(data.latlng, type)
            break;
        default:
            console.warn(`Ignored event type: ${type}`)
            break;
    }
}
function isLineIntersectPoint(point, linestring){
    const deviation = .01
    const centerPoint = point.coordinates
    let coordinates = [linestring.coordinates]
    if (linestring.type === "MultiLineString")
        coordinates = coordinates[0]
    const pointLineString = {
        "type": "LineString",
        "coordinates": [
          [centerPoint[0], centerPoint[1]], // Center point
          [centerPoint[0], centerPoint[1] + deviation], // Up
          [centerPoint[0], centerPoint[1] - deviation], // Down
          [centerPoint[0] + deviation, centerPoint[1]], // Right
          [centerPoint[0] - deviation, centerPoint[1]]  // Left
        ]
    }
    for(let i = 0; i < coordinates.length; i++){
        const line = {
            type: 'LineString',
            coordinates: coordinates[i]
        }
        if (geojsonUtils.lineStringsIntersect(line, pointLineString))
            return true
    }
    return false

}
function pointToGeoJSON(p, geojson) { // Copied from leafletPip but modified
    // This function is intended to only support singular type, i.e you cannot mix Point and Linestring in a 
    // single geojson featurecollection.
    if (typeof p.lat === 'number')
        p = [p.lng, p.lat];

    const features = geojson.features
    const maxLength = features.length
    const point = {
        type: 'Point',
        coordinates: p
    }
    const radius = 1000
    const geomType = maxLength > 0? features[0].geometry?.type: 'empty'
    switch(geomType.toLowerCase()){
        case 'multipolygon':
        case 'polygon':
            for(let i = 0; i < maxLength; i++){
                if (geojsonUtils.pointInPolygon(point, features[i].geometry))
                    return features[i]
            }
            break
        case 'multilinestring':
        case 'linestring':
            for(let i = 0; i < maxLength; i++){
                if (isLineIntersectPoint(point, features[i].geometry, radius))
                    return features[i]
            }
            break;
        case 'multipoint':
        case 'point':
            for(let i = 0; i < maxLength; i++){
                if (geojsonUtils.pointDistance(point, features[i].geometry) <= radius)
                    return features[i]
            }
            break;
        default:
            console.warn("unknown type: ", geomType)
            break
    }


    
}
function handleClickOrHover(latlng, type){
    const json = pointToGeoJSON(latlng, originalData)
    post(type, {feature: json, latlng})
}
async function fetchingJson(url, options){
    const data = await fetch(url)
    const geojson = await data.json()
    originalData = geojson
    mappedVectorTile = geojsonvt(geojson, options)
    waitForFetch.set()
}
async function handleTile(canvas, coords){
    await waitForFetch.wait()
    const ctx = canvas.getContext("2d")
    const { x, y, z } = coords
    const tile = mappedVectorTile.getTile(z, x, y)
    const features = tile?.features?? []
    renderTile(ctx, features)
}

function renderTile(ctx, features){
    for(let i = 0; i < features.length; i++)
        featureDraw(ctx, features[i])
}
function featureDraw(ctx, feature){
    const type = feature.type
    const geometries = feature.geometry
    const maxLength = geometries.length
    const ratio = 1 / 16
    ctx.beginPath()
    setStyle(ctx)
    switch(type){
        case 1:
            for (let i = 0; i < maxLength; i++)
                ctx.arc(geometries[i][0] * ratio, geometries[i][1] * ratio, styleSet.radius ?? 2, 0, FULL_CIRCLE, true)
            break
        case 2:
        case 3:
            for (let i = 0; i < maxLength; i++){
                const rings = geometries[i]
                const maxRingLength = rings.length
                if (maxRingLength > 0)
                    ctx.moveTo(rings[0][0] * ratio, rings[0][1] * ratio)
        
                for(let j = 1; j < maxRingLength; j++)
                    ctx.lineTo(rings[j][0] * ratio, rings[j][1] * ratio)
            }
            break
        default:
            break
    }
    if (type === 1 || type === 3)
        ctx.fill(styleSet.fillRule ?? 'evenodd')

    
    ctx.stroke()

}
function setStyle(ctx){
    ctx.lineWidth = styleSet.weight ?? 2
    ctx.fillStyle = styleSet.fillColor ?? 'pink'
    ctx.strokeStyle = styleSet.color ?? 'cyan'
}

function post(type, data){
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({type, data})
}