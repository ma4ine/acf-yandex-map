(function ($) {

    // 'use strict';

    /**
     * Get ACF data
     */
    // var $district = $('[data-name="location-district"] input').val();
    // var $city = $('[data-name="location-city"] select option[selected="selected"]').text();
    // var $address = $('[data-name="location-address"] input').val();
    // var $location = $district + ', ' + $city + ', ' + $address;

    var blogURL = acf_yandex_locale.blog_url;
    var templateURL = acf_yandex_locale.template_url;
    var postType = acf_yandex_locale.post_type;
    var termID = acf_yandex_locale.term_id;
    var term_slug = acf_yandex_locale.term_slug;

    console.log(term_slug);
    console.log('test');

    var polygon_style = {
        fillColor: '#44A147',
        strokeColor: '#18803F',
        strokeWidth: 2,
        opacity: 0.75
    };

    /**
     * AJAX projects JSON
     */
    function getLands() {

        // console.log(blogURL + '/wp-json/wp/v2/land?project=' + termID);

        $.get({
            dataType: 'json',
            url: blogURL + '/wp-json/wp/v2/land?project=' + termID,
            success: function(response) {

                // console.log(response);

                var data = {
                    type: 'FeatureCollection',
                    features: []
                };

                $.each(response, function(index, post) {

                    // Обработаем некоторые данные заранее
                    var address = post.acf['location-district'] + ', ' + post.acf['location-city']['name'] + ', ' + post.acf['location-address'];

                    var square = post.acf[ 'land-square' ] + ' сот.';

                    if ( post.acf['landscape-pic'].length > 0 ) {
                        var slope = '<img src="' + templateURL + '/svg/landscape/' + post.acf['landscape-pic'] +'.svg" alt="Ландшафт" class="slope--img slope--img-hor">';
                    } else {
                        var slope = '';
                    }

                    if ( post.acf.status != undefined ) {
                        var status = post.acf.status.name;
                    };

                    // Проверим наличие плагина, распарсим данные
                    if ( post.acf.ymap != undefined ) {
                        var json = $.parseJSON(post.acf.ymap);
                    };

                    if ( post.acf.ymap != undefined && json.marks.length > 0 ) { // Если установлены координаты в плагине
                        // Получим координаты из плагина
                        var coords = json.marks[0].coords;
                        // Определим геометрию объекта
                        var geometryType = coords.length === 1 ? 'Polygon' : 'Point';

                    // } else { // синхрона не будет, тормозит

                        // Если нет, получим координаты из Геокодера
                        // var defaultCoords;

                        // $.get({
                        //     async: false,
                        //     url: 'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=' + address.replace( ', ', '+' ),
                        //     success: function(data) {
                        //         defaultCoords = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
                        //     }
                        // }); 

                        // var coords = defaultCoords.split(' ').reverse();
                        // var geometryType = 'Point';

                    }; // Координаты определены

                    var dataItem = {
                        type: 'Feature',
                        postType: post.type, 
                        id: post.id,
                        link: post.link,
                        options: polygonStyle,
                        geometry: {
                            type: geometryType,
                            coordinates: coords
                        },
                        properties: {
                            balloonContentHeader: 
                                '<div class="module--header">' +
                                    '<div class="module--title module--title-available">Участок №' + post.acf['land-id'] + '</div>' +
                                    '<div class="module--status status status-nopadding js-status">' + status + '</div>' +
                                '</div>',
                            balloonContentBody: 
                                '<div class="module--body">' +
                                    '<div class="module--item module--item-50 common_item">' +
                                        '<div class="common_item--title"><em>Площадь участка</em></div>' +
                                        '<div class="common_item--value">' + square + '</div>' +
                                    '</div>' +
                                    '<div class="module--item module--item-50 common_item">' +
                                        '<div class="common_item--title"><em>Стоимость</em></div>' +
                                        '<div class="common_item--value"><span class="js-money">' + post.acf.price + '</span> ₽</div>' +
                                    '</div>' +
                                    '<div class="module--item icb d-none d-lg-block">' +
                                        '<i class="icb--icon icon icon-mountain"></i>' +
                                        '<div class="icb--title">' + post.acf['spec-land'].mountain + '</div>' +
                                    '</div>' +
                                    '<div class="module--item slope slope-hor d-none d-lg-flex">' +
                                        '<div class="slope--title slope--title-hor">Уклон участка</div>' +
                                        slope + 
                                        '<div class="slope--subtitle slope--subtitle-hor js-typo">' + post.acf['landscape-descr'] + '</div>' +
                                    '</div>' +
                                '</div>',
                            balloonContentFooter:
                                '<div class="module--footer">' +
                                    // Temporary disabled modal desktop link
                                    // '<button type="button" class="module--more d-none d-lg-inline-block" data-toggle="modal" data-target="#objectModal">Подробнее об участке</button>' +
                                    // '<a href="' + post.link + '" class="module--more d-lg-none">Подробнее об участке</a>' +
                                    '<a href="' + post.link + '" class="module--more">Подробнее об участке</a>' +
                                    '<button type="button" class="module--but but but-green" data-toggle="modal" data-target="#orderModal">Забронировать</button>' +
                                '</div>',
                            hintContent: address
                        }
                    };

                    data['features'].push( dataItem );
                     
                }); // each end

                // postData( data, 'project', projectName );

            }, // success end
            error: function(data) {
                // `data` will not be JSON
                console.log('JSON Error');
            }

        });

    };

    // getLands();

    function postData( data, postType, name ) {

        // new post
        if ( postType === 'project' ) {

            $.when(
                // Post project
                $.post({
                    url : templateURL + '/map/ajax-map.php',
                    data : {
                        postType: postType,
                        name: name,
                        json : JSON.stringify(data, "", 2)
                    },
                    success: function(response) {
                        console.log('AJAX POST ' + postType.toUpperCase());
                    }
                })
            ).then(function() {
                // All is ready now, so...
            });
            
        // } else {

        //     $.when(
        //         // Post "postType"
        //         $.post({
        //             url : templateURL + '/ajax/ajax-map.php',
        //             data : {
        //                 postType: postType,
        //                 json : JSON.stringify(data, "", 2)
        //             },
        //             success: function(response) {
        //                 console.log('AJAX POST ' + postType.toUpperCase());
        //             }
        //         })
        //     ).then(function() {
        //         // All is ready now, so...
        //         // initBigMap();
        //         // ymaps.ready(initBigMap);
        //         // отключено из-за дублирования карты
        //     });

        };

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
         * Yandex map geocoder
         *
         * @type {object}
         */
        // var $geocoder;

        /**
         * Geocoder coordinates
         *
         */
        // var $coords;

        /**
         * Project collection
         *
         * @type {object}
         */
        var $collection_project;

        /**
         * Current collection
         *
         * @type {object}
         */
        var $collection_current;

        /**
         * Map edit activation
         *
         */
        // var $map_active = false;

        /// Init fields

        $element = $($el).find('.map');
        $input = ($el).find('.map-input');

        if ($element == undefined || $input == undefined) {
            console.error(acf_yandex_locale.map_init_fail);
            return false;
        }

        /// Init params

        $params = $.parseJSON($($input).val());

        /// Import objects
        // function import_lands() {

        //     return true;
             
        // };

        /// Init map

        // ymaps.ready(function () {
        //     map_init();
        // });

        ymaps.ready(function () {

            if ( $term_slug != 'no-project' ) {
            // if ( false ) {
                console.log('Import start');
                var data = templateURL + '/map/data-project-' + $term_slug + '.json';

                $.when(
                    $.get(data, function(response) {

                        if ( response.features.length > 0 ) {
                            
                            // set default params
                            $params.zoom = 13;
                            $params.center_lat = 59.99914531368303;
                            $params.center_lng = 30.72482104954271;
                            $params.type = "map"

                            $.each(response.features, function(index, val) {
                                $params.marks[index] = {
                                    "id": val.id,
                                    "content": val.id,
                                    "type": val.geometry.type,
                                    "term": val.term,
                                    "coords": val.geometry.coordinates
                                };
                            });

                        };

                    })

                ).done(function() {
                    map_init();

                }).fail(function() {
                    console.log('Project import error');
                });

            } else {

                console.log('Just map start');

                map_init();

            }
            

        });

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
            $map.behaviors.disable('scrollZoom');
            // $map.copyrights.add('&copy; Const Lab. ');

            // $map.events.add('click', function (e) {
            //     create_mark(e.get('coords'));
            //     save_map();
            // });

            $map.events.add('click', function (e) {

                // if ( $map_active === true ) {
                    create_mark(e.get('coords'));
                    save_map();
                // };

            });

            $map.events.add('typechange', function (e) {
                save_map();
            });

            $map.events.add('boundschange', function () {
                save_map();
            });

            /// Geocoder

            // if ( $params.marks.length === 0 ) { // if there are no marks
                
            //     console.log('Geocoder works here');

            //     $geocoder = ymaps.geocode( $location ); // start geocoder

            //     $geocoder.then(function (res) {

            //         var object = res.geoObjects.get(0); // get first object
            //         var coords = object.geometry.getCoordinates(); // get coords
            //         var bounds = object.properties.get('boundedBy'); // get bounds

            //         create_mark(coords, 'Point', 0, 1, ''); // create mark

            //         $map.setBounds(bounds, { checkZoomRange: true }); // show map with bounds

            //         save_map(); // save map

            //     }, function (err) {
            //         console.log('Yandex.Maps Geocoder Error');
            //     });

            // };

            /// Search Control

            // var search_controll = $map.controls.get('searchControl');
            // search_controll.options.set({
            //     noPlacemark: true,
            //     useMapBounds: true, // was false
            //     noSelect: true,
            //     kind: 'locality',
            //     width: 250
            // });

            // search_controll.events.add('resultselect', function () {
            //     // $map.geoObjects.removeAll(); // remove all placemarks
            //     // create_mark(e.get('coords')); // create mark
            //     save_map();
            // });

            /// Geo location button

            // var geo_control = $map.controls.get('geolocationControl');
            // geo_control.events.add('locationchange', function () {
            //     // $map.geoObjects.removeAll(); // don't remove placemark
            //     save_map();
            // });

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
                // $map.balloon.close();
                $map.geoObjects.removeAll();
                save_map();
                // $map_active = true;
            });

            $map.controls.add(clear_button, {top: 5, right: 5});

            /// Create peoject collection
            $collection_project = new ymaps.GeoObjectCollection({}, {
                preset: "islands#blueCircleIcon",
                strokeWidth: 4,
                geodesic: true
            });

            /// Create current collection
            $collection_current = new ymaps.GeoObjectCollection({}, {
                preset: "islands#redCircleIcon",
                strokeWidth: 4,
                geodesic: true
            });

            console.log($params);

            /// Marks load
            $($params.marks).each(function (index, mark) {
                create_mark(mark.coords, mark.type, mark.id, mark.content, mark.term);
            });

            $map.geoObjects.add($collection_project);
            $map.geoObjects.add($collection_current);


            // $collection.add(new ymaps.Placemark([37.61, 55.75]));

            // console.log($collection);
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
        function create_mark(coords, type, id, content, term) {

            var place_mark = null;

            var marker_type = (type != null) ? type.toLowerCase() : $($el).find('.marker-type').val();

            var mark_id = id;
            if (id == undefined && $params.marks.length == 0)
                mark_id = 1;
            else
                mark_id = (id == undefined) ? ($params.marks[$params.marks.length - 1].id + 1) : id;

            var mark_content = (content == undefined) ? '' : content;

            console.log(marker_type);

            if (marker_type == 'point') { // create placemark

                place_mark = new ymaps.Placemark(
                    coords,
                    {
                        iconContent: mark_id,
                        hintContent: mark_content
                        // hintContent: acf_yandex_locale.mark_hint
                    }, {
                        preset: "islands#orangeDotIcon",
                        // draggable: true
                    }
                );

                place_mark.events.add('contextmenu', function () {
                    $map.geoObjects.remove(this);
                    save_map();
                    // $map_active = true;
                }, place_mark);

                // place_mark.events.add('dragend', function () {
                //     save_map();
                // });
                // place_mark.properties.set('id', mark_id);
                // place_mark.properties.set('content', mark_content);

                // $map.geoObjects.add(place_mark);


            } else { // if mark is circle (polygon)

                // $map.geoObjects.removeAll(); // remove all placemarks

                // Если координаты всего две то сбросим их для рисования многоугольника с нуля 
                if ( coords.length === 2 ) {
                    coords = [];
                };

                // Создаем многоугольник без вершин.
                place_mark = new ymaps.Polygon(coords, {}, {
                    draggable: true,
                    // Курсор в режиме добавления новых вершин.
                    editorDrawingCursor: "crosshair",
                    // Максимально допустимое количество вершин.
                    editorMaxPoints: 5,
                    // Цвет заливки.
                    fillColor: '#44A147',
                    // Цвет обводки.
                    strokeColor: '#18803F',
                    // Ширина обводки.
                    strokeWidth: 2
                });

                // place_mark.properties.set('id', mark_id);
                // place_mark.properties.set('content', mark_content);

                // Добавляем многоугольник на карту.
                // $map.geoObjects.add(place_mark);

                // В режиме добавления новых вершин меняем цвет обводки многоугольника.
                // var stateMonitor = new ymaps.Monitor(place_mark.editor.state);
                // stateMonitor.add("drawing", function (newValue) {
                //     place_mark.options.set("strokeColor", newValue ? '#FF0000' : '#0000FF');
                //     console.log('test');
                //     if ( newValue === false ) {
                //         save_map(); // сохраняем карту при окончании редактирования
                //     };
                // });

                // Включаем режим редактирования с возможностью добавления новых вершин.
                // if ( $map_active === true) {
                    place_mark.editor.startDrawing();
                // }

            }

            place_mark.properties.set('id', mark_id);
            place_mark.properties.set('content', mark_content);

            console.log(term);

            // Создадим коллекцию геообъектов и зададим опции.
            if (term != undefined) {

                $collection_project.add(place_mark);

                // console.log($collection);                

            } else {

                // console.log(place_mark);

                place_mark.options.set('draggable', 'true');

                $collection_current.add(place_mark);
                // $map.geoObjects.add(place_mark);

                // Сохраним состояние карты после событий с меткой или полигоном
                place_mark.events.add('dragend', function () {
                    save_map();
                });
                place_mark.events.add('editorstatechange', function () {
                    save_map();
                });
                place_mark.events.add('geometrychange', function () {
                    save_map();
                });

            }


            /// Выключили удаление метки правой кнопкой
            // place_mark.events.add('contextmenu', function () {
            //     $map.geoObjects.remove(this);
            //     save_map();
            // }, place_mark);
            
            /// Выключили балун
            // place_mark.events.add('click', function () {
            //     if (!this.balloon.isOpen()) {
            //         show_mark_editor(this);
            //     }
            // }, place_mark);
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
            // $map.geoObjects.each(function (mark) {
            $collection_current.each(function (mark) {

                console.log(mark);

                if ( mark.geometry != null ) {

                    var _type = mark.geometry.getType();
                    marks.push({
                        id: mark.properties.get('id'),
                        content: mark.properties.get('content'),
                        type: _type,
                        coords: mark.geometry.getCoordinates(),
                        // circle_size: (_type == 'Circle') ? mark.geometry.getRadius() : 0
                    });
                }
            });
            $params.marks = marks;

            console.log($params);

            $($input).val(JSON.stringify($params));

            // $map_active = false;
        }

        /**
         * Change marker type state
         */
        $('.marker-type').on('change', function () {
            var label = $(this).parent().next('th').children(0);
            var select = $(this).parent().next('th').next('td').children(0);
            if (this.value == 'circle') {
                label.removeClass('hidden');
                select.removeClass('hidden');
            } else {
                label.addClass('hidden');
                select.addClass('hidden');
            }
        });

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