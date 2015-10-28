function convertFontSize(fontSize, source, target) {
	var globalFS = parseFloat($("#main_slide").css('font-size'));
	//Конвертируем сначала в px, потом из него в требуемый
	var ptKoef = (0.35146 / 25.4) * 96; //Коэффициент пересчета пикселей в pt
	var sourceSizePx = fontSize;
	switch (source) {
		case 'pt':
			sourceSizePx = fontSize * ptKoef;
			break;
		case 'em':
			sourceSizePx = fontSize * globalFS;
			break;
	}

	switch (target) {
		case 'pt':
			return Math.round(sourceSizePx / ptKoef);
			break;
		case 'px':
			return sourceSizePx;
			break;
		case 'em':
			return (sourceSizePx / globalFS).toFixed(4);
			break;
	}
}

function convertContainerSizesPercentToPx(container, curIndex) {
	for (var k in container.childItems) {
		if (k === curIndex)
			continue;
		var curItem = container.childItems[k];
		curItem.itemRef.top = parseFloat(curItem.itemRef.top) * container.itemRef.height / 100;
		curItem.itemRef.height = parseFloat(curItem.itemRef.height) * container.itemRef.height / 100;
		curItem.itemRef.left = parseFloat(curItem.itemRef.left) * container.itemRef.width / 100;
		curItem.itemRef.width = parseFloat(curItem.itemRef.width) * container.itemRef.width / 100;
	}
}

function convertContainerSizesPxToPercent(container, curIndex) {
	var maxItemWidth = 0;
	for (var k in container.childItems) {
		var curItem = container.childItems[k];
		var tmpWidth = parseFloat(curItem.itemRef.left) + parseFloat(curItem.itemRef.width);
		if (tmpWidth > maxItemWidth)
			maxItemWidth = tmpWidth;

	}

	container.itemRef.width = maxItemWidth;
	for (var k in container.childItems) {
		var curItem = container.childItems[k];
		curItem.itemRef.top = parseFloat(curItem.itemRef.top) / parseFloat(container.itemRef.height) * 100 + '%';
		curItem.itemRef.height = parseFloat(curItem.itemRef.height) / parseFloat(container.itemRef.height) * 100 + '%';
		curItem.itemRef.left = parseFloat(curItem.itemRef.left) / parseFloat(container.itemRef.width) * 100 + '%';
		curItem.itemRef.width = parseFloat(curItem.itemRef.width) / parseFloat(container.itemRef.width) * 100 + '%';
	}

	// container.convertContainerSizeInPercent();
	container.itemRef.top = parseFloat(container.itemRef.top) / presentationObject.curHeight * 100 + '%';
	container.itemRef.height = parseFloat(container.itemRef.height) / presentationObject.curHeight * 100 + '%';
	container.itemRef.left = parseFloat(container.itemRef.left) / presentationObject.curWidth * 100 + '%';
	container.itemRef.width = parseFloat(container.itemRef.width) / presentationObject.curWidth * 100 + '%';
}