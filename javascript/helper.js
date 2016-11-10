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

	getStyle: function(selector){
	  return selector.currentStyle ? selector.currentStyle : document.defaultView.getComputedStyle(selector, null);
	}
}