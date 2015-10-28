/************************Сравнение объектов***********************/
function containerObjectsAreSame(x, y) {
	if (!x || !y)
		return undefined;
	var objectsAreSame = true;
	// for(var propertyName in x) {
	//    if(x[propertyName] !== y[propertyName]) {
	//       objectsAreSame = false;
	//       break;
	//    }
	// }
	for (var propertyName in x.itemRef) {
		if (x.itemRef[propertyName] !== y.itemRef[propertyName]) {
			objectsAreSame = false;
			break;
		}
	}

	for (var propertyName in x.cssContainer) {
		if (x.cssContainer[propertyName] !== y.cssContainer[propertyName]) {
			objectsAreSame = false;
			break;
		}
	}

	for (var i in x.childItems) {
		var curChildx = x.childItems[i];
		var curChildy = y.childItems[i];

		for (var propertyName in curChildx.itemRef) {
			if (curChildx.itemRef[propertyName] !== curChildy.itemRef[propertyName]) {
				objectsAreSame = false;
				break;
			}
		}

		for (var propertyName in curChildx.css) {
			if (curChildx.css[propertyName] !== curChildy.css[propertyName]) {
				objectsAreSame = false;
				break;
			}
		}
	}
	return objectsAreSame;
}

/************************КОПИРОВАНИЕ ОБЪЕКТОВ*********************************/
function clone(obj) {
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		var copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		}
		return copy;
	}

}