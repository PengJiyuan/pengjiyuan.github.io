/*
 * Some common js helper
 * Author: PJY
 *
 */

module.exports = {
  selectOne: function(selector) {
    return document.querySelector(selector);
  },

  selectAll: function(selector) {
    return document.querySelectorAll(selector);
  },

  //get class style
  getStyle: function(selector){
    return selector.currentStyle ? selector.currentStyle : document.defaultView.getComputedStyle(selector, null);
  },

  //get the page scroll pixel
  getScrollY: function() {
    return (window.pageYOffset !== undefined) ?
      window.pageYOffset : (document.body || document.documentElement || document.body.parentNode).scrollTop;
  },

  createDom: function(name, className, styles) {
    let obj = document.createElement(name);
    obj.classList = className ? className : '';
    if(styles && styles instanceof Object) {
      for(let key in styles) {
        obj.style[key] = styles[key];
      }
    }
    return obj;
  },

  //change element's style
  css: function(element, styles) {
    if(styles && styles instanceof Object) {
      for(let key in styles) {
        element.style[key] = styles[key];
      }
    }
  },

  bind: function(element, type, handler) {
    if (element.addEventListener){
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent){
      element.attachEvent('on' + type, handler);
    } else {
      element['on' + type] = handler;
    }
  }
};