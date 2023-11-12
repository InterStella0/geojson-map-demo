import geojsonvt from "geojson-vt";


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
        default:
            console.warn(`Ignored event type: ${type}`)
            break;
    }
}
async function fetchingJson(url, options){
    const data = await fetch(url)
    const geojson = await data.json()
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
    finishRender(coords)
}
function finishRender(coords){
    post('tile', { coords })
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
        ctx.fill('evenodd')

    
    ctx.stroke()

}
function setStyle(ctx){
    ctx.lineWidth = styleSet.width ?? 2
    ctx.fillStyle = styleSet.fill ?? 'pink'
    ctx.strokeStyle = styleSet.stroke ?? 'cyan'
}

function post(type, data){
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({type, data})
}