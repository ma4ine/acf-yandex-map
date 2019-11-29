(function ($) {

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

                    // object manager instance
                    $object_manager = new ymaps.ObjectManager({
                        // doesn't works with polygon
                        // clusterize: true,
                        // gridSize: 32,

                        // disable default baloon
                        geoObjectOpenBalloonOnClick: false,
                    });

                    // object manager event
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

                        if ( !filter ) filter = 'all'; // load all objects

                        $.post({
                            url: yandex_locale.ajax_url,
                            data: {
                                action: 'ymaps_json_post',
                                nonce_code: yandex_locale.nonce,
                                data: filter
                            }
                        })
                        .done(function(response) {
                            var data = $.parseJSON(response);
                            if ( data.features.length > 0 ) {
                                var objects = [];
                                $.each(data.features, function(index, val) {
                                    var status = (val.status) ? val.status.slug : false;
                                    var object = {};
                                    if (val.geometry.type === 'Point') {
                                        var object = {
                                            type: 'Feature',
                                            id: val.id,
                                            geometry: {
                                                type: 'Point',
                                                coordinates: val.geometry.coordinates
                                            }
                                        }
                                        switch(status) {
                                            case 'vacant':
                                                object.options = mark_style_house_green;
                                                break;
                                            case 'reserved':
                                                object.options = mark_style_house_yellow;
                                                break;
                                            case 'booked':
                                                object.options = mark_style_house_red;
                                                break;
                                            default :
                                                object.options = mark_style_house_green;
                                                break;
                                        }
                                    } else if (val.geometry.type === 'Polygon') {
                                        var object = {
                                            type: 'Feature',
                                            id: val.id,
                                            geometry: {
                                                type: 'Polygon',
                                                coordinates: val.geometry.coordinates
                                            }
                                        }
                                        switch(status) {
                                            case 'vacant':
                                                object.options = polygon_style_green;
                                                break;
                                            case 'reserved':
                                                object.options = polygon_style_yellow;
                                                break;
                                            case 'booked':
                                                object.options = polygon_style_red;
                                                break;
                                            default :
                                                object.options = polygon_style_green;
                                                break;
                                        }
                                    }
                                    objects.push(object);
                                });

                                $object_manager.add(objects);
                                $map.geoObjects.add($object_manager);
                                console.log('Map data loaded');
                                $map.setBounds($map.geoObjects.getBounds(), {
                                    checkZoomRange: true
                                });



                            } else {

                                console.error("Map data error");
                            };
                        });
                    }

                    // toggle map method
                    function toggle_map() {
                        $('.js-wrapper').toggleClass('wrapper-map_show');
                        $('.js-supheader').toggleClass('supheader-hidden');
                        $('.js-header').toggleClass('header-map_show');
                        $('.js-content').toggleClass('content-hidden');
                        $('.js-footer').toggleClass('footer-hidden');

                        $('.js-big-map').toggle();
                        $('.yandex-map').toggle();

                        $map.container.fitToViewport();
                    };

                    // project objects action
                    var filter = yandex_locale.filter;
                    console.log(filter);
                    if (filter) {
                        $object_manager.removeAll()
                        load_objects(filter);
                    };

                    // filter active
                    $('.js-filter-map').removeAttr('disabled');

                    // filter objects action
                    $('.js-filter-map').on('click', function() {
                        var filter = {};
                        // get form params
                        var form = $(this).parents('.js-filter-form').serializeArray();
                        $(form).each(function(index, val){
                            filter[val.name] = val.value;
                        });
                        // apply
                        console.log(filter);
                        $object_manager.removeAll();
                        load_objects(filter);
                        toggle_map();
                    });

                    // default objects action
                    $('.js-map-link').on('click', function() {
                        $object_manager.removeAll();
                        toggle_map();
                        load_objects();
                    });

                    // default close action
                    $('.js-map-close').on('click', function() {
                        $object_manager.removeAll();
                        toggle_map();
                    });

                    // on map filter
                    $('.js-onmap-cat-var').on('click', function() {

                        // labels
                        var wrap = $(this).parents('.js-onmap-cat');
                        var current = wrap.find('.js-onmap-cat-cur');
                        var current_label = current.text();
                        var current_value = current.data('value');
                        var select =  $(this);
                        var select_label =  select.text();
                        var select_value =  select.data('value');

                        current.text(select_label);
                        current.data('value', select_value);
                        select.text(current_label);
                        select.data('value', current_value);

                        // data
                        console.log(select_value);
                        $object_manager.removeAll();
                        var filter = {
                            cat: select_value
                        };
                        load_objects(filter);
                    });

                    // ballon methods
                    function compile_baloon_data(object_json) {

                        if (!object_json) return 'Ошибка!';

                        var object = $.parseJSON(object_json);

                        var baloon_data = 
                            '<div class="module--header">' +
                                '<div class="module--title">' +
                                    '<div class="module--offer">' + 
                                        '<div class="module--suptitle">' + object.offer_type + '</div>' +
                                        '<div class="module--status status status-' + object.status_slug + '">' + 
                                            object.status_name + 
                                        '</div>' +
                                    '</div>' + 
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
                            '</div>';

                        if (object.edit_link) {
                            baloon_data += '<div class="module--footer">' +
                                '<a href="' + object.edit_link + '" class="module--more">Редактировать участок</a>' + 
                                '<a href="' + object.link + '" class="module--but but but-green">Подробнее</a>' +
                            '</div>'
                        } else {
                            baloon_data += '<div class="module--footer module--footer-center">' +
                                '<a href="' + object.link + '" class="module--but but but-green">Подробнее</a>' +
                            '</div>';
                        }
                        
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