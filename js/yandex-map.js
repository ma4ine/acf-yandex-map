(function ($) {

    // 'use strict';

    /**
     * Include common vars
     */
    //= 'includes/common.js'

    /**
     * Backend vars
     */
    // ...maybe

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

                        // не работает
                        // "fillColor": "#44A147",
                        // "strokeColor": "#18803F",
                        // "strokeWidth": 2,
                        // "opacity": 0.75
                    });

                    $object_manager.objects.options.set('preset', 'islands#grayIcon');



                    function load_data(data_type) {

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
                        load_data('land-vsevolozhsk');
                    });


                    $('button.js-map-link').on('click', function() {
                        $object_manager.removeAll()
                        load_data('land-tajtsy');
                    });

                }

            }
        });

    });

})(jQuery);