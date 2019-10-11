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
				'geometry' => array(
					'type' => '',
					'coordinates' => array(),
				),
				'properties' => array(
		      'hintContent' => $post->post_title,
				)
			);

			// $object['id'] = $post_id;
			// $object['title'] = $post->post_title;
			// $object['project'] = $project;
			// $object['link'] = get_the_permalink();

			// d(get_field('ymap', $post_id));

			$ymap = json_decode( get_field('ymap', $post_id), true );


			if ( isset($ymap['marks'][0]) && !empty($ymap['marks'][0]['coords'][0]) ) {

				$object['geometry']['type'] = $ymap['marks'][0]['type'];

				if ( $object['geometry']['type'] === 'Polygon' ) {

					$object['geometry']['coordinates'][] = $ymap['marks'][0]['coords'][0];

				} elseif ( $object['geometry']['type'] === 'Point' ) {

					$object['geometry']['coordinates'] = $ymap['marks'][0]['coords'];

				}

				$collection['features'][] = $object;
			}
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


