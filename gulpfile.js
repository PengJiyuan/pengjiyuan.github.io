const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const less = require('gulp-less');
const minifyCSS = require('gulp-csso');
const autoprefixer = require('gulp-autoprefixer');
const plumber = require('gulp-plumber');
const mdpack = require('mdpack');
const buildHome = require('./tasks/home');
const metadata = require('./postMap.json');

function build() {
  fs.readdirSync(path.resolve(__dirname, '_posts'))
  .filter(m => fs.statSync(path.resolve(__dirname, '_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(__dirname, '_posts', year))
      .forEach((post) => {
        const filename = post.split('.md')[0];
        const _meta = metadata.post.find(_m => _m.filename === filename).metadata;
        console.log(_meta);
        const mdConfig = {
          entry: path.resolve(__dirname, '_posts', year, post),
          output: {
            path: path.resolve(__dirname, 'blog', year, filename),
            name: 'index'
          },
          format: ['html'],
          plugins: [
            new mdpack.plugins.mdpackPluginRemoveHead()
          ],
          template: path.resolve(__dirname, 'tasks/template.html'),
          resources: {
            markdownCss: '/static/css/markdown.css',
            highlightCss: '/static/css/highlight.css',
            title: _meta.title,
            author: _meta.author,
            type: _meta.type,
            intro: _meta.intro
          }
        };
        mdpack(mdConfig);
      });
  });
}

gulp.task('css', () => {
  return gulp.src('static/less/*.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('static/css'))
});

gulp.task('cssDev', () => {
  return gulp.watch('static/less/*.less', ['css']);
});

gulp.task('mdDev', () => {
  return gulp.watch('_posts/**/*.md', ['home', 'blog']);
});

gulp.task('home', buildHome);

gulp.task('blog', build);

gulp.task('default', ['build']);

// dev mode
gulp.task('dev', ['cssDev', 'mdDev']);

gulp.task('build', ['home', 'blog']);
          