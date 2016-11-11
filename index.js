require('normalize.css');
require('github-markdown-css');
require('highlight.js/styles/default.css');
require('./style/index.less');

let addBg = require('./javascript/header_bg.js');
let addCatalog = require('./javascript/add_catalog.js');
let mdcontent = require("./article.md");
let container = document.getElementById('container');
container.innerHTML = mdcontent;

//header add canvas bg
//addBg();

//todo add catalog
//new addCatalog().init();