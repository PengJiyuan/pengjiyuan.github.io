require('normalize.css');
require('github-markdown-css');
require('highlight.js/styles/default.css');
require('./style/index.less');

let addBg = require('./javascript/header_bg.js');
let mdcontent = require("./article.md");
let container = document.getElementById('container');
container.innerHTML = mdcontent;

//header add canvas bg
addBg();