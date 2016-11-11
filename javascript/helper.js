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

	createDom: function(name, options) {
		let obj = document.createElement(name);
		if(options && options instanceof Object) {
			for(let key in options) {
				obj.style[key] = options[key];
			}
		}
		return obj;
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
}