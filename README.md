# GeoJSON Renderer Demo without MapServer
I just wanna show the proper implementation that renders geojson completely client side by vectorize.

The rendering is done on a web worker while leaflet GridLayer is used to create the canvas for rendering. 
This allows you to completely control the speed of the rendering to balance the load onto the CPU for heavier
geoJSON layers that may contain thousands of features per tile.

The code functionalities is shown [here](https://interstella0.github.io/geojson-map-demo/).