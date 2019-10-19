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

/// Include Post 2 JSON

include_once __DIR__ . '/post-2-json.php';

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
		wp_register_script( 'yandex-map-api', '//api-maps.yandex.ru/2.1/?' . $debug . '&lang=' . get_bloginfo( 'language' ), array( 'jquery' ), null );
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
	$post = array();

	get_the_ID();

	$args = array(
		''
	);

	get_posts($args);

	return $post;
}

/// AJAX for front-end
add_action('wp_ajax_ymap_object_load', 'ymap_object_load_callback');
add_action('wp_ajax_nopriv_ymap_object_load', 'ymap_object_load_callback');
function ymap_object_load_callback()
{
	check_ajax_referer( 'ajax-nonce', 'nonce_code' );

	if ( isset($_GET['post_id']) && !empty($_GET['post_id']) ) {

		$post_data = get_object_data($_GET['post_id']);

		$post_json = json_encode($post_data);

		echo $post_json;

		wp_die();

	} else { 

		wp_die(); 

	}
}
