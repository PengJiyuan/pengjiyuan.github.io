require('webpack');
var config = require('./webpack.config.js');

config.watch = true;
config.debug = true;
config.keepAlive = true;
config.devtool = 'cheap-source-map';

module.exports = config;