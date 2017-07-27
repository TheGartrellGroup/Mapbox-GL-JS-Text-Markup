mapboxgl.accessToken = '';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-75, 15],
    zoom: 2
});

map.on('load', function() {

    map.addSource('geo-regions', { type: 'geojson', data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_geography_regions_polys.geojson' });
    map.addLayer({
        "id": "geo-regions",
        "type": "fill",
        "source": "geo-regions",
        "layout": {
            "visibility": 'visible'
        },
        "paint": {
            'fill-color': '#4842f4',
            'fill-opacity': 0.3
        }
    });

    map.addSource('land', { type: 'geojson', data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson' });
    map.addLayer({
        "id": "land",
        "type": "fill",
        "source": "land",
        "layout": {
            "visibility": 'visible'
        },
        "paint": {
            'fill-color': '#e0d4b8',
            'fill-opacity': 0.8
        }
    });


    map.addSource('boundary', { type: 'geojson', data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_boundary_lines_land.geojson' });
    map.addLayer({
        "id": "boundary-line",
        "type": "line",
        "source": "boundary",
        "paint": {
            "line-color": "#e07a14",
            "line-width": 3,
            "line-dasharray": [2, 2],
        }
    });


})


var layers =

    [{
        'name': 'Geographic Regions',
        'id': 'geo-regions',
        'source': 'geo-regions',
        'directory': 'Directory',
    }, {
        'name': 'Land',
        'id': 'land',
        'source': 'land',
        'directory': 'Directory',
    }, {
        'name': 'Boundary Lines',
        'id': 'boundary-line',
        'source': 'boundary',
        'directory': 'Directory',
    }];


// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new LayerTree({
    layers: layers
}), 'bottom-left');


var mapCanvas = map.getCanvasContainer();

function activateTool(el) {
    if (el.getAttribute('active') === 'true') {
        el.setAttribute('active', false);
        mapCanvas.style.cursor = '';
    } else {
        var editNode = document.getElementById('editText');
        var textNode = document.getElementById('textTool');

        el.isEqualNode(editNode) ? textNode.setAttribute('active', false) : editNode.setAttribute('active', false);

        el.setAttribute('active', true);

        mapCanvas.style.cursor = 'crosshair';
    }
}

function generateTextID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function markerToSymbol() {
    if (this.innerText !== '' && this.innerText.length > 0) {

        var coords = [this.getAttribute('lng'), this.getAttribute('lat')];
        var gj = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {},
              "geometry": {
                "type": "Point",
                "coordinates": coords
              }
            }
          ]
        }

        var id = generateTextID();
        var lyrID = id + '-custom-text-label';

        map.addSource(id, { type: 'geojson', data: gj });

        map.addLayer({
            "id": lyrID,
            "type": "symbol",
            "source": id,
            "layout": {
                "text-field": this.innerText,
                "text-size": 12,
                "symbol-placement": "point"
            },
            "paint": {
                "text-color": '#333333',
                "text-halo-color": 'white',
                "text-halo-width": 2,
            },
        });
    }

    this.remove();
}

function limitTextLength(e) {
    if (this.innerText.length >= 20 && e.keyCode !== 8) {
        e.preventDefault();
    }
}

//pasting text requires additional handling
function handlePaste(e) {
    var clipboardData, pastedData;

    e.stopPropagation();
    e.preventDefault();

    clipboardData = e.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('text/plain').slice(0, 20);

    this.innerText = pastedData;
}

map.on('click', function(e) {
    e.originalEvent.preventDefault();

    var textToolBtn = document.getElementById('textTool');
    var editTextBtn = document.getElementById('editText');

    var clickBBox = [[e.point.x - 3, e.point.y - 3], [e.point.x + 3, e.point.y + 3]];

    if (textToolBtn.getAttribute('active') === 'true') {

        var el = document.createElement('span');
        el.className = 'label-marker';
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('spellcheck', 'false');
        el.setAttribute('lng', e.lngLat.lng);
        el.setAttribute('lat', e.lngLat.lat);

        var marker = new mapboxgl.Marker(el, {
            offset:[-75, -15] //first item in offset is half the width of marker width - defined in css
        })
        .setLngLat(e.lngLat)
        .addTo(map);

        el.addEventListener("blur", markerToSymbol);
        el.addEventListener("keydown", limitTextLength);
        el.addEventListener("paste", handlePaste);

        el.focus();

    } else if (editTextBtn.getAttribute('active') === 'true') {
        function isCustomText(item) {
            return item.layer.id.indexOf('-custom-text-label') > -1
        }

        var features = map.queryRenderedFeatures(clickBBox);

        if (features.length) {
            var customLabels = features.filter(isCustomText);
            if (customLabels.length) {
                //only returning the first feature
                //user is going to have to zoom in further
                var feature = customLabels[0].layer;

                var lyrID = feature.id;
                var sourceID = feature.source;
                var text = feature.layout['text-field'];

                var mapSource = map.getSource(sourceID);
                var coords = mapSource._data.features[0].geometry.coordinates;

                var el = document.createElement('span');
                el.className = 'label-marker';
                el.innerText = text;
                el.setAttribute('contenteditable', 'true');
                el.setAttribute('autocorrect', 'off');
                el.setAttribute('spellcheck', 'false');
                el.setAttribute('lng', coords[0]);
                el.setAttribute('lat', coords[1]);

                //gl-js throws a z-index error if a marker is created directly after removing a layer
                //so just hide the layer for now - we'll remove it shortly in a few more steps
                map.setLayoutProperty(lyrID, 'visibility', 'none');

                var marker = new mapboxgl.Marker(el, {
                    offset:[-75, -15]
                })
                .setLngLat(coords)
                .addTo(map);

                el.addEventListener("blur", markerToSymbol);
                el.addEventListener("keydown", limitTextLength);
                el.addEventListener("paste", handlePaste);

                el.focus();

                map.removeSource(sourceID);
                map.removeLayer(lyrID);
            }
        }
    }
})


