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
                $map.options.set('balloonMaxWidth', 290);

                // Object map
                if ($params.marks != undefined) {
                   
                    $($params.marks).each(function (index, mark) {
                        var place_mark = null;

                        if (mark.type == 'Point') { // create placemark

                            place_mark = new ymaps.Placemark(
                                mark.coords,
                                {},
                                mark_style_house_green
                            );

                        } else if (mark.type == 'Polygon') { // if mark is polygon

                            place_mark = new ymaps.Polygon(
                                mark.coords, 
                                {}, 
                                polygon_style_green 
                            );

                        }

                        $map.geoObjects.add(place_mark);
                    });

                };

                // Main map
                if (id === 'ymap_full' || id === 'ymap_project' ) {

                    $object_manager = new ymaps.ObjectManager({
                        // doesn't works with polygon
                        // clusterize: true,
                        // gridSize: 32

                        // disable default baloon
                        geoObjectOpenBalloonOnClick: false,
                    });

                    $collection = new ymaps.GeoObjectCollection(null, {
                        // presets
                    });

                    $map.geoObjects.add($object_manager);

                    $object_manager.add($collection);

                    // $map.geoObjects.add($collection);

                    // $map.geoObjects.add($object_manager);

                    // set common style
                    // var object_style = Object.assign( {}, mark_style_house_orange, polygon_style_green );
                    // $object_manager.objects.options.set(object_style);

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
                    
                    // load objects method
                    function load_objects(filter) {

                        // $map.geoObjects.add($object_manager);

                        $.post({
                            url: yandex_locale.ajax_url,
                            data: {
                                action: 'ymaps_json_post',
                                nonce_code: yandex_locale.nonce,
                                data: filter
                            }
                        })
                        .done(function(response) {

                            // $object_manager.add(response);

                            var data = $.parseJSON(response);

                            // var parsed_data = jQuery.parseJSON(data);
                            // var features
                            // console.log(parsed_data);
                            // console.log('Map data loaded');
                            // $map.setBounds($map.geoObjects.getBounds(), {
                            //     checkZoomRange: true
                            // });

                            if ( data.features.length > 0 ) {

                                var objects = [];

                                console.log(data.features);

                                $.each(data.features, function(index, val) {
                                    // objects[index] = {
                                    //     "id": val.id,
                                    //     "content": val.id,
                                    //     "type": val.geometry.type,
                                    //     "coords": val.geometry.coordinates,
                                    //     "status": (val.status) ? val.status.slug : false
                                    // };
                                    var status = (val.status) ? val.status.slug : false;
                                    import_object(val.geometry.coordinates, val.geometry.type, val.id, status);
                                });

                                // $(objects).each(function(index, mark) {
                                //     // if (mark.id != postID) { // if not this post
                                //         import_object(mark.coords, mark.type, mark.id, mark.status);
                                //     // }
                                // });

                                console.log('Map data loaded');

                                console.log($collection);

                                // $map.setBounds($map.geoObjects.getBounds(), {
                                //     checkZoomRange: true
                                // });



                            } else {

                                console.error("Map data error");
                            };
                        });
                        // .fail(function() {
                        //     console.error("Map data error");
                        // });
                    }

                    // import mark method
                    function import_object(coords, type, id, status) {

                        // console.log($object_manager);

                        var place_mark = null;
                        var marker_type = type.toLowerCase();
                        var mark_id = id;
                        var edit_url = window.location.origin + '/wp-admin/post.php?post=' + mark_id + '&action=edit';

                        // var objects = [];
                        // var place_mark_content = {
                        //     balloonContentBody: '<span>Объект №' + mark_id + '</span><br><a href="' + edit_url + '">Редактировать</a>',
                        //     hintContent: mark_id
                        // }

                        // console.log(status);

                        if (marker_type == 'point') { // create placemark

                            var mark_style;

                            // if ( is_project ) { // project admin page

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
                                        mark_style = mark_style_house_green;
                                        break;
                                }

                            // } else {
                                // mark_style = mark_style_house_orange;
                            // }

                            place_mark = new ymaps.Placemark(
                                coords,
                                // place_mark_content,
                                {},
                                mark_style
                            );

                            // $map.geoObjects.add(place_mark)
                            // $object_manager.add(place_mark);
                            $collection.add(place_mark);

                        } else if (marker_type == 'polygon') {

                            var polygon_style;

                            // if ( is_project ) { // project admin page

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
                                        polygon_style = polygon_style_green;
                                        break;
                                }

                            // } else {
                                // polygon_style = polygon_style_orange;
                            // }

                            console.log(polygon_style);

                            place_mark = new ymaps.Polygon(
                                coords,
                                // place_mark_content,
                                {},
                                polygon_style
                            );

                            // $map.geoObjects.add(place_mark)
                            // $object_manager.add(place_mark);
                            $collection.add(place_mark);

                            console.log($collection);


                        } else {

                            console.log('Object ' + id + ' without coordinates');

                        }
                    }

                    // project objects action
                    var filter = yandex_locale.filter;
                    if (filter) {
                        $object_manager.removeAll()
                        load_objects(filter);
                    };

                    // all objects action
                    $('.js-map-link').on('click', function() {

                        $object_manager.removeAll();

                        load_objects();
                    });

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

                }

            }
        });

    });

})(jQuery);