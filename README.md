# Mapbox-GL-JS-Text-Markup
Allow users the ability to add text labeling (and treat them as symbol layers) to a Mapbox GL map

## Demo
![Simple Demo](http://g.recordit.co/DehbfOa7XR.gif)

## Dev Notes
#### Code:
* Written in vanilla JavaScript and should require no additional dependencies (including jQuery)
* However, example does load FontAwesome for the drag icon
* Uses latest version of Mapbox GL (currently **v0.39.1**) - as there's a [breaking change with markers and their starting point](https://github.com/mapbox/mapbox-gl-js/releases/tag/v0.39.0) 

#### CSS:
* Basic styles can be seen in `index.html`
* `.label-marker` is the main class for a text-input element when a label is initially added (Add Text)
* `.label-marker.marker-container` is the main/parent input element when a user edit's an existing label (Edit Text)
* `.marker-text-child` is the actual editable input element (Edit Text)


#### Current Parameters:
* `TEXT_SIZE`: an array of font-size integers. The second item (`TEXT-SIZE[1]`) is preset as the default/starting size
* `TEXT_COLORS`: an array of color hex strings
* `CHAR_LIMIT`: number of text characters to limit a user's input


## Additional Tidbits:
* A label belongs to a single map source and map layer
* Each label has a `layer.id` with *-custom-text-label* appended at the end
* Limited to one line text-input (no carriage returns)
    * To remove that restriction - simply delete/modify the `else if` within the `inputText(e)` function
 * Current UI handling allows for enduser's to modify `text-font` and `text-size` paint and layout properties
    * Labels can be customized and extended far beyond current functionality with additional glue code
    * Default layer object presets are:
      ```
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
      ```
  
