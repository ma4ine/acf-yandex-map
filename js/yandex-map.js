(function ($) {

    // 'use strict';

    /**
     * Plugin url
     */
    var plugin_url = yandex_locale.plugin_url;

    /**
     * Include common vars
     */
    //= 'includes/common.js'

    ymaps.ready(function () {

        var $maps = $('.yandex-map');
        $maps.each(function (index, value) {
            var $mapElement = $(value),
                id = $mapElement.attr('id');

            if (id !== undefined && window[id] !== undefined) {

                var $params = $.parseJSON(window[id]['params']);

                var $map = new ymaps.Map(id, {
                    zoom: $params.zoom,
                    center: [$params.center_lat, $params.center_lng],
                    // type: 'yandex#' + $params.type,
                    // behaviors: ['dblClickZoom', 'multiTouch', 'drag']
                }, {
                    // minZoom: 10
                });

                $map.controls.remove('trafficControl');
                $map.controls.remove('searchControl');
                $map.controls.remove('geolocationControl');

                // Object map (need test)!
                if ($params.marks != undefined) {
                   
                    $($params.marks).each(function (index, mark) {
                        var place_mark = null;

                        if (mark.type == 'Point') { // create placemark

                            place_mark = new ymaps.Placemark(mark.coords, {
                                balloonContent: mark.content
                            });

                        } else { // if mark is circle

                            place_mark = new ymaps.Circle([
                                mark.coords,
                                mark.circle_size
                            ], {
                                balloonContent: mark.content
                            }, {
                                opacity: 0.5,
                                fillOpacity: 0.1,
                                fillColor: "#DB709377",
                                strokeColor: "#990066",
                                strokeOpacity: 0.7,
                                strokeWidth: 5
                            });

                        }

                        $map.geoObjects.add(place_mark);
                    });

                }

                // Main map
                if (id === 'ymap_full') {

                    $object_manager = new ymaps.ObjectManager({
                        // doesn't works with polygon
                        // clusterize: true,
                        // gridSize: 32

                        // disable default baloon
                        geoObjectOpenBalloonOnClick: false,
                    });

                    // set common style
                    var object_style = Object.assign( {}, mark_style_house_orange, polygon_style_green );
                    $object_manager.objects.options.set(object_style);

                    function compile_baloon_data(object_json) {

                        if (!object_json) return 'Ошибка!';

                        var object = $.parseJSON(object_json);

                        var baloon_data = 
                                '<div class="module--header">' +
                                    '<div class="module--title">' +
                                        '<div class="module--suptitle">' + object.offer_type + '</div>' +
                                        object.title +
                                    '</div>' +
                                '</div>' +
                                '<div class="module--body">' +
                                    '<div class="module--item icb">' +
                                        '<i class="icb--icon icon icon-location"></i>' +
                                        '<div class="icb--title">' + object.location + '</div>' +
                                    '</div>' +
                                    '<div class="module--item module--item-50">' +
                                        '<img src="' + object.thumb_url + '" alt="Фото участка" class="module--pic">' +
                                    '</div>' +
                                    '<div class="module--item module--item-50">' +
                                        '<div class="common_item">' +
                                            '<div class="common_item--title"><em>Площадь</em></div>' +
                                            '<div class="common_item--value">' + object.square + '</div>' +
                                        '</div>' +
                                        '<div class="common_item">' +
                                            '<div class="common_item--title"><em>Стоимость</em></div>' +
                                            '<div class="common_item--value">' + object.price + ' ₽</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="module--footer module--footer-center">' +
                                    '<a href="' + object.link + '" class="module--but but but-green">Подробнее</a>' +
                                '</div>';
                        
                        return baloon_data;
                    }


                    function load_balloon_data(object_id, post_id) {

                        var deferred = ymaps.vow.defer();

                        $.get({
                            url: yandex_locale.ajax_url,
                            data: {
                                action: 'ymap_object_load',
                                nonce_code: yandex_locale.nonce,
                                post_id: post_id,
                            }
                        })
                        .done(function(data) {
                            console.log("Object data loaded");
                            var baloon_data = compile_baloon_data(data);
                            deferred.resolve(baloon_data);
                        })
                        .fail(function() {
                            console.error('Object data error');
                            deferred.resolve('Ошибка!');
                        });
                            
                        return deferred.promise();
                    }

                    function has_balloon_data(object_id) {
                        return $object_manager.objects.getById(object_id).properties.balloonContent;
                    }

                    $object_manager.objects.events.add('click', function (e) {
                        var object_id = e.get('objectId'),
                            obj = $object_manager.objects.getById(object_id),
                            postId = obj.id;
                        if (has_balloon_data(object_id)) {
                            $object_manager.objects.balloon.open(object_id);
                        } else {
                            obj.properties.balloonContent = "Идет загрузка данных...";
                            $object_manager.objects.balloon.open(object_id);

                            load_balloon_data(object_id, postId).then(function (data) {
                                obj.properties.balloonContent = data;
                                $object_manager.objects.balloon.setData(obj);
                            });

                        }
                    });
                    
                    // load objects
                    function load_objects(data_type) {

                        $map.geoObjects.add($object_manager);

                        var plugin_url = window[id]['plugin_url'];

                        $.ajax({
                            url: plugin_url + 'json/' + data_type + '.json'
                        })
                        .done(function(data) {
                            $object_manager.add(data);
                            console.log('Map data loaded');
                            $map.setBounds($map.geoObjects.getBounds(), {
                                checkZoomRange: true
                            });
                        })
                        .fail(function() {
                            console.error("Map data error");
                        });
                    }

                    $('a.js-map-link').on('click', function() {
                        $object_manager.removeAll()
                        load_objects('land-vsevolozhsk');
                    });


                    $('button.js-map-link').on('click', function() {
                        $object_manager.removeAll()
                        load_objects('land-tajtsy');
                    });

                }

            }
        });

    });

})(jQuery);