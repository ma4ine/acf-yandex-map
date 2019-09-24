(function ($) {

    // 'use strict';

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


                if (id === 'ymap_full') {

                    $object_manager = new ymaps.ObjectManager({
                        clusterize: true,
                        gridSize: 32
                    });
                    $object_manager.objects.options.set({
                        preset: 'islands#darkOrangeDotIcon',
                        balloonMaxWidth: 235
                    });
                    $object_manager.clusters.options.set({
                        preset: 'islands#darkOrangeClusterIcons',
                    });
                    $map.geoObjects.add($object_manager);

                    function load_data(data_type) {

                        var plugin_url = window[id]['plugin_url']

                        $.ajax({
                            url: plugin_url + 'json/data-' + data_type + '.json'
                        })
                        .done(function(data) {
                            $object_manager.remove($object_manager.objects);
                            $object_manager.remove($object_manager.clusters);
                            $object_manager.add(data);
                            console.log('Map data loaded');
                        })
                        .fail(function() {
                            console.error("Map data error");
                        });
                    }

                    $('a.js-map-link').on('click', function() {
                        load_data('land-tajtsy');
                    });

                    $('button.js-map-link').on('click', function() {
                        load_data('land-vsevolozhsk');
                    });

                }

            }
        });

    });

})(jQuery);