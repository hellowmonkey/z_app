const gulp = require('gulp');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const less = require('gulp-less');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
const spritesmith = require('gulp-spritesmith');
const uglify = require('gulp-uglify');

let js_modules = function () {
    let js_modules_fn = ['zepto', 'config', 'touch', 'selector', 'fx', 'fx_methods', 'form', 'event', 'data', 'ajax', 'detect', 'template-web'];
    let js_modules_plus = ['plus.back' , 'plus.webview' , 'plus.pullrefresh', 'plus.dialog', 'plus.storage', 'plus.file', 'plus.image', 'plus.template'];
    let js_modules_ui = ['ui.date', 'init'];
    let rets = []
    rets = rets.concat(js_modules_fn, js_modules_plus, js_modules_ui)
    rets.forEach((item, index, input) => {
        input[index] = 'src/js/' + item + '.js'
    })
    return rets
}()

gulp.task('buildJs', function () {
    gulp.src(js_modules)
        .pipe(concat('z.js'))
        .pipe(gulp.dest('dist/js/'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/js/'))
})

gulp.task('buildCss', function () {
    gulp.src('src/less/*.less')
        .pipe(less())
        .pipe(concat('z.css'))
        .pipe(gulp.dest('dist/css/'))
        .pipe(cleancss())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/css/'))
})

gulp.task('default', ['buildJs', 'buildCss'])

gulp.watch('src/less/*.less', ['buildCss']).on('change', function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});
gulp.watch(js_modules, ['buildJs']).on('change', function (event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});