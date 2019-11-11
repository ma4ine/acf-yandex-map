<?php

/*
Plugin Name: Yandex Map Field for ACF
Plugin URI: https://github.com/constlab/acf-yandex-map
Description: Editing map on page, add geopoints and circles
Version: 1.3
Author: Const Lab
Author URI: https://constlab.ru
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

defined( 'YA_MAP_LANG_DOMAIN' ) or define( 'YA_MAP_LANG_DOMAIN', 'acf-yandex-map' );
defined( 'ACF_YA_MAP_VERSION' ) or define( 'ACF_YA_MAP_VERSION', '1.3.0' );

load_plugin_textdomain( YA_MAP_LANG_DOMAIN, false, dirname( plugin_basename( __FILE__ ) ) . '/lang/' );

function include_field_types_yandex_map( $version = false ) {
	if ( ! $version ) {
		$version = 4;
	}

	include_once __DIR__ . '/acf-yandex-map-v' . $version . '.php';
}

add_action( 'acf/include_field_types', 'include_field_types_yandex_map' );
add_action( 'acf/register_fields', 'include_field_types_yandex_map' );

/// Function for frontend

if ( ! function_exists( 'the_yandex_map' ) ) {

	/**
	 * @param string $selector
	 * @param int|bool $post_id
	 * @param null $data
	 */
	function the_yandex_map( $selector, $post_id = false, $data = null ) {

		// Config
		if ( WP_DEBUG && WP_DEBUG_DISPLAY ) {
			$debug = 'mode=debug';
		} else {
			$debug = 'mode=release';
		}

		$post_id = function_exists( 'acf_get_valid_post_id' ) ? acf_get_valid_post_id( $post_id ) :  $post_id;

		$value = ( $data !== null ) ? $data : get_field( $selector, $post_id, false );

		if ( !$value ) {
			// return;
			$is_object_map = false;
			$defaults = array(
				'height'     => '400',
				'center_lat' => '59.938888',
				'center_lng' => '30.315230',
				'zoom'       => '10',
				'map_type'   => 'map'
			);
			$value = json_encode($defaults);
		} else {
			$is_object_map = true;
		}

		$dir = plugin_dir_url( __FILE__ );
		wp_register_script( 'yandex-map-api', '//api-maps.yandex.ru/2.1/?apikey=a88e3e77-1626-4d3f-9f79-423e4131029e&' . $debug . '&lang=' . get_bloginfo( 'language' ), array( 'jquery' ), null );
		wp_register_script( 'yandex-map-frontend', "{$dir}js/yandex-map.min.js", array( 'yandex-map-api' ), ACF_YA_MAP_VERSION );
		wp_enqueue_script( 'yandex-map-frontend' );

		if ( $is_object_map ) {
			$map_id = uniqid( 'map_' );
		} else {
			$map_id = $selector;
		}

		wp_localize_script( 'yandex-map-frontend', $map_id, array(
			'params' => $value,
			'plugin_url' => plugin_dir_url( __FILE__ ),
		) );

		wp_localize_script( 'yandex-map-frontend', 'yandex_locale', array(
			'plugin_url' => plugin_dir_url( __FILE__ ),
			'ajax_url' => admin_url('admin-ajax.php'),
			'nonce' => wp_create_nonce('ajax-nonce'),
		) );

		/**
		 * Filter the map height for frontend.
		 *
		 * @since 1.2.0
		 *
		 * @param string $selector Field name
		 * @param int $post_id Current page id
		 * @param array $value Map field value
		 */
		$field        = get_field_object( $selector, $post_id );
		$field_height = $field ? $field['height'] : 400;
		$height_map   = apply_filters( 'acf-yandex-map/height', $field_height, $selector, $post_id, $value );

		echo sprintf( '<div class="yandex-map" id="%s" style="width:auto;height:%dpx"></div>', $map_id, $height_map );
	}

}

function get_object_data($post_id)
{
	$post_status = get_post_status($post_id);

	if ( $post_status === 'publish' ) {

		$plugin_url = plugin_dir_url( __FILE__ );

		$dim = array(
			'land' => ' сот.',
			'living' => ' м<sup>2</sup>',
			'commercial' => ' м<sup>2</sup>',
		);

		$post = array();

		$post_type = get_post_type($post_id);
		$square = get_field($post_type . '-square', $post_id) . $dim[$post_type];
		$city = get_field('location-city', $post_id);
		$location_arr = array(
			'district' => get_field('location-district', $post_id),
			'city' => (is_object($city)) ? $city->name : $city,
			'address' => get_field('location-address', $post_id),
		);
		$location = implode(', ', $location_arr);
		$price = number_format(get_field('price', $post_id), 0, '', ' ');
		$images = get_field('gallery', $post_id);
		$thumb_url = ($images) 
			? $images[0]['sizes']['thumbnail']
			: $plugin_url . 'svg/house-1.svg';

		$post['title'] = get_the_title($post_id);
		$post['link'] = get_permalink($post_id);
		$post['square'] = $square;
		$post['offer_type'] = get_field('offer-type', $post_id);
		$post['location'] = $location;
		$post['price'] = $price;
		$post['thumb_url'] = $thumb_url;

		return $post;
		
	} else {

		return false;

	}
}

/// AJAX for front-end

// Object list
// Post objects to JSON, AJAX!
add_action( 'wp_ajax_ymaps_json_post', 'ymaps_json_post_callback', 10 );
add_action( 'wp_ajax_nopriv_ymaps_json_post', 'ymaps_json_post_callback', 10 );
function ymaps_json_post_callback()
{
	check_ajax_referer( 'ajax-nonce', 'nonce_code' );

	if ( !isset($_POST['data']) || empty($_POST['data']) ) wp_die();

	$post_type = array('land', 'living', 'commercial');

	$collection = array(
		'type' => 'FeatureCollection',
		'features' => array(),
	);

	$args = array(
		'numberposts' => -1, 
		'post_type' => $post_type,
	);

	// $project = ( get_the_terms( $post_id, 'project' ) ) ?: 'no-project';

	// if ( $post_type === 'land' && $project != 'no-project' ) {

	// 	$project = $project[0]->slug;

	// 	$add_args = array(
	// 		'project' => $project,
	// 	);

	// } else {

	// 	$add_args = array(
	// 		// nothing
	// 	);

	// }

	// $args = array_merge($base_args, $add_args);

	$posts = get_posts( $args );

	if ( $posts ) {

		foreach ( $posts as $post ) {

			setup_postdata( $post );

			$post_id = $post->ID;

			$object = array(
				'type' => 'Feature',
				// 'postType' => $post_type,
				// 'project' => $project,
				'id' => $post_id,
				'title' => $post->post_title,
				// 'link' => '',
				'geometry' => array(
					'type' => '',
					'coordinates' => array(),
				),
				'properties' => array(
		      'hintContent' => $post->post_title,
				)
			);

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

		wp_reset_postdata();
	}
	
	$json = json_encode($collection);

	echo $json;

	wp_die();
}

// Data for baloon
add_action('wp_ajax_ymap_object_load', 'ymap_object_load_callback');
add_action('wp_ajax_nopriv_ymap_object_load', 'ymap_object_load_callback');
function ymap_object_load_callback()
{
	check_ajax_referer( 'ajax-nonce', 'nonce_code' );

	if ( isset($_GET['post_id']) && !empty($_GET['post_id']) ) {

		$post_data = get_object_data($_GET['post_id']);

		if (!$post_data) wp_die();

		$post_json = json_encode($post_data);

		echo $post_json;

		wp_die();

	} else { 

		wp_die(); 

	}
}
