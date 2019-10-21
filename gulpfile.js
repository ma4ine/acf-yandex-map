'use strict';

const { src, dest, parallel, series, watch } = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const rigger = require('gulp-rigger');
const svgmin = require('gulp-svgmin');

// JS
function js() {
	return src(['js/acf-yandex-map.js', 'js/yandex-map.js'], { sourcemaps: true })
		.pipe(rigger())
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(dest('js', { sourcemaps: '.' }))
}

// SVG
function svg() {
	return src('svg/_src/*.svg')
		.pipe(svgmin())
		.pipe(dest('svg'))
}

// Watcher
function watcher() {
	watch(['js/acf-yandex-map.js', 'js/yandex-map.js', 'js/includes/*.js'], js)
	watch('svg/_src/*.svg', svg)
}

// Task
exports.js = js;
exports.svg = svg;
exports.watcher = watcher;
exports.default = series(svg, js, watcher);