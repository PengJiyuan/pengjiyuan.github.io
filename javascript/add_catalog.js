/*
 * add catalog
 */

let helper = require('./helper');
let header_height = parseInt(helper.getStyle(helper.selectOne('header')).height);

let addCatalog = function() {  
}

addCatalog.prototype = {
	
	init: function() {
		//this.initDom();
		/*helper.bind(document, 'scroll', function() {
			if(helper.getScrollY() > header_height) {
				document.body.style.backgroundColor = 'red';
			} else {
				document.body.style = '';
			}
		});*/
	},

	initDom: function() {
		var wrapper = helper.createDom('div', {
			width: '100px',
			height: '200px',
			backgroundColor: 'red'
		});
		document.body.appendChild(wrapper);
	}

};

module.exports = addCatalog;