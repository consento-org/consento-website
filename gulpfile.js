const path = require('path')
const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var zip = require('gulp-zip');
var beeper = require('beeper');
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var changedInPlace = require('gulp-changed-in-place');
var changeCache = fromRelative(require('./.change-cache.json'));
var { writeFileSync } = require('fs');

function serve(done) {
    livereload.listen();
    done();
}

const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

sass.compiler = require('node-sass');

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function css(done) {
    pump([
        src('./assets/main/sass/*.scss', {sourcemaps: true}),
        sass({outputStyle: 'compressed'}).on('error', sass.logError),
        dest('assets/main/css', {sourcemaps: './'}),
        livereload()
    ], handleError(done));
}

function fromRelative (cache) {
    const absoluteCache = {}
    for (const name in cache) {
        absoluteCache[path.resolve(__dirname, name)] = cache[name]
    }
    return absoluteCache
}

function toRelative (cache) {
    const relativeCache = {}
    for (const name in cache) {
        relativeCache[path.relative(__dirname, name)] = cache[name]
    }
    return relativeCache
}

function img(done) {
    pump([
        src('assets/images/**/*.{svg,png,jpg}', { base: '.' }),
        changedInPlace({ cache: changeCache, firstPass: true }),
        imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imageminPngquant({ speed: 9, strip: true, quality: [0.2, 0.5] }),
            imagemin.svgo()
        ], { verbose: true }),
        dest("."),
        changedInPlace({ cache: changeCache }), // second call is to update the hashes after processing :)
        livereload()
    ], handleError(() => {
        writeFileSync(`${__dirname}/.change-cache.json`, JSON.stringify(toRelative(changeCache), null, 2))
        done()
    }))
}

function zipper(done) {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**'
        ]),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const cssWatcher = () => watch('./assets/main/sass/**/**', css);
const imgWatcher = () => watch('./assets/images/**/*.{svg,png,jpg}', img);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const watcher = parallel(cssWatcher, hbsWatcher, imgWatcher);
const build = series(css, img);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
exports.img = series(img);
