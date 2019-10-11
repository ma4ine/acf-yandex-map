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
                        geoObjectOpenBalloonOnClick: false
                    });

                    // set common style
                    var object_style = Object.assign( {}, mark_style_house_orange, polygon_style_green );
                    $object_manager.objects.options.set(object_style);

                    // load baloon data
                    // Функция, эмулирующая запрос за данными на сервер.
                    function loadBalloonData (objectId) {
                        var dataDeferred = ymaps.vow.defer();
                        function resolveData () {
                            dataDeferred.resolve('Данные балуна');
                        }
                        window.setTimeout(resolveData, 1000);
                        return dataDeferred.promise();
                    }

                    function hasBalloonData(objectId) {
                        return $object_manager.objects.getById(objectId).properties.balloonContent;
                    }

                    $object_manager.objects.events.add('click', function (e) {
                        var objectId = e.get('objectId'),
                            obj = $object_manager.objects.getById(objectId);
                        if (hasBalloonData(objectId)) {
                            $object_manager.objects.balloon.open(objectId);
                        } else {
                            obj.properties.balloonContent = "Идет загрузка данных...";
                            $object_manager.objects.balloon.open(objectId);
                            loadBalloonData(objectId).then(function (data) {
                                obj.properties.balloonContent = data;
                                $object_manager.objects.balloon.setData(obj);
                            });
                        }
                    });
                    //

                        /// js sample
                      // "properties": {
                      //   "balloonContentHeader": "<div class=\"module--header\"><div class=\"module--title module--title-available\">Участок №</div><div class=\"module--status status status-nopadding js-status\">Свободен</div></div>\"",
                      //   "balloonContentBody": "<div class=\"module--body\"><div class=\"module--item module--item-50 common_item\"><div class=\"common_item--title\"><em>Площадь участка</em></div><div class=\"common_item--value\">12 сот.</div></div><div class=\"module--item module--item-50 common_item\"><div class=\"common_item--title\"><em>Стоимость</em></div><div class=\"common_item--value\"><span class=\"js-money\">1800000</span> ₽</div></div><div class=\"module--item icb d-none d-lg-block\"><i class=\"icb--icon icon icon-mountain\"></i><div class=\"icb--title\"></div></div><div class=\"module--item slope slope-hor d-none d-lg-flex\"><div class=\"slope--title slope--title-hor\">Уклон участка</div><img src=\"http://vsevreestr.localhost/wp-content/themes/vsevreestr/svg/landscape/rovn_NS.svg\" alt=\"Ландшафт\" class=\"slope--img slope--img-hor\"><div class=\"slope--subtitle slope--subtitle-hor js-typo\"></div></div></div>\"",
                      //   "balloonContentFooter": "<div class=\"module--footer\"><a href=\"#\" class=\"module--more\">Подробнее об участке</a><button type=\"button\" class=\"module--but but but-green\" data-toggle=\"modal\" data-target=\"#orderModal\">Забронировать</button></div>\"",
                      //   "hintContent": "Ленинградская область, г. Всеволожск, шоссе Южное"
                      // }

                    /// php sample
                    // 'balloonContentHeader' => '<div class="module--header"><div class="module--title module--title-available">Участок №</div><div class="module--status status status-nopadding js-status">Свободен</div></div>"',
                    // 'balloonContentBody' => '<div class="module--body"><div class="module--item module--item-50 common_item"><div class="common_item--title"><em>Площадь участка</em></div><div class="common_item--value">12 сот.</div></div><div class="module--item module--item-50 common_item"><div class="common_item--title"><em>Стоимость</em></div><div class="common_item--value"><span class="js-money">1800000</span> ₽</div></div><div class="module--item icb d-none d-lg-block"><i class="icb--icon icon icon-mountain"></i><div class="icb--title"></div></div><div class="module--item slope slope-hor d-none d-lg-flex"><div class="slope--title slope--title-hor">Уклон участка</div><img src="http://vsevreestr.localhost/wp-content/themes/vsevreestr/svg/landscape/rovn_NS.svg" alt="Ландшафт" class="slope--img slope--img-hor"><div class="slope--subtitle slope--subtitle-hor js-typo"></div></div></div>"',
                    // 'balloonContentFooter' => '<div class="module--footer"><a href="#" class="module--more">Подробнее об участке</a><button type="button" class="module--but but but-green" data-toggle="modal" data-target="#orderModal">Забронировать</button></div>"',

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