(function ($) {

    'use strict';

    /**
     * Plugin url
     */
    var plugin_url = acf_yandex_locale.plugin_url;

    /**
     * Include common vars
     */
    //= 'includes/common.js'

    /**
     * Backend vars
     */
    var blogURL = acf_yandex_locale.blog_url;
    var templateURL = acf_yandex_locale.template_url;
    var postID = acf_yandex_locale.post_id;
    var postType = acf_yandex_locale.post_type;
    var termID = acf_yandex_locale.term_id;
    var term_slug = acf_yandex_locale.term_slug;
    var is_project = (acf_yandex_locale.is_project) ? true : false;

    /**
     * Initialize admin interface
     *
     * @param {element} $el
     * @returns {boolean}
     */
    function initialize_field($el) {

        /**
         * Element for map init
         * @type {element}
         */
        var $element;

        /**
         * Hidden data input
         * @type {element}
         */
        var $input;

        /**
         * Saved data or default
         *
         * @param {float} $params.center_lat
         * @param {float} $params.center_lng
         * @param {string} $params.type
         * @param {int} $params.zoom
         * @param {Object[]} $params.marks
         *
         * @type {object}
         */
        var $params;

        /**
         * Yandex map object
         *
         * @type {Object}
         */
        var $map = null;

        /**
         * Project objects
         *
         * @type {array}
         */
        var $project = [];

        /**
         * Project collection
         *
         * @type {object}
         */
        var $collection;

        /**
         * Project collection
         *
         * @type {boolean}
         */
        var $map_active;

        /// Init fields

        $element = $($el).find('.map');
        $input = ($el).find('.map-input');

        if ($element == undefined || $input == undefined) {
            console.error(acf_yandex_locale.map_init_fail);
            return false;
        }

        /// Init params

        $params = $.parseJSON($($input).val());

        /// Import data & map init

        if ( (term_slug != 'no-project' && term_slug != undefined) || is_project ) {

            console.log('Import start');
            console.log(term_slug);

            // var data = plugin_url + 'json/land-' + term_slug + '.json';

            // $.when(

                $.post({
                    url: ajaxurl,
                    data: {
                        action: 'ymaps_json_post',
                        data: {
                            type: 'project',
                            name: term_slug
                        }
                    }
                })
                .done(function(response) {
                    // console.log(data);

                    var data = $.parseJSON(response);

                    if ( data.features.length > 0 ) {

                        $.each(data.features, function(index, val) {
                            $project[index] = {
                                "id": val.id,
                                "content": val.id,
                                "type": val.geometry.type,
                                "coords": val.geometry.coordinates,
                                "status": (val.status) ? val.status.slug : false
                            };
                        });

                        console.log('Map data loaded');

                    } else {

                        console.error("Map data error");
                    };
                    // $map.setBounds($map.geoObjects.getBounds(), {
                    //     checkZoomRange: true
                    // });
                })
                .fail(function() {
                //     console.error("Map data error");
                });

                // $.get(data, function(response) {

                //     if ( response.features.length > 0 ) {

                //         $.each(response.features, function(index, val) {
                //             $project[index] = {
                //                 "id": val.id,
                //                 "content": val.id,
                //                 "type": val.geometry.type,
                //                 "coords": val.geometry.coordinates
                //             };
                //         });

                //     } else {

                //         console.error('Data import error!');

                //     }

                // })

            // ).done(function() {

                console.log('Import success & map start');

            //     ymaps.ready(function () {
            //         // let's go
            //         map_init();
            //     });

            // }).fail(function() {

            //     console.error('Data import error!');

            //     console.log('Just map start');

            //     ymaps.ready(function () {
            //         // let's go
            //         map_init();
            //     });

            // });

        } else {

            console.log('Just map start');

        }

            ymaps.ready(function () {
                // let's go
                map_init();
            });

        // };

        /**
         * Initialization Map
         */
        function map_init() {

            $element.empty();

            if ($map != null) {
                $map.destroy();
                $map = null;
                $input.val('');
            }

            $map = new ymaps.Map($element[0], {
                zoom: $params.zoom,
                center: [$params.center_lat, $params.center_lng],
                type: 'yandex#' + $params.type
            }, {
                minZoom: 10
            });

            $map.controls.remove('trafficControl');
            $map.controls.remove('fullscreenControl');
            $map.controls.remove('searchControl');
            $map.controls.remove('geolocationControl')
            $map.behaviors.disable('scrollZoom');
            $map.copyrights.add('&copy; DKI ');

            if (!is_project) {
                $map.events.add('click', function (e) {
                    if ($map_active) {
                        create_mark(e.get('coords'));
                        save_map();
                    }
                });
            }

            $map.events.add('typechange', function (e) {
                save_map();
            });

            $map.events.add('boundschange', function () {
                save_map();
            });

            /// Zoom Control

            var zoom_control = new ymaps.control.ZoomControl();
            zoom_control.events.add('zoomchange', function (event) {
                save_map();
            });

            $map.controls.add(zoom_control, {top: 75, left: 5});

            /// Clear all button

            var clear_button = new ymaps.control.Button({
                data: {
                    content: acf_yandex_locale.btn_clear_all,
                    title: acf_yandex_locale.btn_clear_all_hint
                },
                options: {
                    selectOnClick: false
                }
            });

            clear_button.events.add('click', function () {
                $map.geoObjects.each(function (mark) {
                    if (mark.geometry != null) { // if not collection
                        $map.geoObjects.remove(mark);
                    };
                });
                $map_active = true;
                $('.marker-type').removeAttr('disabled');
                save_map();
            });

            if (!is_project) {
                $map.controls.add(clear_button, {top: 5, right: 5});
            };

            /// Geocoding button

            var geo_button = new ymaps.control.Button('Найти');

            geo_button.events.add('click', function () {
                // remove object mark
                $map.geoObjects.each(function (mark) {
                    if (mark.geometry != null) { // if not collection
                        $map.geoObjects.remove(mark);
                    };
                });

                // get address
                var location = '';

                $('.js-location').each(function(index, el) {
                    function collect(el) {
                        if (el != undefined && el != NaN && el != null && el) {
                            location += el;
                        }
                    }
                    collect($(el).find('textarea').val());
                    collect($(el).find('input').val());
                    collect($(el).find('select option[selected="selected"]').text());
                });

                if ( location ) {
                    // use gecoder
                    geocode_location(location);
                } else {
                    alert('Объект не найден');
                };
            });

            if (!is_project) {
                $map.controls.add(geo_button);
            };

            /// Collection

            $collection = new ymaps.GeoObjectCollection(null, {
                preset: 'islands#yellowIcon'
            });

            /// Marks import

            $($project).each(function(index, mark) {
                if (mark.id != postID) { // if not this post
                    import_mark(mark.coords, mark.type, mark.id, mark.status);
                }
            });

            /// Import load

            $map.geoObjects.add($collection);

            /// Marks load

            $($params.marks).each(function (index, mark) {
                create_mark(mark.coords, mark.type, mark.id, mark.content);
            });

            /// Misc
            if (is_project) {
                $map.setBounds($map.geoObjects.getBounds(), {
                    checkZoomRange: true
                });
            }
        }

        /**
         * Import geo mark
         *
         * @param {Array} coords
         * @param {int} term
         * @param {int} id
         */
        function import_mark(coords, type, id, status) {

            var place_mark = null;
            var marker_type = type.toLowerCase();
            var mark_id = id;
            var edit_url = window.location.origin + '/wp-admin/post.php?post=' + mark_id + '&action=edit';

            var place_mark_content = {
                balloonContentBody: '<span>Объект №' + mark_id + '</span><br><a href="' + edit_url + '">Редактировать</a>',
                hintContent: mark_id
            }

            if (marker_type == 'point') { // create placemark

                console.log(is_project);

                var mark_style;

                if ( is_project ) { // project admin page

                    switch(status) {
                        case 'vacant':
                            mark_style = mark_style_house_green;
                            break;
                        case 'reserved':
                            mark_style = mark_style_house_yellow;
                            break;
                        case 'booked':
                            mark_style = mark_style_house_red;
                            break;
                        default :
                            mark_style = mark_style_house_gray;
                            break;
                    }

                } else {
                    mark_style = mark_style_house_orange;
                }

                place_mark = new ymaps.Placemark(
                    coords,
                    place_mark_content,
                    mark_style
                );

                $collection.add(place_mark);

            } else if (marker_type == 'polygon') {

                var polygon_style;

                if ( is_project ) { // project admin page

                    switch(status) {
                        case 'vacant':
                            polygon_style = polygon_style_green;
                            break;
                        case 'reserved':
                            polygon_style = polygon_style_yellow;
                            break;
                        case 'booked':
                            polygon_style = polygon_style_red;
                            break;
                        default :
                            polygon_style = polygon_style_gray;
                            break;
                    }

                } else {
                    polygon_style = polygon_style_orange;
                }

                place_mark = new ymaps.Polygon(
                    coords,
                    place_mark_content,
                    polygon_style
                );

                $collection.add(place_mark);

            } else {

                console.log('Object ' + id + ' without coordinates');

            }
        }

        /**
         * Create geo mark
         *
         * @param {Array} coords
         * @param {string} type Point type, Point
         * @param {int} id
         * @param {string} content
         */
        function create_mark(coords, type, id, content) {

            var place_mark = null;
            var marker_type = (type != null) ? type.toLowerCase() : $($el).find('.marker-type').val();

            console.log(marker_type);

            var mark_id = id;
            if (id == undefined && $params.marks.length == 0)
                mark_id = 1;
            else
                mark_id = (id == undefined) ? ($params.marks[$params.marks.length - 1].id + 1) : id;

            var mark_content = (content == undefined) ? '' : content;

            if (marker_type == 'point') { // create placemark

                mark_style_house_green.draggable = true;

                place_mark = new ymaps.Placemark(
                    coords,
                    {},
                    mark_style_house_green
                );

                $map.geoObjects.add(place_mark);

                $map_active = false;

            } else if (marker_type == 'polygon') { // if mark is polygon

                if (coords.length === 2) {
                    coords = [];
                };

                polygon_style_green.editorDrawingCursor = 'crosshair';
                polygon_style_green.editorMaxPoints = 5;

                var place_mark = new ymaps.Polygon(
                    coords, 
                    {}, 
                    polygon_style_green 
                );

                $map.geoObjects.add(place_mark);

                place_mark.editor.startDrawing();

                var stateMonitor = new ymaps.Monitor(place_mark.editor.state);
                stateMonitor.add("drawing", function (newValue) {
                    $map_active = false;
                });

            } else {

                console.error('Marker type error!');
                return false;

            }

            place_mark.events.add('dragend', function () {
                save_map();
            });
            place_mark.events.add('editorstatechange', function () {
                save_map();
            });
            place_mark.events.add('geometrychange', function () {
                save_map();
            });

            $('.marker-type').val(marker_type).attr('disabled', 'true');
        }

        /**
         * Write map data in hidden field
         */
        function save_map() {

            $params.zoom = $map.getZoom();

            var coords = $map.getCenter();
            $params.center_lat = coords[0];
            $params.center_lng = coords[1];

            var type = $map.getType().split('#');
            $params.type = (type[1]) ? type[1] : 'map';

            var marks = [];
            $map.geoObjects.each(function (mark) {
                if (mark.geometry != null) { // if not collection
                    var _type = mark.geometry.getType();
                    marks.push({
                        id: postID,
                        content: content,
                        type: _type,
                        coords: mark.geometry.getCoordinates()
                    });
                };
            });

            $params.marks = marks;

            $($input).val(JSON.stringify($params));
        }

        /**
         * Geocode object address
         */
        function geocode_location(location) {

            ymaps.geocode(location, {
                results: 1
            }).then(function (res) {
                var geo_object = res.geoObjects.get(0);
                var coords = geo_object.geometry.getCoordinates();
                var bounds = geo_object.properties.get('boundedBy');
                var content = location;

                create_mark(coords, 'point', postID, content);

                $map.setBounds(bounds, {
                    checkZoomRange: true
                });

                save_map();
            });
        }

    }


    if (typeof acf.add_action !== 'undefined') {

        /*
         *  ready append (ACF5)
         *
         *  These are 2 events which are fired during the page load
         *  ready = on page load similar to $(document).ready()
         *  append = on new DOM elements appended via repeater field
         *
         *  @type	event
         *  @date	20/07/13
         *
         *  @param	$el (jQuery selection) the jQuery element which contains the ACF fields
         *  @return	n/a
         */

        acf.add_action('ready append', function ($el) {

            // search $el for fields of type 'FIELD_NAME'
            acf.get_fields({type: 'yandex-map'}, $el).each(function () {

                initialize_field($(this));

            });

        });


    } else {


        /*
         *  acf/setup_fields (ACF4)
         *
         *  This event is triggered when ACF adds any new elements to the DOM.
         *
         *  @type	function
         *  @since	1.0.0
         *  @date	01/01/12
         *
         *  @param	event		e: an event object. This can be ignored
         *  @param	Element		postbox: An element which contains the new HTML
         *
         *  @return	n/a
         */

        $(document).on('acf/setup_fields', function (e, postbox) {

            $(postbox).find('.field[data-field_type="yandex-map"]').each(function () {

                initialize_field($(this));

            });

        });


    }


})(jQuery);