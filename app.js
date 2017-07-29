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

//set user defined sizes/colors in palette
var textSizes = [10, 14, 18];
var textColors = ['#000', '#C39BD3', '#76D7C4', '#DC7633'];

//drag status
var isDragging = false;

function activateTool(el) {
    if (el.getAttribute('active') === 'true') {
        el.setAttribute('active', false);
        mapCanvas.style.cursor = '';
    } else {
        var editNode = document.getElementById('editTool');
        var textNode = document.getElementById('textTool');

        el.isEqualNode(editNode) ? textNode.setAttribute('active', false) : editNode.setAttribute('active', false);
        el.setAttribute('active', true);

        mapCanvas.style.cursor = 'crosshair';
    }
}

//generate unique layer ids for text-labels
function generateTextID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

//convert marker DOM elements to symbol layers
function markerToSymbol(e, elm) {
    if (isDragging) return;

    e.hasOwnProperty('originalEvent') ? e.originalEvent.stopImmediatePropagation() : e.stopImmediatePropagation();

    var that = this instanceof Element ? this : elm;
    var textToolBtn = document.getElementById('textTool');

    if (that.innerText !== '' && that.innerText.length > 0) {
        that.classList.remove('active');

        var fontSize = that.style['font-size'] === '' ? textSizes[1] : parseInt(that.style['font-size'].split('px')[0]); //textSize[1] is default
        var fontColor = that.style.color === '' ? '#000' : that.style.color;
        var coords = [that.getAttribute('lng'), that.getAttribute('lat')];

        var labelGJ = {
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
        };

        var id = generateTextID();
        var lyrID = id + '-custom-text-label';

        map.addSource(id, { type: 'geojson', data: labelGJ });

        map.addLayer({
            "id": lyrID,
            "type": "symbol",
            "source": id,
            "layout": {
                "text-field": that.innerText,
                "text-size": fontSize,
                "symbol-placement": "point"
            },
            "paint": {
                "text-color": fontColor,
                "text-halo-color": 'white',
                "text-halo-width": 2,
            },
        });

        //removes text-input marker after clicking off
        textToolBtn.setAttribute('active', false);

        that.removeEventListener('blur', markerToSymbol);
    }

    that.remove();
}

//label text limit defined
function limitTextLength(e) {
    if (e.keyCode === 13 && this.innerText.length <= 20) {
        this.blur();
        e.preventDefault();
    }

    if (this.innerText.length >= 20 && e.keyCode !== 8) {
        e.preventDefault();
    }
}

//pasting text into requires additional handling
//for text limit
function handlePaste(e) {
    var clipboardData, pastedData;

    e.stopImmediatePropagation();
    e.preventDefault();

    clipboardData = e.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('text/plain').slice(0, 20);

    this.innerText = pastedData;
}

function createMarker(e, el) {
    new mapboxgl.Marker(el, {
            offset:[-75, -15] //first item in offset is half the width of marker width (defined in css)
        })
        .setLngLat(e.lngLat)
        .addTo(map);
}

//populates edit palette with user defined colors/sizes
function populatePalette() {
    var palette = document.getElementById('customTextPalette');
    var textSizeDiv = document.getElementById('customTextSize');
    var textColorDiv = document.getElementById('customTextColor');

    for (var s = 0; s < textSizes.length; s++) {
        var sElm = document.createElement('div');
        sElm.className = 'font-size-change';
        sElm.id = 'font-' + textSizes[s];
        sElm.innerText = 'T'; //change to whatever font/image
        sElm.style['font-size'] = textSizes[s] + 'px';
        sElm.addEventListener('mousedown', changeFontStyle);

        textSizeDiv.appendChild(sElm);
    };

    for (var c = 0; c < textColors.length; c++) {
        var cElm = document.createElement('div');
        cElm.className = 'font-color-change';
        cElm.id = 'font-' + textColors[c];
        cElm.style['background-color'] = textColors[c];
        cElm.addEventListener('mousedown', changeFontStyle);

        textColorDiv.appendChild(cElm);
    };
}

//update marker font styles
function changeFontStyle(e) {
    e.stopImmediatePropagation();

    var mark = document.querySelector('.label-marker');

    if (mark) {
        mark.classList.add('active');
        if (e.target.classList.contains('font-size-change')) {
            mark.style['font-size'] = e.target.style['font-size'];
        } else if (e.target.classList.contains('font-color-change')) {
            mark.style.color = e.target.style['background-color'];
        }

    }
}

//marker move functionality - modified GL example
//https://www.mapbox.com/mapbox-gl-js/example/drag-a-point/
function beginDrag(e) {
    e.stopImmediatePropagation();

    var mark = this;
    isDragging = true;

    map.dragPan.disable();
    mapCanvas.style.cursor = 'grab';

    map.on('mousemove', onDrag);
    map.on('mouseup', stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;

    mapCanvas.style.cursor = 'grabbing';
    map.dragPan.disable();

    var label = document.querySelector('.label-marker');
    label.classList.add('drag-active');

    createMarker(e, label);
}

function stopDrag(e) {
    if (!isDragging) return;

    var label = document.querySelector('.label-marker');
    label.setAttribute('lng', e.lngLat.lng);
    label.setAttribute('lat', e.lngLat.lat);
    label.classList.remove('drag-active');

    isDragging = false;

    mapCanvas.style.cursor = '';
    map.dragPan.enable();

    setTimeout(function(){
        markerToSymbol(e, label);
    }, 50)

    // Unbind mouse events
    map.off('mousemove', onDrag);
}

//fire function to populate text/color custom pallete
populatePalette();

map.on('click', function(e) {
    e.originalEvent.preventDefault();

    if (isDragging) return;

    isDragging = false;

    var textToolBtn = document.getElementById('textTool');
    var editTextBtn = document.getElementById('editTool');

    var clickBBox = [[e.point.x - 3, e.point.y - 3], [e.point.x + 3, e.point.y + 3]];

    //adding text
    if (textToolBtn.getAttribute('active') === 'true') {

        var el = document.createElement('span');
        el.className = 'label-marker';
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('spellcheck', 'false');
        el.setAttribute('lng', e.lngLat.lng);
        el.setAttribute('lat', e.lngLat.lat);
        el.style['font-size'] = textSizes[1] + 'px';

        map.marker = createMarker(e, el);

        el.addEventListener("blur", markerToSymbol);
        el.addEventListener("keydown", limitTextLength);
        el.addEventListener("paste", handlePaste);

        el.focus();

    //editting text
    } else if (editTextBtn.getAttribute('active') === 'true') {

        //filters layers for custom text labels
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
                var featureFontSize = feature.layout['text-size'] + 'px';
                var featureFontColor = feature.paint['text-color'];

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
                el.style['font-size'] = featureFontSize;
                el.style.color = featureFontColor;

                map.removeSource(sourceID);
                map.removeLayer(lyrID);

                createMarker(e, el);

                el.addEventListener("blur", markerToSymbol);
                el.addEventListener("keydown", limitTextLength);
                el.addEventListener("paste", handlePaste);
                el.addEventListener("mousedown", beginDrag);

                el.focus();

                e.originalEvent.stopImmediatePropagation();
                e.originalEvent.stopPropagation();
            }
        }
    }
});