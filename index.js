require('normalize.css');
require('github-markdown-css');
require('highlight.js/styles/default.css');
require('./style/index.less');

let config = require('./config.json');

let mdcontent = require('./article.md');
let container = document.getElementById('container');
container.innerHTML = mdcontent;

//header add canvas bg
if(config && config.header_bg) {
  let addBg = require('./modules/header_bg/index');
  addBg();
}

//add left catalog
if(config && config.catalog) {
  let addCatalog = require('./modules/catalog/index');
  addCatalog();
}