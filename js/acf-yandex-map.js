(function ($) {

    // 'use strict';

    /**
     * Get ACF data
     */
    var $district = $('[data-name="location-district"] input').val();
    var $city = $('[data-name="location-city"] select option[selected="selected"]').text();
    var $address = $('[data-name="location-address"] input').val();
    var $location = $district + ', ' + $city + ', ' + $address;

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
         */
        var $geocoder;

        /**
         * Geocoder coordinates
         *
         */
        var $coords;

        /// Init fields

        $element = $($el).find('.map');
        $input = ($el).find('.map-input');

        if ($element == undefined || $input == undefined) {
            console.error(acf_yandex_locale.map_init_fail);
            return false;
        }

        /// Init params

        $params = $.parseJSON($($input).val());

        /// Init map

        ymaps.ready(function () {
            map_init();
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
            $map.copyrights.add('&copy; Const Lab. ');

            $map.events.add('click', function (e) {
                create_mark(e.get('coords'));
                save_map();
            });

            $map.events.add('typechange', function (e) {
                save_map();
            });

            $map.events.add('boundschange', function () {
                save_map();
            });

            /// Project Lands Import (temporary disabled)

            // var blogURL = acf_yandex_locale.blog_url;
            // var postType = acf_yandex_locale.post_type;
            // var termID = acf_yandex_locale.term_id;

            // console.log(acf_yandex_locale.current_screen);

            // if post type is 'land'
            // if ( postType === 'land' ) {
            //     // get lands
            //     getLands();

            //     function getLands() {

            //         $.ajax({
            //             type: 'GET',
            //             dataType: 'json',
            //             url: blogURL + '/wp-json/wp/v2/land?project=' + termID,
            //             success: function(response) {

            //                 // console.log(response[0]);

            //                 var data = {
            //                     type: 'FeatureCollection',
            //                     features: []
            //                 };

            //                 $.each(response, function(index, post) {

            //                     // Обработаем некоторые данные заранее
            //                     var address = post.acf['location-district'] + ', ' + post.acf['location-city']['name'] + ', ' + post.acf['location-address'];

            //                     // var square = post.acf[ 'land-square' ] + ' сот.';

            //                     // if ( post.acf['landscape-pic'].length > 0 ) {
            //                     //     var slope = '<img src="' + templateURL + '/svg/landscape/' + post.acf['landscape-pic'] +'.svg" alt="Ландшафт" class="slope--img slope--img-hor">';
            //                     // } else {
            //                     //     var slope = '';
            //                     // }

            //                     // if ( post.acf.status != undefined ) {
            //                     //     var status = post.acf.status.name;
            //                     // };

            //                     // Проверим наличие плагина, распарсим данные
            //                     if ( post.acf.ymap != undefined ) {
            //                         var json = $.parseJSON(post.acf.ymap);
            //                     };

            //                     if ( post.acf.ymap != undefined && json.marks.length > 0 ) { // Если установлены координаты в плагине
            //                         // Получим координаты из плагина
            //                         var coords = json.marks[0].coords;
            //                         // Определим геометрию объекта
            //                         var geometryType = coords.length === 1 ? 'Polygon' : 'Point';

            //                     } else {

            //                         // Если нет, получим координаты из Геокодера
            //                         var defaultCoords;

            //                         $.get({
            //                             async: false,
            //                             url: 'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=' + address.replace( ', ', '+' ),
            //                             success: function(data) {
            //                                 defaultCoords = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
            //                             }
            //                         }); 

            //                         var coords = defaultCoords.split(' ').reverse();
            //                         var geometryType = 'Point';

            //                     }; // Координаты определены

            //                     var dataItem = {
            //                         type: 'Feature',
            //                         // postType: post.type, 
            //                         id: post.id,
            //                         // link: post.link,
            //                         options: {
            //                             fillColor: '#44A147',
            //                             strokeColor: '#18803F',
            //                             strokeWidth: 2,
            //                             opacity: 0.25
            //                         },
            //                         geometry: {
            //                             type: geometryType,
            //                             coordinates: coords
            //                         },
            //                         properties: {
            //                             hintContent: post.title.rendered
            //                         }
            //                     };

            //                     data['features'].push( dataItem );
                                 
            //                 }); // each end

            //                 postData( data );

            //             }, // success end
            //             error: function(data) {
            //                 // `data` will not be JSON
            //                 console.log('JSON Error');
            //             }

            //         });

            //     };

            //     // post lands to json
            //     function postData( data ) {

            //         $.post({
            //             url : blogURL + '/wp-content/plugins/acf-yandex-map/ajax/ajax-map.php',
            //             data : {
            //                 // postType: postType,
            //                 json : JSON.stringify(data, "", 2)
            //             },
            //             success: function(response) {
            //                 console.log('AJAX POST PROJECT');
            //                 // let's load data to map
            //                 loadData();
            //             }
            //         })  

            //     };

            //     // load data to map
            //     function loadData() {
            //         $.get({
            //             url: blogURL + '/wp-content/plugins/acf-yandex-map/ajax/data-project.json'
            //         }).done(function(data) {
            //             // create object manager
            //             var objectManager = new ymaps.ObjectManager();
            //             // set-up object manager
            //             objectManager.objects.options.set({
            //                 preset: 'islands#darkOrangeDotIcon'
            //             });
            //             // add data
            //             objectManager.add(data);
            //             // add object manager to map
            //             $map.geoObjects.add(objectManager);
            //             // set bounds
            //             // $map.setBounds(objectManager.getBounds());
            //         });
            //     };

                
            // };

            /// Geocoder

            if ( $params.marks.length === 0 ) { // if there are no marks
                
                // console.log('Geocoder works here');

                $geocoder = ymaps.geocode( $location ); // start geocoder

                $geocoder.then(function (res) {

                    var object = res.geoObjects.get(0); // get first object
                    var coords = object.geometry.getCoordinates(); // get coords
                    var bounds = object.properties.get('boundedBy'); // get bounds

                    create_mark(coords, 'Point', 0, 1, ''); // create mark

                    $map.setBounds(bounds, { checkZoomRange: true }); // show map with bounds

                    save_map(); // save map

                }, function (err) {
                    console.log('Yandex.Maps Geocoder Error');
                });

            };

            /// Search Control

            var search_controll = $map.controls.get('searchControl');
            search_controll.options.set({
                noPlacemark: true,
                useMapBounds: true, // was false
                noSelect: true,
                kind: 'locality',
                width: 250
            });

            search_controll.events.add('resultselect', function () {
                // $map.geoObjects.removeAll(); // remove all placemarks
                // create_mark(e.get('coords')); // create mark
                save_map();
            });

            /// Geo location button

            var geo_control = $map.controls.get('geolocationControl');
            geo_control.events.add('locationchange', function () {
                // $map.geoObjects.removeAll(); // don't remove placemark
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
                $map.balloon.close();
                $map.geoObjects.removeAll();
                save_map();
            });

            $map.controls.add(clear_button, {top: 5, right: 5});

            /// Marks load

            $($params.marks).each(function (index, mark) {
                create_mark(mark.coords, mark.type, mark.circle_size, mark.id, mark.content);
            });

            /// Map balloon

            var center = $map.getCenter();

            $map.balloon.events.add('autopanbegin', function () {
                center = $map.getCenter();
            });

            $map.balloon.events.add('close', function () {
                $map.setCenter(center, $map.getZoom(), {
                    duration: 500
                });
            });

            $map.balloon.events.add('open', function () {
                $($el).find('.ya-import form').submit(function () {
                    import_map($(this).serializeArray());
                    return false;
                });
                $($el).find('.ya-import textarea, .ya-export textarea').focus().select();
            });

            /// Import Export Controls

            var import_button = new ymaps.control.Button({
                data: {
                    image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIxNnB4IiBoZWlnaHQ9IjE2cHgiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxnPjxwYXRoIGZpbGw9IiM2NjY2NjYiIGQ9Ik0xMi42LDRoLTEuMDIxYy0wLjI3NiwwLTAuNSwwLjIyNC0wLjUsMC41czAuMjI0LDAuNSwwLjUsMC41SDEyLjZDMTMuMzk4LDUsMTQsNS42NDUsMTQsNi41djZjMCwwLjg1NS0wLjYwMiwxLjUtMS40LDEuNWgtMTBDMS43NDgsMTQsMSwxMy4yOTksMSwxMi41di02QzEsNS43MDEsMS43NDgsNSwyLjYsNWgwLjc2OGMwLjI3NiwwLDAuNS0wLjIyNCwwLjUtMC41UzMuNjQ1LDQsMy4zNjgsNEgyLjZDMS4xOTEsNCwwLDUuMTQ1LDAsNi41djZDMCwxMy44NTUsMS4xOTEsMTUsMi42LDE1aDEwYzEuMzQ2LDAsMi40LTEuMDk4LDIuNC0yLjV2LTZDMTUsNS4wOTgsMTMuOTQ1LDQsMTIuNiw0eiIvPjxwYXRoIGZpbGw9IiM2NjY2NjYiIGQ9Ik03LjEzMywxMC4wMzRjMC4xMzcsMC4zMTUsMC41NjgsMC40MTMsMC43MDMsMC4xMDFjMC4wMTItMC4wMjksMS4xNzctMi40MTksMS45MjktMy4zNzNjMC4yNjQtMC4zMzUtMC4wOTUtMC42NC0wLjQ2My0wLjUzQzguOTgsNi4zMjgsNy45NjYsNy4wNTIsNy45NjYsNy4xMDFWMC41NzZjMC0wLjI3Ni0wLjE4OC0wLjU5MS0wLjQ2NS0wLjU5MWMtMC4wMDIsMC0wLjAwMywwLjAwMS0wLjAwNSwwLjAwMXMwLjAwMS0wLjAwMS0wLjAwMS0wLjAwMWMtMC4yNzYsMC0wLjQ5NSwwLjIyNC0wLjQ5NSwwLjVWNy4wMWMwLTAuMDQ5LTEuMDE4LTAuNzc0LTEuMzM5LTAuODY5Yy0wLjM2OC0wLjExLTAuNzE4LDAuMTg3LTAuNDY2LDAuNTNDNS44Nyw3LjU4Nyw2LjY1OSw4Ljk0Myw3LjEzMywxMC4wMzR6Ii8+PC9nPjwvc3ZnPg==',
                    title: acf_yandex_locale.btn_import
                },
                options: {
                    selectOnClick: false
                }
            });

            import_button.events.add('click', function () {
                $map.balloon.close();
                $map.balloon.open($map.getBounds()[0], '<div class="ya-import" style="margin: 5px"><p class="description">' + acf_yandex_locale.import_desc + '</p><form><textarea name="import" cols="40" rows="5" autofocus></textarea><br><input type="submit" class="button" name="submit" value="' + acf_yandex_locale.import_go + '"/></form></div>');

            });

            var export_button = new ymaps.control.Button({
                data: {
                    image: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIxNnB4IiBoZWlnaHQ9IjE2cHgiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxnPjxwYXRoIGZpbGw9IiM2NjY2NjYiIGQ9Ik0xMi42LDRoLTEuMDIxYy0wLjI3NiwwLTAuNSwwLjIyNC0wLjUsMC41czAuMjI0LDAuNSwwLjUsMC41SDEyLjZDMTMuMzk4LDUsMTQsNS42NDUsMTQsNi41djZjMCwwLjg1NS0wLjYwMiwxLjUtMS40LDEuNWgtMTBDMS43NDgsMTQsMSwxMy4yOTksMSwxMi41di02QzEsNS43MDEsMS43NDgsNSwyLjYsNWgwLjc2OGMwLjI3NiwwLDAuNS0wLjIyNCwwLjUtMC41UzMuNjQ1LDQsMy4zNjgsNEgyLjZDMS4xOTEsNCwwLDUuMTQ1LDAsNi41djZDMCwxMy44NTUsMS4xOTEsMTUsMi42LDE1aDEwYzEuMzQ2LDAsMi40LTEuMDk4LDIuNC0yLjV2LTZDMTUsNS4wOTgsMTMuOTQ1LDQsMTIuNiw0eiIvPjxwYXRoIGZpbGw9IiM2NjY2NjYiIGQ9Ik03Ljg2OCwwLjIyNWMtMC4xMzctMC4zMTUtMC42MDItMC4zMjItMC43MzctMC4wMUM3LjExOCwwLjI0NCw1Ljk1NCwyLjYzNCw1LjIwMiwzLjU4OGMtMC4yNjQsMC4zMzUsMC4wOTUsMC42NCwwLjQ2MywwLjUzQzUuOTg2LDQuMDIyLDcsMy4yOTgsNywzLjI0OXY2LjUyNmMwLDAuMjc2LDAuMjIzLDAuNSwwLjQ5OSwwLjVjMC4wMDIsMCwwLjAwMy0wLjAwMSwwLjAwNS0wLjAwMXMtMC4wMDEsMC4wMDEsMC4wMDEsMC4wMDFjMC4yNzYsMCwwLjQ5NS0wLjIyNCwwLjQ5NS0wLjVWMy4yNDljMCwwLjA0OSwxLjAxOCwwLjc3NCwxLjMzOSwwLjg2OWMwLjM2OCwwLjExLDAuNzE4LTAuMTg3LDAuNDY2LTAuNTNDOS4xMzEsMi42NzEsOC4zNDEsMS4zMTUsNy44NjgsMC4yMjV6Ii8+PC9nPjwvc3ZnPg==',
                    title: acf_yandex_locale.btn_export
                },
                options: {
                    selectOnClick: false
                }
            });

            export_button.events.add('click', function () {
                $map.balloon.close();

                $map.balloon.open($map.getBounds()[0], '<div class="ya-export" style="margin: 5px"><p class="description">' + acf_yandex_locale.export_desc + '</p><textarea cols="40" rows="5" readonly>'
                + JSON.stringify($params) + '</textarea></div>');
            });

            /// Mark editor

            $map.events.add('balloonopen', function () {
                $('.ya-editor textarea').focus();

                $('.ya-editor .remove').click(function (event) {
                    var mark_id = $(event.currentTarget).parent('form').children('input[type="hidden"]').val();
                    if (mark_id == undefined) return false;

                    $map.balloon.close();
                    $map.geoObjects.each(function (mark) {
                        if (mark.properties.get('id') == mark_id)
                            $map.geoObjects.remove(mark);
                    });

                    return false;
                });

                $('.ya-editor form').submit(function () {
                    var data = $(this).serializeArray();
                    var form = {};
                    $.map(data, function (n, i) {
                        form[n['name']] = n['value'];
                    });

                    $map.geoObjects.each(function (mark) {
                        if (mark.properties.get('id') == form.id) {
                            mark.properties.set('content', form.content);
                            save_map();
                        }
                    });

                    $map.balloon.close();

                    return false;
                });

            });

            $map.controls.add(export_button, {top: 5, right: 5});
            $map.controls.add(import_button, {top: 5, right: 5});
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
        function create_mark(coords, type, size, id, content) {

            var place_mark = null;

            var marker_type = (type != null) ? type.toLowerCase() : $($el).find('.marker-type').val();

            var mark_id = id;
            if (id == undefined && $params.marks.length == 0)
                mark_id = 1;
            else
                mark_id = (id == undefined) ? ($params.marks[$params.marks.length - 1].id + 1) : id;

            var mark_content = (content == undefined) ? '' : content;

            if (marker_type == 'point') { // create placemark


                $map.geoObjects.removeAll(); // remove all placemars

                place_mark = new ymaps.Placemark(
                    coords,
                    {
                        //iconContent: mark_id,
                        hintContent: acf_yandex_locale.mark_hint
                    }, {
                        preset: "islands#orangeDotIcon",
                        draggable: true
                    }
                );

                place_mark.events.add('contextmenu', function () {
                    $map.geoObjects.remove(this);
                    save_map();
                }, place_mark);

                // place_mark.events.add('dragend', function () {
                //     save_map();
                // });
                place_mark.properties.set('id', mark_id);
                place_mark.properties.set('content', mark_content);

                $map.geoObjects.add(place_mark);


            } else { // if mark is circle (polygon)

                $map.geoObjects.removeAll(); // remove all placemarks

                var circle_size = (size != null) ? size : (parseInt($($el).find('.circle-size').val()) / 2);

                place_mark = new ymaps.Circle([
                    coords,
                    circle_size
                ], {
                    hintContent: acf_yandex_locale.mark_hint
                }, {
                    draggable: true,
                    opacity: 0.5,
                    fillOpacity: 0.1,
                    fillColor: "#DB709377",
                    strokeColor: "#990066",
                    strokeOpacity: 0.7,
                    strokeWidth: 5
                });

                place_mark.events.add('contextmenu', function () {
                    $map.geoObjects.remove(this);
                    save_map();
                }, place_mark);

                place_mark.events.add('dragend', function () {
                    save_map();
                });
                place_mark.properties.set('id', mark_id);
                place_mark.properties.set('content', mark_content);

                $map.geoObjects.add(place_mark);

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

                place_mark.properties.set('id', mark_id);
                place_mark.properties.set('content', mark_content);

                // Добавляем многоугольник на карту.
                $map.geoObjects.add(place_mark);

                // В режиме добавления новых вершин меняем цвет обводки многоугольника.
                var stateMonitor = new ymaps.Monitor(place_mark.editor.state);
                stateMonitor.add("drawing", function (newValue) {
                    place_mark.options.set("strokeColor", newValue ? '#FF0000' : '#0000FF');
                    console.log('test');
                    if ( newValue === false ) {
                        save_map(); // сохраняем карту при окончании редактирования
                    };
                });

                // Включаем режим редактирования с возможностью добавления новых вершин.
                place_mark.editor.startDrawing();

            }

            // Сохраним состояние карты после драга метки или полигона
            place_mark.events.add('dragend', function () {
                save_map();
            });
            

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
            $map.geoObjects.each(function (mark) {
                var _type = mark.geometry.getType();
                marks.push({
                    id: mark.properties.get('id'),
                    content: mark.properties.get('content'),
                    type: _type,
                    coords: mark.geometry.getCoordinates(),
                    circle_size: (_type == 'Circle') ? mark.geometry.getRadius() : 0
                });
            });
            $params.marks = marks;

            $($input).val(JSON.stringify($params));
        }

        /**
         * Import map from json
         * @param data
         * @returns {boolean}
         */
        function import_map(data) {

            if (data.length == 0)
                return false;

            if (data[0].name != 'import')
                return false;

            try {
                var imported = $.parseJSON(data[0].value);
            }
            catch (err) {
                console.error(err, 'Import map error');
                alert('Import map error');
                return false;
            }

            $params = imported;

            map_init();

            return false;
        }

        /**
         * Show mark editor
         * @param mark
         */
        function show_mark_editor(mark) {
            var html = '<div class="ya-editor" style="margin: 5px"><form name="mark"><input type="hidden" name="id" value="' +
                mark.properties.get('id') + '"><textarea name="content" rows="5" cols="40">' + mark.properties.get('content') +
                '</textarea><input type="submit" class="button button-primary" value="' + acf_yandex_locale.mark_save +
                '"/>&nbsp;<button class="button remove">' + acf_yandex_locale.mark_remove + '</button></form></div>';

            $map.balloon.open(mark.geometry.getCoordinates(), html);

            //console.info(mark.properties.get('id'));
            //console.info(mark.properties.get('content'));


            //$('input[name="color"]').wpColorPicker({});
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