const path = require('path')
const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');
const through = require('through2');

// gulp plugins and utils
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var zip = require('gulp-zip');
var beeper = require('beeper');
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var markdownIt = require('markdown-it')();
var minimatch = require('minimatch')
var { exiftool } = require('exiftool-vendored')
var changedInPlace = require('gulp-changed-in-place');
var changeCache = fromRelative(require('./.change-cache.json'));
var { writeFileSync, readFileSync } = require('fs');
var { unlink, writeFile } = require('fs').promises;

function serve(done) {
    livereload.listen();
    done();
}

function getBlock (type, tokens, offset = 0) {
    const start = tokens.findIndex((item, index) => index >= offset && item.type === `${type}_open`)
    if (start === -1) {
        return
    }
    const startItem = tokens[start]
    const end = tokens.findIndex((item, index) => index > start && item.type === `${type}_close` && item.level === startItem.level)
    if (end === -1) {
        return
    }
    return { start, end, tokens: tokens.slice(start, end) }
}

function getLink (tokens, offset = 0) {
    const found = getBlock('link', tokens, offset)
    if (found === undefined) {
        return
    }
    return {
        href: found.tokens[0].attrs.find(attr => attr[0] === 'href')[1],
        text: found.tokens[1].content
    }
}

function allBlocks (type, tokens, op, offset = 0) {
    const result = []
    let block
    while (block = getBlock(type, tokens, offset)) {
        const part = op(block)
        if (part !== undefined) {
            result.push(part)
        }
        offset = block.end + 1
    }
    return result
}

function getLicenseDeclaration () {
    const tokens = markdownIt.parse(readFileSync(`${__dirname}/LICENSE`, 'utf8'))
    const licenseBlock = getBlock('bullet_list', tokens)
    if (licenseBlock === undefined) {
        return
    }
    const licensesByLicense = allBlocks('list_item', licenseBlock.tokens, ({ tokens: licenseLi }) => {
        const linkNode = licenseLi.find(item => item.type === 'inline' && item.level === 3)
        if (linkNode === undefined) {
            return
        }
        const license = getLink(linkNode.children)
        const licenseUl = getBlock('bullet_list', licenseLi)
        if (licenseUl === undefined) {
            return
        }
        return {
            license,
            licensees: allBlocks('list_item', licenseUl.tokens, ({ tokens: licenseeLi }) => {
                const linkNode = licenseeLi.find(item => item.type === 'inline')
                if (linkNode === undefined) {
                    return
                }
                const licensee = getLink(linkNode.children)
                const globUl = getBlock('bullet_list', licenseeLi)
                if (globUl === undefined) {
                    return
                }
                return {
                    licensee,
                    globs: allBlocks('list_item', globUl.tokens, ({ tokens: globLi }) => {
                        const globNode = globLi.find(item => item.type === 'inline')
                        if (globNode === undefined) {
                            return
                        }
                        return globNode.content
                    })
                }
            })
        }
    })
    return licensesByLicense.reduce((byGlob, { license, licensees }) => {
        for (const { licensee, globs } of licensees) {
            for (const glob of globs) {
                byGlob.push({
                    glob: minimatch.filter(`${__dirname}/${glob}`),
                    name: `${license.text} by ${licensee.text}`,
                    licenseText: `by ${licensee.text} (${licensee.href}) - license: ${license.text} (see: ${license.href})` })
            }
        }
        return byGlob
    }, [])
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

function imgFiles () {
    return src('assets/images/**/*.{svg,png,jpg}', { base: '.' })
}

function imgCompress(done) {
    pump([
        imgFiles(),
        changedInPlace({ cache: changeCache, firstPass: true }),
        imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imageminPngquant({ speed: 5, strip: true, quality: [0.4, 0.6] }),
            imagemin.svgo()
        ], { verbose: true }),
        dest("."),
        livereload()
    ], handleError(done))
}

function imgLicense(done) {
    const imageLicenses = getLicenseDeclaration()
    pump([
        imgFiles(),
        through.obj((file, _, cb) => {
            if (file.isNull()) return cb(null, file);
            if (file.isStream()) return cb(new Error('Streaming not supported'));
            ;(async () => {
                const newLicense = imageLicenses.find(({ glob }) => glob(file.path));
                let changed = false;
                if (/\.svg$/i.test(file.path)) {
                    const oldSvg = file.contents.toString('utf8');
                    let svg = oldSvg.replace(/<!--(.*)-->\n/, '');
                    if (newLicense !== undefined) {
                        svg = `<!-- ${newLicense.licenseText} -->\n${svg}`;
                    }
                    if (svg !== oldSvg) {
                        await writeFile(file.path, svg);
                        changed = true;
                    }
                } else {
                    const tags = await exiftool.read(file.path);
                    const Copyright = newLicense && newLicense.licenseText;
                    if (Copyright !== tags.Copyright) {
                        await exiftool.write(file.path, { Copyright: Copyright || '' });
                        await unlink(`${file.path}_original`);
                        changed = true;
                    }
                }
                if (changed) {
                    console.log(`License: ${newLicense ? newLicense.name : 'UNLICENSED'} → ${path.relative(__dirname, file.path)}`);
                }
            })().then(() => cb(null, file), cb)
        }, cb => {
            exiftool.end(true)
            cb()
        }),
        livereload()
    ], handleError(done))
}

function imgPersist(done) {
    pump([
        imgFiles(),
        changedInPlace({ cache: changeCache }), // calling to update the cache
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
const img = series(imgCompress, imgLicense, imgPersist)
const build = series(css, img);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
exports.img = img;
exports.imgLicense = imgLicense;
