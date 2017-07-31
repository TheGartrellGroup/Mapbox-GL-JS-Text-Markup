mapboxgl.accessToken = '';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
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


// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

var MAP_DIV = map.getCanvasContainer();
var EDIT_NODE = document.getElementById('editTextTool');
var LABEL_NODE = document.getElementById('textTool');

//set user defined sizes/colors in palette
var TEXT_SIZES = [10, 14, 18];
var TEXT_COLORS = ['#000', '#C39BD3', '#76D7C4', '#DC7633'];

//char count limit
var CHAR_LIMIT = 20;

//drag status
var isDragging = false;


function activateTool(el) {
    if (el.getAttribute('active') === 'true') {
        el.setAttribute('active', false);

        MAP_DIV.style.cursor = '';

    } else {
        el.isEqualNode(EDIT_NODE) ? LABEL_NODE.setAttribute('active', false) : EDIT_NODE.setAttribute('active', false);
        el.setAttribute('active', true);

        MAP_DIV.style.cursor = 'crosshair';
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

    MAP_DIV.style.curor = '';

    var that = this instanceof Element ? this : elm;
    var childSpan = document.querySelector('.marker-text-child');

    if (childSpan) var parent = childSpan.parentNode;

    if (that.innerText !== '' && that.innerText.length > 0) {
        parent ? parent.classList.remove('active') : that.classList.remove('active');

        var fontSize = that.style['font-size'] === '' ? TEXT_SIZES[1] : parseInt(that.style['font-size'].split('px')[0]); //textSize[1] is default
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
                "symbol-placement": "point",
                "text-keep-upright": true
            },
            "paint": {
                "text-color": fontColor,
                "text-halo-color": '#FFF',
                "text-halo-width": 2,
            },
        });

        //removes text-input marker after clicking off
        LABEL_NODE.setAttribute('active', false);

        that.removeEventListener('blur', markerToSymbol);
    }

    parent ? parent.remove() : that.remove();
}

//label text limit/prevent event keys
function inputText(e) {
    //arrow keys
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.stopPropagation();
    //enter key
    } else if(e.keyCode === 13 && this.innerText.length <= CHAR_LIMIT) {
        this.blur();

        MAP_DIV.style.cursor = '';

        e.preventDefault();
    //limit
    } else if (this.innerText.length >= CHAR_LIMIT && e.keyCode !== 8) {
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
    pastedData = clipboardData.getData('text/plain').slice(0, CHAR_LIMIT);

    this.innerText = pastedData;
}

function createMarker(e, el) {

    new mapboxgl.Marker(el)
        .setLngLat(e.lngLat)
        .addTo(map);
}

//populates edit palette with user defined colors/sizes
function populatePalette() {
    var palette = document.getElementById('customTextPalette');
    var textSizeDiv = document.getElementById('customTextSize');
    var textColorDiv = document.getElementById('customTextColor');

    for (var s = 0; s < TEXT_SIZES.length; s++) {
        var sElm = document.createElement('div');
        sElm.className = 'font-size-change';
        sElm.id = 'font-' + TEXT_SIZES[s];
        sElm.innerText = 'T'; //change to whatever font/image
        sElm.style['font-size'] = TEXT_SIZES[s] + 'px';
        sElm.addEventListener('mousedown', changeFontStyle);

        textSizeDiv.appendChild(sElm);
    };

    for (var c = 0; c < TEXT_COLORS.length; c++) {
        var cElm = document.createElement('div');
        cElm.className = 'font-color-change';
        cElm.id = 'font-' + TEXT_COLORS[c];
        cElm.style['background-color'] = TEXT_COLORS[c];
        cElm.addEventListener('mousedown', changeFontStyle);

        textColorDiv.appendChild(cElm);
    };
}

//update marker font styles
function changeFontStyle(e) {
    e.preventDefault();
    e.stopPropagation();

    var labelDiv = document.querySelector('.label-marker');
    var childSpan = document.querySelector('.marker-text-child');

    var mark = childSpan ? childSpan : labelDiv;

    if (mark) {
        labelDiv.classList.add('active');
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

    map.dragPan.disable();

    isDragging = true;

    MAP_DIV.style.cursor = 'cursor:-moz-grab;cursor:-webkit-grab;cursor:grab';

    map.on('mousemove', onDrag);
    map.on('touchmove', onDrag);

    map.once('mouseup', stopDrag);
    map.once('touchend', stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;

    var label = document.querySelector('.label-marker');

    MAP_DIV.style.cursor = 'cursor:-moz-grabbing;cursor:-webkit-grabbing;cursor:grabbing';

    map.dragPan.disable();

    createMarker(e, label);
}

function stopDrag(e) {
    if (!isDragging) return;

    var textSpan = document.querySelector('.marker-text-child');

    textSpan.setAttribute('lng', e.lngLat.lng);
    textSpan.setAttribute('lat', e.lngLat.lat);

    isDragging = false;

    textSpan.parentNode.style.cursor = '';
    MAP_DIV.style.cursor = '';

    map.dragPan.enable();

    setTimeout(function(){
        markerToSymbol(e, textSpan);
    }, 50)

    // Unbind mouse events
    map.off('mousemove', onDrag);
}

function addEditLabels(e) {
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();

    if (isDragging) return;

    //create a large bounding box for capture
    var clickBBox = [[e.point.x - 2, e.point.y - 2], [e.point.x + 2, e.point.y + 2]];

    //adding text
    if (LABEL_NODE.getAttribute('active') === 'true') {

        var el = document.createElement('div');
        el.className = 'label-marker';

        el.setAttribute('contenteditable', 'true');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('spellcheck', 'false');
        el.setAttribute('lng', e.lngLat.lng);
        el.setAttribute('lat', e.lngLat.lat);
        el.style['font-size'] = TEXT_SIZES[1] + 'px';  //defaulting to second size

        map.marker = createMarker(e, el);

        el.addEventListener("blur", markerToSymbol);
        el.addEventListener("keydown", inputText);
        el.addEventListener("paste", handlePaste);

        el.focus();

    //editting text
    } else if (EDIT_NODE.getAttribute('active') === 'true') {

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

                var container = document.createElement('div');
                container.className = 'label-marker label-container active';

                var el = document.createElement('span');
                el.className = 'marker-text-child';
                el.innerText = text;

                el.style['font-size'] = featureFontSize;
                el.style.color = featureFontColor;

                el.setAttribute('lng', coords[0]);
                el.setAttribute('lat', coords[1]);
                el.setAttribute('contenteditable', 'true');
                el.setAttribute('autocorrect', 'off');
                el.setAttribute('spellcheck', 'false');

                //drag icon - using FontAwesome as an example
                var dragUI = document.createElement('i');
                dragUI.className = 'fa fa-arrows-alt fa-lg drag-icon';
                dragUI.setAttribute('aria-hidden', true);

                container.appendChild(dragUI);
                container.appendChild(el);

                map.removeSource(sourceID);
                map.removeLayer(lyrID);

                createMarker(e, container);

                dragUI.addEventListener("mousedown", beginDrag);
                dragUI.addEventListener("touchstart", beginDrag);

                el.addEventListener("blur", markerToSymbol);
                el.addEventListener("keydown", inputText);
                el.addEventListener("paste", handlePaste);

                MAP_DIV.style.cursor = 'text';
            }
        }
    }
}

//fire function to populate text/color custom pallete
populatePalette();

map.on('click', addEditLabels);
