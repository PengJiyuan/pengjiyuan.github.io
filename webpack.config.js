var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var marked = require('marked');
var autoprefixer = require('autoprefixer');

marked.setOptions({
	highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

module.exports = {

	entry: './index.js',

  output: {
  	path: 'disk',
    filename: 'bundle.js'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules)/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }, {
      test: /\.md$/,
      loader: "html!markdown"
    }, {
      test: /\.less$/,
      loader: ExtractTextPlugin.extract(
        'css!postcss-loader!less'
      )
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract(
        'css!postcss-loader'
      )
    }, {
      test: /\.jpg$/,
      loader: "file-loader"
    }, {
      test: /\.png$/, 
      loader: "url-loader?mimetype=image/png"
    }]
  },

  postcss: function() {
    return [autoprefixer];
  },

  plugins: [
    new ExtractTextPlugin("styles.css"),
    new webpack.optimize.UglifyJsPlugin()
  ],

  resolve: {
    alias: {
      'highlight': 'node_modules/highlight.js'
    }
  }

}