const gulp = require('gulp');
const concat = require('gulp-concat');
// const imagemin = require('gulp-imagemin');
const less = require('gulp-less');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
// const spritesmith = require('gulp-spritesmith');
const uglify = require('gulp-uglify');

let js_modules_fn = ['zepto', 'config', 'touch', 'selector', 'fx', 'fx_methods', 'form', 'event', 'data', 'ajax', 'detect'];
let js_modules_tpl = ['art-template', 'plus.template']
let js_modules_plus = ['plus.back', 'plus.webview', 'plus.pullDownRefresh', 'plus.dialog', 'plus.storage', 'plus.file', 'plus.image'];
let js_modules_ui = ['ui.date', 'ui.switch', 'ui.modal', 'ui.numberbox', 'ui.button', 'ui.transparent', 'ui.pullUpRefresh', 'ui.image', 'ui.slider', 'init'];

let js_modules = function ( /* modules */ ) {
    let rets = []
    for (const i of arguments) {
        rets = rets.concat(i)
    }
    rets.forEach((item, index, input) => {
        input[index] = 'src/js/' + item + '.js'
    })
    return rets
}

let z_src = js_modules(js_modules_fn, js_modules_plus, js_modules_tpl, js_modules_ui)
let web_src = js_modules(js_modules_fn, js_modules_ui)

gulp.task('buildJs', ['z', 'web'])

gulp.task('z', function () {
    gulp.src(z_src)
        .pipe(concat('z.js'))
        .pipe(gulp.dest('dist/js/'))
        .pipe(gulp.dest('../../git/av/js/'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/js/'))
        .pipe(gulp.dest('../../git/av/js/'))
})

gulp.task('web', function () {
    gulp.src(web_src)
        .pipe(concat('z-web.js'))
        .pipe(gulp.dest('dist/js/'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/js/'))
})

gulp.task('buildCss', function () {
    gulp.src('src/less/z.less')
        .pipe(less())
        .pipe(gulp.dest('dist/css/'))
        .pipe(gulp.dest('../../git/av/css/'))
        .pipe(cleancss())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/css/'))
        .pipe(gulp.dest('../../git/av/css/'))
})

gulp.task('default', ['buildJs', 'buildCss'])

gulp.watch('src/less/*.less', ['buildCss']).on('change', function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks buildCss...');
});
gulp.watch(z_src, ['z']).on('change', function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks [z]...');
});
gulp.watch(web_src, ['web']).on('change', function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks [web]...');
});