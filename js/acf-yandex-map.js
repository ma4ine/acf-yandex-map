(function ($) {

    'use strict';

    /**
     * Get ACF data
     */
    var blogURL = acf_yandex_locale.blog_url;
    var templateURL = acf_yandex_locale.template_url;
    var postID = acf_yandex_locale.post_id;
    var postType = acf_yandex_locale.post_type;
    var termID = acf_yandex_locale.term_id;
    var term_slug = acf_yandex_locale.term_slug;

    var mark_style_house_green = {
        iconLayout: 'default#image',
        iconImageHref: templateURL + '/svg/map/mark-house-2.svg',
        iconImageSize: [36, 36],
        iconImageOffset: [-6, -18]
    };

    var mark_style_house_orange = {
        iconLayout: 'default#image',
        iconImageHref: templateURL + '/svg/map/mark-house-1.svg',
        iconImageSize: [36, 36],
        iconImageOffset: [-6, -18]
    };

    var polygon_style_green = {
        fillColor: '#44A147',
        strokeColor: '#18803F',
        strokeWidth: 2,
        opacity: 0.7
    };

    var polygon_style_orange = {
        fillColor: 'rgba(0,0,0,0.00)',
        strokeColor: '#EC6B23',
        strokeWidth: 2,
        opacity: 0.7
    };

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

        if ( term_slug != 'no-project' && term_slug != undefined ) {

            console.log('Import start');

            var data = templateURL + '/map/data-land-' + term_slug + '.json';

            $.when(

                $.get(data, function(response) {

                    if ( response.features.length > 0 ) {

                        $.each(response.features, function(index, val) {
                            $project[index] = {
                                "id": val.id,
                                "content": val.id,
                                "type": val.geometry.type,
                                // "term": val.term,
                                "coords": val.geometry.coordinates
                            };
                        });

                    } else {

                        console.error('Data import error!');

                    }

                })

            ).done(function() {

                console.log('Import success & map start');

                ymaps.ready(function () {
                    // let's go
                    map_init();
                });

            }).fail(function() {

                console.error('Data import error!');

            });

        } else {

            console.log('Just map start');

            ymaps.ready(function () {
                // let's go
                map_init();
            });

        };

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
            $map.behaviors.disable('scrollZoom');
            $map.copyrights.add('&copy; DKI ');

            $map.events.add('click', function (e) {
                if ($map_active) {
                    create_mark(e.get('coords'));
                    save_map();
                }
            });

            $map.events.add('typechange', function (e) {
                save_map();
            });

            $map.events.add('boundschange', function () {
                save_map();
            });

            /// Geo location button

            var geo_control = $map.controls.get('geolocationControl');
            geo_control.events.add('locationchange', function () {
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

            $map.controls.add(clear_button, {top: 5, right: 5});

            /// Collection

            $collection = new ymaps.GeoObjectCollection(null, {
                preset: 'islands#yellowIcon'
            });

            /// Marks import

            $($project).each(function(index, mark) {
                if (mark.id != postID) { // if not this post
                    import_mark(mark.coords, mark.type, mark.id);
                }
            });

            /// Import load

            $map.geoObjects.add($collection);

            /// Marks load

            $($params.marks).each(function (index, mark) {
                create_mark(mark.coords, mark.type, mark.id, mark.content);
            });

        }

        /**
         * Import geo mark
         *
         * @param {Array} coords
         * @param {string} type Point type, Point or Circle
         * @param {int} term
         * @param {int} id
         * @param {string} content
         */
        function import_mark(coords, type, id) {

            // console.log(type);

            var place_mark = null;
            var marker_type = type.toLowerCase();
            var mark_id = id;
            var edit_url = window.location.origin + '/wp-admin/post.php?post=' + mark_id + '&action=edit';

            var place_mark_content = {
                balloonContentBody: '<span>Объект №' + mark_id + '</span><br><a href="' + edit_url + '">Редактировать</a>',
                hintContent: mark_id
            }

            if (marker_type == 'point') { // create placemark

                place_mark = new ymaps.Placemark(
                    coords,
                    place_mark_content,
                    mark_style_house_orange
                );

            } else if (marker_type == 'polygon') {

                place_mark = new ymaps.Polygon(
                    [coords],
                    place_mark_content,
                    polygon_style_orange
                );

            } else {

                console.error('Mark import error!')
                return false;

            }

            $collection.add(place_mark);
        }

        /**
         * Create geo mark
         *
         * @param {Array} coords
         * @param {string} type Point type, Point or Circle
         * @param {int} size Circle size in meters
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
                        content: postID,
                        type: _type,
                        coords: mark.geometry.getCoordinates()
                    });
                };
            });

            $params.marks = marks;

            $($input).val(JSON.stringify($params));
        }

        /**
         * Change marker type state
         */
        // $('.marker-type').on('change', function () {
        //     var label = $(this).parent().next('th').children(0);
        //     var select = $(this).parent().next('th').next('td').children(0);
        //     if (this.value == 'circle') {
        //         label.removeClass('hidden');
        //         select.removeClass('hidden');
        //     } else {
        //         label.addClass('hidden');
        //         select.addClass('hidden');
        //     }
        // });


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