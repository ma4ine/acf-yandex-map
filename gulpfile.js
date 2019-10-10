'use strict';

const { src, dest, parallel, series, watch } = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const rigger = require('gulp-rigger');

// JS
function js() {
	return src(['js/acf-yandex-map.js', 'js/yandex-map.js'], { sourcemaps: true })
		.pipe(rigger())
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(dest('js', { sourcemaps: '.' }))
}

// Watcher
function watcher() {
	watch(['js/acf-yandex-map.js', 'js/yandex-map.js', 'js/includes/*.js'], js)
}

// Task
exports.js = js;
exports.watcher = watcher;
exports.default = series(js, watcher);