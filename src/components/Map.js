import { MapContainer, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import GeoJSONLayer from "./GeoJSONLayer";

export default function Map(){
    const malaysiaCenter = [4.2105, 101.9758]
    //const url = "https://gist.githubusercontent.com/heiswayi/81a169ab39dcf749c31a/raw/b2b3685f5205aee7c35f0b543201907660fac55e/malaysia.geojson"
    const url ="https://raw.githubusercontent.com/TindakMalaysia/Selangor-Maps/master/Selangor_DUN_2015/Selangor_DUN_2015.geojson"
    return <>
        <MapContainer center={malaysiaCenter} zoom={7}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSONLayer url={url} options={{style: {fill: 'rgba(255,204,203, .8)', stroke: 'cyan'}}} />
        </MapContainer>
    </>
}