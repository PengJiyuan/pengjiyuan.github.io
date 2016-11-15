/*
 * add catalog
 */

require('./index.less');
let helper = require('../../utils/helper');
let header_height = parseInt(helper.getStyle(helper.selectOne('header')).height);
let catalog_height = '80px';

let addCatalog = function() {
  this.overLine = false;
  this.wrapper = helper.createDom('div', 'module-catalog');
  this.icon = helper.createDom('i', 'icon icon_category category');
  this.content = helper.createDom('div', 'content');
  this.headers = [];
};

addCatalog.prototype = {

  init: function() {
    let that = this;
    let container_wrapper = helper.selectOne('#container-wrapper');
    that.initDom();
    that.initItems();
    helper.bind(document, 'scroll', () => {
      if(helper.getScrollY() > header_height) {
        let catalogList = Array.from(helper.selectAll('.module-catalog > .content > a'));
        that.overLine = true;
        // show the catalog
        that.wrapper.classList.remove('module-catalog-move_out');
        that.wrapper.classList.add('module-catalog-move_in');
        helper.css(that.icon, {
          lineHeight: '40px'
        });

        // fix the wrapper style
        container_wrapper.classList.remove('container-wrapper');
        container_wrapper.classList.add('container-wrapper-active');

        // active current tag
        that.headers.forEach((item) => {
          let top = item.getBoundingClientRect().top;
          catalogList.forEach((catalog) => {
            if(top >= 0 && top < 40) {
              catalog.title === item.id ? catalog.classList.add('active') : catalog.classList.remove('active');
            }
          });
        });
      } else {
        if(that.overLine) {
          // hide the catalog
          that.wrapper.classList.remove('module-catalog-move_in');
          that.wrapper.classList.add('module-catalog-move_out');
          helper.css(that.icon, {
            lineHeight: catalog_height
          });

          // fix the wrapper style
          container_wrapper.classList.remove('container-wrapper-active');
          container_wrapper.classList.add('container-wrapper');
        }
      }
    });
  },

  initDom: function() {
    this.wrapper.appendChild(this.icon);
    this.wrapper.appendChild(this.content);
    document.body.appendChild(this.wrapper);
  },

  initItems: function() {
    let that = this;
    this.headers = Array.from(helper.selectAll('h1,h2,h3,h4,h5')).slice(1);
    this.headers.forEach((item) => {
      var hd = helper.createDom('a');
      item.id ? hd.href = '#' + item.id : null;
      item.id ? hd.text = '• ' + item.id : null;
      item.id ? hd.title = item.id : null;
      helper.css(hd, {
        paddingLeft: 15 * (item.tagName.slice(1) - 1) + 'px'
      });
      that.content.appendChild(hd);
    });
  }
};

function AddCatalog() {
  new addCatalog().init();
}

module.exports = AddCatalog;