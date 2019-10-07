<?php

// Post objects to JSON
add_action( 'save_post', 'ymaps_json_post', 10, 3 );
function ymaps_json_post()
{

	if ( !is_admin() ) return false;

	$post_type = ( isset($_POST['post_type']) ) ? $_POST['post_type'] : false;
	$post_id = ( isset($_POST['post_ID']) ) ? $_POST['post_ID'] : false;

	if ( !$post_type ) return false;

	$collection = array(
		'type' => 'FeatureCollection',
		'features' => array(),
	);

	$base_args = array(
		'numberposts' => -1, 
		'post_type' => $post_type,
	);

	$project = ( get_the_terms( $post_id, 'project' ) ) ?: 'no-project';

	if ( $post_type === 'land' && $project != 'no-project' ) {

		$project = $project[0]->slug;

		$add_args = array(
			'project' => $project,
		);

	} else {

		$add_args = array(
			// nothing
		);

	}

	$args = array_merge($base_args, $add_args);

	$posts = get_posts( $args );

	if ( $posts ) {

		foreach ( $posts as $post ) {

			setup_postdata( $post );

			$post_id = $post->ID;

			$object = array(
				'type' => 'Feature',
				'postType' => $post_type,
				'project' => $project,
				'id' => $post_id,
				'title' => $post->post_title,
				'link' => '',
				'options' => array(
					'fillColor' => '#44A147',
		      'strokeColor' => '#18803F',
		      'strokeWidth' => 2,
		      'opacity' => 0.75
				),
				'geometry' => array(
					'type' => '',
					'coordinates' => array(),
				),
				'properties' => array(
					'balloonContentHeader' => '<div class="module--header"><div class="module--title module--title-available">Участок №</div><div class="module--status status status-nopadding js-status">Свободен</div></div>"',
		      'balloonContentBody' => '<div class="module--body"><div class="module--item module--item-50 common_item"><div class="common_item--title"><em>Площадь участка</em></div><div class="common_item--value">12 сот.</div></div><div class="module--item module--item-50 common_item"><div class="common_item--title"><em>Стоимость</em></div><div class="common_item--value"><span class="js-money">1800000</span> ₽</div></div><div class="module--item icb d-none d-lg-block"><i class="icb--icon icon icon-mountain"></i><div class="icb--title"></div></div><div class="module--item slope slope-hor d-none d-lg-flex"><div class="slope--title slope--title-hor">Уклон участка</div><img src="http://vsevreestr.localhost/wp-content/themes/vsevreestr/svg/landscape/rovn_NS.svg" alt="Ландшафт" class="slope--img slope--img-hor"><div class="slope--subtitle slope--subtitle-hor js-typo"></div></div></div>"',
		      'balloonContentFooter' => '<div class="module--footer"><a href="#" class="module--more">Подробнее об участке</a><button type="button" class="module--but but but-green" data-toggle="modal" data-target="#orderModal">Забронировать</button></div>"',
		      'hintContent' => 'Ленинградская область, г. Всеволожск, шоссе Южное',
				)
			);

			// $object['id'] = $post_id;
			// $object['title'] = $post->post_title;
			// $object['project'] = $project;
			// $object['link'] = get_the_permalink();

			// d(get_field('ymap', $post_id));
			$ymap = json_decode( get_field('ymap', $post_id), true );

			// d($ymap);

			// continue;

			if ( isset($ymap['marks'][0]) ) {

				$object['geometry']['type'] = $ymap['marks'][0]['type'];

				if ( $object['geometry']['type'] === 'Polygon' ) {

					$object['geometry']['coordinates'][] = $ymap['marks'][0]['coords'][0];

				} elseif ( $object['geometry']['type'] === 'Point' ) {

					$object['geometry']['coordinates'] = $ymap['marks'][0]['coords'];

				}
			}

			$collection['features'][] = $object;
		}

		// wp_die();

		wp_reset_postdata();

	}
	
	$json = json_encode($collection);

	$file = write_json($json, $post_type . '-' . $project);
}


function write_json($json, $filename) {

	$filename2 = __DIR__ . '/json/' . $filename . '.json';
	$fh = fopen($filename2, 'w+'); // open file and create if does not exist
	fwrite($fh, $json); // write data
	fclose($fh); // close file

	return $filename;
}


