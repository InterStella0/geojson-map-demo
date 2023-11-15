import { Button } from "@mui/material"
import EditIcon from '@mui/icons-material/Edit';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Header(){
    return <nav className="nav-top">
        <p>GeoJSON Map Viewer</p>
        <div className="nav-action">
            <Button variant="contained"><EditIcon /><span style={{marginLeft: 5}}>Layer</span></Button>
            <a href="https://github.com/InterStella0/geojson-map-demo" className="github-icon" title="InterStella0"><GitHubIcon /></a>
        </div>
    </nav>
}