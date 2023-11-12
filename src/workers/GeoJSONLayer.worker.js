import geojsonvt from "geojson-vt";


var mappedVectorTile = null
var waitForFetch = waitFor()
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
        case 'init':
            console.log("style", data.style)
            fetchingJson(data.url)
            break;
        case 'tile':
            handleTile(data.canvas, data.coords)
            break;
        default:
            console.warn(`Ignored event type: ${type}`)
            break;
    }
}
async function fetchingJson(url){
    const data = await fetch(url)
    const geojson = await data.json()
    mappedVectorTile = geojsonvt(geojson)
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
    if (type === 2 || type === 3){
        for (let i = 0; i < maxLength; i++){
            const rings = geometries[i]
            const maxRingLength = rings.length
            if (maxRingLength > 0)
                ctx.moveTo(rings[0][0] * ratio, rings[0][1] * ratio)
    
            for(let j = 1; j < maxRingLength; j++)
                ctx.lineTo(rings[j][0] * ratio, rings[j][1] * ratio)
        }
    }
    ctx.stroke()

}
function setStyle(ctx){
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(0, 0, 0)'
}

function post(type, data){
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({type, data})
}