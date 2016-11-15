var webpackConfig = require('./webpack.config.js');

module.exports = function(grunt) {

  grunt.initConfig({
    webpack: {
      options: webpackConfig,
      build: {
        output: {
          path: 'disk',
          filename: 'bundle.js'
        }
      }
    },

    webfont: {
      icons: {
        src: 'style/svg/*.svg',
        dest: 'style/fonts'
      }
    }
  });

  require('time-grunt')(grunt);

  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-webfont');

  grunt.registerTask('default', ['webfont', 'webpack:build']);

};