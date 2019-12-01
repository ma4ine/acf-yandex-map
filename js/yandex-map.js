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
                $map.controls.remove('fullscreenControl');
                $map.controls.remove('rulerControl');
                $map.options.set('balloonMaxWidth', 290);

                // Adaptive misc
                if ($(window).width() < 768) {
                    $map.controls.remove('typeSelector');
                    $('.js-onmap-collapse-element').hide();
                    $('.js-onmap-collapse-trigger').on('click', function() {
                        var label = $(this).data('label');
                        $(this).data('label', $(this).text()).text(label);
                        $('.js-onmap-collapse-element').toggle();
                    });
                } else {
                    $('.js-onmap-collapse-trigger').hide();
                }


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
                        // loader
                        $(".js-loader").delay(500).fadeIn('fast');
                        $(".js-loader-inner").fadeIn();
                        $(".js-loader-icon").show();
                        $(".js-loader-error").hide();
                        // data
                        if ( !filter ) filter = {
                            cat: 'all' // load all objects
                        };
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
                                                object.options = (val.special) 
                                                    ? mark_style_house_orange
                                                    : mark_style_house_green;
                                                break;
                                            case 'reserved':
                                                object.options = mark_style_house_yellow;
                                                break;
                                            case 'booked':
                                                object.options = mark_style_house_red;
                                                break;
                                            default :
                                                object.options = (val.special) 
                                                    ? mark_style_house_orange
                                                    : mark_style_house_green;
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
                                        if (val.special) object.options = polygon_style_orange;
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
                                                object.options = (val.special) 
                                                    ? polygon_style_orange
                                                    : polygon_style_green;
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
                                // loader
                                $(".js-loader-inner").fadeOut(); 
                                $(".js-loader").delay(500).fadeOut('fast');
                            } else {
                                // loader error
                                $(".js-loader-error").show();
                                $(".js-loader-icon").hide();
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
                        $object_manager.removeAll();
                        load_objects(filter);
                        toggle_map();
                        // cat data filter fill
                        var cur_cat = $('.js-onmap-cat-var[data-value="' + filter.cat + '"]');
                        if (cur_cat.length > 0) {
                            $('.js-onmap-cat-cur').text(cur_cat.text());
                            $('.js-onmap-cat-cur').data('value', cur_cat.data('value'));
                        }
                        // price data filter fill
                        if (filter.pricefrom) {
                            price_slider.noUiSlider.set([filter.pricefrom, null]);
                        }
                        if (filter.priceup) {
                            price_slider.noUiSlider.set([null, filter.priceup]);
                        }
                    });

                    // common link active
                    $('.js-map-open').removeAttr('disabled');

                    // common open action
                    $('.js-map-open').on('click', function() {
                        $object_manager.removeAll();
                        toggle_map();
                        load_objects();
                        load_prices();
                    });

                    // common close action
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

                        var price = price_slider.noUiSlider.get();
                        console.log(price);
                        var special = $('.js-onmap-special');

                        current.text(select_label);
                        current.data('value', select_value);
                        select.text(current_label);
                        select.data('value', current_value);

                        // data
                        $object_manager.removeAll();
                        var filter = {
                            cat: select_value,
                            pricefrom: price[0],
                            priceup: price[1],
                            special: (special.prop("checked")) ? 'EXISTS' : ''
                        };
                        load_objects(filter);
                        // load_prices(select_value);
                    });

                    // price range slider
                    var price_slider = document.getElementById('price_slider');
                    var price_min = $(price_slider).data('min');
                    var price_max = $(price_slider).data('max');

                    noUiSlider.create(price_slider, {
                        start: [price_min, price_max],
                        connect: true,
                        range: {
                            'min': price_min,
                            'max': price_max
                        },
                        format: wNumb({
                            decimals: 0
                        })
                    });

                    price_slider.noUiSlider.on('slide', function () {
                        var values = price_slider.noUiSlider.get();

                        $('#price_slider_data_1').text(values[0]);
                        $('#price_slider_data_2').text(values[1]);

                        moneyMaskRefresh($('#price_slider_data_1'));
                        moneyMaskRefresh($('#price_slider_data_2'));
                    });

                    // apply price filter
                    price_slider.noUiSlider.on('change', function () {
                        var cat =  $('.js-onmap-cat-cur').data('value');
                        var price = price_slider.noUiSlider.get();
                        var special = $('.js-onmap-special');
                        $object_manager.removeAll();
                        var filter = {
                            cat: cat,
                            pricefrom: price[0],
                            priceup: price[1],
                            special: (special.prop("checked")) ? 'EXISTS' : ''
                        };
                        load_objects(filter);
                    });
                    
                    // load prices method
                    function load_prices(cat) {
                        if (!cat) cat = '';
                        $.get({
                            url: yandex_locale.ajax_url,
                            data: {
                                action: 'ymap_get_prices',
                                nonce_code: yandex_locale.nonce,
                                data: {
                                    cat: cat
                                }
                            }
                        })
                        .done(function(response) {
                            var price = $.parseJSON(response);
                            price_slider.noUiSlider.set([price.min, price.max]);
                            $('#price_slider_data_1').text(price.min);
                            $('#price_slider_data_2').text(price.max);
                            moneyMaskRefresh($('#price_slider_data_1'));
                            moneyMaskRefresh($('#price_slider_data_2'));
                        });
                    };

                    // special offers check
                    $('.js-onmap-special').on('change', function() {
                        var cat = $('.js-onmap-cat-cur').data('value');
                        var price = price_slider.noUiSlider.get();
                        if (!cat) cat = 'all';
                        var filter = {
                            cat: cat,
                            pricefrom: price[0],
                            priceup: price[1],
                            special: ($(this).prop("checked")) ? 'EXISTS' : ''
                        };
                        if ($(this).prop("checked")) {
                            filter.special = 'EXISTS';
                        };
                        $object_manager.removeAll();
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