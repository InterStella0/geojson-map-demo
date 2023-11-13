import { MapContainer, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import GeoJSONLayer from "./GeoJSONLayer";
import L from 'leaflet'

function getLayerStyle(){
    return {
        fill: true,
        fillRule: 'evenodd',
        fillOpacity: .2,
        fillColor: 'rgba(255,204,203, .8)', // applies to polygon and point
        color: 'cyan', // applies to all
        weight: 1, // applies to all
        radius: 5, // applies to point
        click: {
            color: 'blue',
            fillColor: 'pink'
        },
        hover: {
            color: 'purple',
            fillColor: 'pink'
        }
    }
}
function popupConfig(){
    return {
        popup: (feature) => {
            const d = L.DomUtil.create('table')
            L.DomUtil.addClass(d, "field-table")
            const tableHeadRow = L.DomUtil.create('tr')
            for(const val of ["Field Name", "Field Value"]){
                const td = L.DomUtil.create('th')
                td.innerHTML = val
                tableHeadRow.append(td)
            }
            d.append(tableHeadRow)
            for(const entries of Object.entries(feature.properties)){
                const tableRow = L.DomUtil.create('tr')
                for(const val of entries){
                    const tableTd = L.DomUtil.create('td')
                    tableTd.innerHTML = val
                    tableRow.append(tableTd)
                }
                d.append(tableRow)
            }
            return d
        }
    }
}

export default function Map(){
    const malaysiaCenter = [4.2105, 101.9758]
    //const url = "https://gist.githubusercontent.com/heiswayi/81a169ab39dcf749c31a/raw/b2b3685f5205aee7c35f0b543201907660fac55e/malaysia.geojson"
    const url ="https://raw.githubusercontent.com/TindakMalaysia/Selangor-Maps/master/Selangor_DUN_2015/Selangor_DUN_2015.geojson"
    // const url = "https://scharms.planmalaysia.gov.my/arcgis/rest/services/PerkongsianData/KemudahanKesihatan/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&havingClause=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=geojson"
    const layerStyle = getLayerStyle()
    const callbackConfig = popupConfig()
    return <>
        <MapContainer center={malaysiaCenter} zoom={7}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSONLayer url={url} options={{style: layerStyle, callbackConfig, handleHover: true}} />
        </MapContainer>
    </>
}