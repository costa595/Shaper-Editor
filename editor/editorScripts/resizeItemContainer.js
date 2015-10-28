function resizeItemContainer(containerItem, changeWidth, HTMLObject) { //HTMLObject: Если с JQuery, то передается объект контенйера. С Angular - false или undefined
	var borders = 4;
	var bordersForWidthText = 8;
	var bordersForWidthImage = 5;
	var bordersForHeight = 3;
	var width = 0;
	var minLeft = Infinity;
	var minTop = Infinity;
	var height = 0;
	var DOMElement = $("#tmpTextPlace");
	DOMElement.attr('style', '');
	DOMElement.html('');

	var initedContainerWidthPx = containerItem.sizeInPx('width');
	var initedContainerHeightPx = containerItem.sizeInPx('height');

	//Новые значения размера контейнера
	var newContainerWidth = 0;
	var newContainerHeight = 0;

	// Перевод размера элементов в пиксели
	containerItem.convertChildsSizeInPx();
	for (var k in containerItem.childItems) {
		var curChild = containerItem.childItems[k];
	}

	//Подсчет ширины
	if (changeWidth && !containerItem.preventAutoResize) {
		var onlyTextItems = true;
		console.log('containerItem.childItems', clone(containerItem.childItems))
		for (var k in containerItem.childItems) {
			var curChild = containerItem.childItems[k];
			var curLeft = curChild.itemRef.left;
			if (curChild.key == 'textItem') {
				//Та же логика, что и в контейнере. Если пользак вручную изменил ширину текстового поля, то оставляем его ширину
				if (curChild.preventAutoResize) {
					tmpWidth = curChild.sizeInPx(containerItem, 'width'); //Ширина в пикселях
					curChild.itemRef.width = parseFloat(tmpWidth);
					curChild.css.width = '100%';
				} else {
					// var prevChildCssWidth = curChild.css.width; //Сбросим сначала ширину элемента, прежде чем переносить стили в tmpText
					curChild.css.width = '';
					DOMElement.css(curChild.css);
					var textAlign = curChild.css['text-align'];
					if (textAlign == 'left')
						curChild.css.width = '150%';
					else
						curChild.css.width = '100%';
					DOMElement.html(curChild.value);
					tmpWidth = parseFloat(DOMElement.width()) + bordersForWidthText;
					curChild.itemRef.width = tmpWidth;
				}
				// curChild.itemRef.width = parseFloat(tmpWidth + bordersForWidth);

			} else if (curChild.key == 'objectItem') {
				onlyTextItems = false;
				tmpWidth = curChild.itemRef.width;
				// tmpWidth = curChild.sizeInPx(containerItem, 'width'); //Ширина в пикселях
				// console.log('objectItem tmpWidth', tmpWidth, curChild.itemRef.width)
				// curChild.itemRef.width = tmpWidth;
			}

			tmpWidth += curLeft;

			console.log('tmpWidth', tmpWidth)
			if (tmpWidth > newContainerWidth)
				newContainerWidth = tmpWidth;
			if (curLeft < minLeft)
				minLeft = curLeft;
		}
		if (onlyTextItems) {
			for (var k in containerItem.childItems) {
				var curChild = containerItem.childItems[k];
				curChild.itemRef.width = newContainerWidth;
			}
		}
		//if (containerItem.childItems.length = 1 && containerItem.childItems[0].key != 'objectItem')
		// 	newContainerWidth += bordersForWidth/2;
		// else 
		if (containerItem.childItems.length > 1 || (containerItem.childItems.length == 1 && containerItem.childItems[0].key == 'objectItem')) {
			newContainerWidth += bordersForWidthImage;
		} else {
			newContainerWidth += bordersForWidthText;
		}
		console.log('newContainerWidth', newContainerWidth)
	} else {
		newContainerWidth = initedContainerWidthPx;

		var maxChildWidth = 0;

		for (var k in containerItem.childItems) {
			// containerItem.childItems[k].css.width = '100%';

			//Если у элемента ширина больше, чем контейнер, то изменить ширину контейнера до нее
			//Конфликты в наложениях исправятся ниже
			if (containerItem.childItems[k].itemRef.width > maxChildWidth)
				maxChildWidth = containerItem.childItems[k].itemRef.width;

			var curLeft = containerItem.childItems[k].itemRef.left;
			if (curLeft < minLeft)
				minLeft = curLeft;
		}
		if (maxChildWidth > newContainerWidth)
			newContainerWidth = maxChildWidth;

	}

	console.log('minLeft', minLeft);

	if (minLeft > 0) {
		for (var k in containerItem.childItems) {
			containerItem.childItems[k].itemRef.left -= minLeft;
		}
	}
	newContainerWidth -= minLeft;
	//Подсчет высоты
	var maxBottom = 0;

	//Изменение высоты для контейнера и объектов
	for (var i in containerItem.childItems) {
		var elementHeight;
		var curChild = containerItem.childItems[i];
		var curItemTop = parseFloat(curChild.itemRef.top);
		if (curChild.key == 'textItem') {
			DOMElement.css(curChild.css);
			DOMElement.css('height', '');
			DOMElement.css('border', '');

			DOMElement.html(curChild.value);
			//почему?
			DOMElement.css('width', curChild.itemRef.width);
			elementHeight = parseFloat(DOMElement.height()) - 2;

			var prevHeight = parseFloat(curChild.itemRef.height);
			

			var curItemBottom = prevHeight + curItemTop;
			var curItemLeft = parseFloat(curChild.itemRef.left);
			var curItemRight = curItemLeft + parseFloat(curChild.itemRef.width);

			curChild.itemRef.height = elementHeight;

			//Увеличить top у всех элементов снизу
			var heightDifference = elementHeight - prevHeight;
			if (heightDifference.toFixed(2) != 0) {
				for (var k in containerItem.childItems) {
					if ((k == i) || (k == 0))
						continue;
					var tmpChild = containerItem.childItems[k];
					var tmpTop = parseFloat(tmpChild.itemRef.top);
					var tmpLeft = parseFloat(tmpChild.itemRef.left);
					var tmpRight = tmpLeft + parseFloat(tmpChild.itemRef.width);


					if ((tmpTop.toFixed(2) >= curItemBottom.toFixed(2)) && (tmpRight.toFixed(2) >= curItemLeft.toFixed(2)) && (tmpLeft.toFixed(2) <= curItemRight.toFixed(2))) {
						tmpChild.itemRef.top = tmpTop + heightDifference;
					}
				}
			}

		} else if (curChild.key == 'objectItem') {
			elementHeight = curChild.itemRef.height + 4;
		}
		var curBottom = curChild.itemRef.top + elementHeight;
		if (maxBottom < curBottom) {
			newContainerHeight = maxBottom = curBottom.toFixed(2);
		}

		if (curItemTop < minTop)
			minTop = curItemTop;
	}

	console.log('minTop', minTop);

	if (minTop > 0) {
		for (var k in containerItem.childItems) {
			containerItem.childItems[k].itemRef.top -= minTop;
		}
	}

	//Предотвращение наложения
	for (var k in containerItem.childItems) {
		var curChild = containerItem.childItems[k];

		var curItemHeight = parseFloat(curChild.itemRef.height);
		var curItemTop = parseFloat(curChild.itemRef.top);
		var curItemBottom = curItemHeight + curItemTop;
		var curItemLeft = parseFloat(curChild.itemRef.left);
		var curItemRight = curItemLeft + parseFloat(curChild.itemRef.width);

		for (var i in containerItem.childItems) {
			if (k == i)
				continue;

			var tmpChild = containerItem.childItems[i];
			var tmpTop = parseFloat(tmpChild.itemRef.top);
			var tmpLeft = parseFloat(tmpChild.itemRef.left);
			var tmpRight = tmpLeft + parseFloat(tmpChild.itemRef.width);
			var tmpBottom = tmpTop + parseFloat(tmpChild.itemRef.height)

			//Вертикальные наложения (идем сверху вниз -> Интересует наложение только снизу)
			console.log('Вертиклаьные наложения ', i, k, tmpTop, curItemTop, ' - ', tmpRight, curItemLeft, ' - ', tmpLeft, curItemRight, ' - ', tmpTop, curItemBottom);
			if ((tmpTop > curItemTop) && (tmpRight >= curItemLeft) && (tmpLeft <= curItemRight) && (tmpTop < (curItemBottom + 5))) {
				var topDiff = curItemBottom - tmpTop;
				for (var m in containerItem.childItems) {
					if (k == m || m == i)
						continue;
					var childToMove = containerItem.childItems[m];

					var moveChildTop = parseFloat(childToMove.itemRef.top);
					var moveChildLeft = parseFloat(childToMove.itemRef.left);
					var moveChildRight = moveChildLeft + parseFloat(childToMove.itemRef.width);

					// var tmpHeight = parseFloat(tmpChild.itemRef.height);

					if ((moveChildTop.toFixed(2) >= tmpTop.toFixed(2)) && (moveChildRight.toFixed(2) >= tmpLeft.toFixed(2)) && (moveChildLeft.toFixed(2) <= tmpRight.toFixed(2))) {
						childToMove.itemRef.top = parseFloat(childToMove.itemRef.top) + topDiff;
					}

				}
				tmpTop += topDiff;
				tmpChild.itemRef.top = tmpTop + 5;


				newContainerHeight = parseFloat(newContainerHeight) + topDiff;

			}

			//Горизонтальные наложения (идем слева направо -> Интересует наложение только справа)
			if ((tmpLeft > curItemLeft) && (tmpTop < curItemBottom) && (tmpBottom > curItemTop) && (tmpLeft < curItemRight)) {
				var leftDiff = curItemRight - tmpLeft;
				for (var m in containerItem.childItems) {
					if (k == m || m == i)
						continue;
					var childToMove = containerItem.childItems[m];

					var moveChildTop = parseFloat(childToMove.itemRef.top);
					var moveChildLeft = parseFloat(childToMove.itemRef.left);
					var moveChildBottom = moveChildTop + parseFloat(childToMove.itemRef.height);

					// var tmpHeight = parseFloat(tmpChild.itemRef.height);

					if ((moveChildLeft.toFixed(2) >= tmpLeft.toFixed(2)) && (moveChildTop.toFixed(2) <= tmpBottom.toFixed(2)) && (moveChildBottom.toFixed(2) >= tmpTop.toFixed(2))) {
						childToMove.itemRef.left = parseFloat(childToMove.itemRef.left) + leftDiff;
					}

				}
				tmpLeft += leftDiff;
				tmpChild.itemRef.left = tmpLeft;

				newContainerWidth = parseFloat(newContainerWidth) + leftDiff;
			}
		}
	}

	console.log('newContainerHeight', newContainerHeight)
	containerItem.itemRef.height = (parseFloat(newContainerHeight) + verticalBorders) / presentationObject.curHeight * 100 + '%';
	containerItem.itemRef.width = newContainerWidth / presentationObject.curWidth * 100 + '%';

	console.log('containerItem.childItems', clone(containerItem.childItems))
	containerItem.convertChildsSizeInPercent();
	console.log('containerItem.childItems - 2', clone(containerItem.childItems))

	if (HTMLObject) {
		HTMLObject.width(newContainerWidth);
		HTMLObject.height(newContainerHeight);
	}
	//DOMElement.attr('style', '');
}

//*********************************************** OLD ****************************************************

// function resizeItemContainer(containerItem, changeWidth, HTMLObject) { //HTMLObject: Если с JQuery, то передается объект контенйера. С Angular - false или undefined
// 	//var padding = 6;
// 	var borders = 4;
// 	var bordersForWidth = 0;
// 	var bordersForHeight = 0;
// 	var width = 0;
// 	var minLeft = Infinity;
// 	var height = 0;
// 	var DOMElement = $("#tmpTextPlace");
// 	DOMElement.attr('style', '');
// 	DOMElement.html('');

// 	//поиск максимальной ширины
// 	var initedContainerWidth = containerItem.itemRef.width;
// 	var containerWidthPx = parseFloat(containerItem.itemRef.width);
// 	if (containerItem.itemRef.width.indexOf('%') != -1) { //Ширина в процентах (после вызова) ассистента
// 		containerWidthPx = containerWidthPx * presentationObject.curWidth / 100;
// 	}

// 	var containerHeightPx = containerItem.sizeInPx('height');

// 	if (changeWidth && !containerItem.preventAutoResize) {
// 		bordersForWidth = borders;
// 		bordersForHeight = borders;
// 		for (var i in containerItem.childItems) {
// 			var tmpWidth = 0;
// 			var curLeft;
// 			var curChild = containerItem.childItems[i];
// 			if (curChild.key == 'textItem') {
// 				//Та же логика, что и в контейнере. Если пользак вручную изменил ширину текстового поля, то оставляем его ширину
// 				if (curChild.preventAutoResize) {
// 					tmpWidth = parseFloat(curChild.itemRef.width) * curContainerWidth / 100; //Ширина в пикселях
// 				} else {
// 					DOMElement.css(curChild.css);
// 					DOMElement.html(curChild.value);
// 					curLeft = parseFloat(curChild.itemRef.left) * containerWidthPx / 100;
// 					tmpWidth = parseFloat(DOMElement.width()) + curLeft;
// 				}
// 				curChild.itemRef.width = parseFloat(DOMElement.width());
// 			} else if (curChild.key == 'objectItem') {
// 				tmpWidth = parseFloat(curChild.itemRef.width) / 100 * containerWidthPx;
// 				curChild.itemRef.width = tmpWidth;
// 				curLeft = parseFloat(curChild.itemRef.left) / 100 * containerWidthPx;
// 				tmpWidth += curLeft;
// 			}

// 			if (tmpWidth > width)
// 				width = tmpWidth;
// 			if (curLeft < minLeft)
// 				minLeft = curLeft;
// 		}

// 		if (minLeft > 0)
// 			for (var i in containerItem.childItems) {
// 				var curChild = containerItem.childItems[i];
// 				var childNewLeft = parseFloat(curChild.itemRef.left) * containerWidthPx / 100 - minLeft;
// 				curChild.itemRef.left = childNewLeft / containerWidthPx * 100 + '%';
// 			}

// 	} else {
// 		width = containerWidthPx;
// 		DOMElement.css('width', containerWidthPx);
// 	}



// 	var maxBottom = 0;
// 	//Изменение высоты для контейнера и объектов
// 	for (var i in containerItem.childItems) {
// 		var curItemTopPx, elementHeight;
// 		if (containerItem.childItems[i].key == 'textItem') {
// 			DOMElement.css(containerItem.childItems[i].css);
// 			DOMElement.css('height', '');
// 			DOMElement.css('border', '');

// 			DOMElement.html(containerItem.childItems[i].value);
// 			var curItemWidthPx = parseFloat(containerItem.childItems[i].itemRef.width) * containerWidthPx / 100;
// 			DOMElement.css('width', curItemWidthPx + 1);
// 			elementHeight = parseFloat(DOMElement.height()) - 2;
// 			// height += elementHeight;
// 			var prevHeight = parseFloat(containerItem.childItems[i].itemRef.height);
// 			var curItemTop = parseFloat(containerItem.childItems[i].itemRef.top);
// 			curItemTopPx = parseFloat(containerItem.childItems[i].itemRef.top) * containerHeightPx / 100;

// 			var curItemBottom = prevHeight + curItemTop;
// 			var curItemLeft = parseFloat(containerItem.childItems[i].itemRef.left);
// 			var curItemRight = curItemLeft + parseFloat(containerItem.childItems[i].itemRef.width);

// 			containerItem.childItems[i].itemRef.height = elementHeight;

// 			//Увеличить top у всех элементов снизу
// 			var heightDifference = elementHeight - prevHeight * containerHeightPx / 100;
// 			if (heightDifference.toFixed(2) != 0) {
// 				for (var k in containerItem.childItems) {
// 					if ((k == i) || (k == 0))
// 						continue;
// 					var tmpTop = parseFloat(containerItem.childItems[k].itemRef.top);
// 					var tmpLeft = parseFloat(containerItem.childItems[k].itemRef.left);
// 					var tmpRight = tmpLeft + parseFloat(containerItem.childItems[k].itemRef.width);

// 					if ((tmpTop.toFixed(2) >= curItemBottom.toFixed(2)) && (tmpRight.toFixed(2) >= curItemLeft.toFixed(2)) && (tmpLeft.toFixed(2) <= curItemRight.toFixed(2))) {
// 						prevHeight = prevHeight * containerHeightPx / 100;
// 						var tmpTopPx = tmpTop * containerHeightPx / 100 + heightDifference;
// 						// containerItem.childItems[k].itemRef.top = tmpTopPx / containerHeightPx * 100 +'%';
// 						containerItem.childItems[k].itemRef.top = tmpTopPx;
// 					}
// 				}
// 			}

// 		} else if (containerItem.childItems[i].key == 'objectItem') {
// 			elementHeight = 0;
// 			curItemTopPx = parseFloat(containerItem.childItems[i].itemRef.top) * containerHeightPx / 100;
// 			if (containerItem.childItems[i].itemRef.height.indexOf('%') == -1) { //в пикселях
// 				elementHeight += parseFloat(containerItem.childItems[i].itemRef.height);
// 			} else { //в процентах
// 				elementHeight += parseFloat(containerItem.childItems[i].itemRef.height) / 100 * containerHeightPx;
// 			}
// 		}
// 		var curBottom = curItemTopPx + elementHeight;
// 		if (maxBottom < curBottom) {
// 			height = maxBottom = curBottom.toFixed(2);
// 		}
// 	}

// 	//Пересчитываем в проценты
// 	height += 2;
// 	var widthPercent = (width + bordersForWidth) / presentationObject.curWidth * 100 + '%';
// 	var heightPercent = (height) / presentationObject.curHeight * 100 + '%';

// 	containerItem.itemRef.width = widthPercent;

// 	//containerItem.itemRef.height = height;
// 	if (containerItem.preventAutoResize) { //запрет на автоматическое изменение висоты (если пользак сам изменил размер области)
// 		if (parseFloat(containerItem.itemRef.height) < height) {
// 			containerItem.itemRef.height = heightPercent;
// 		}
// 	} else {
// 		containerItem.itemRef.height = heightPercent;
// 	}

// 	//Перевод ширины и высоты для каждого элемента из пикселей в проценты
// 	var containerHPx = parseFloat(containerItem.itemRef.height) * presentationObject.curHeight / 100;
// 	var containerWPx = parseFloat(containerItem.itemRef.width) * presentationObject.curWidth / 100;
// 	var resizeItemWidth = true;
// 	// if (containerItem.childItems.length == 1)
// 	// 	resizeItemWidth = false
// 	if ((containerItem.childItems.length == 1) && (containerItem.childItems[0].key == 'objectItem')) {
// 		//Если только одна картинка, то делаем контейнера квадратным

// 		var resizeKoef = containerItem.childItems[0].initedsize.width / containerItem.childItems[0].initedsize.height;
// 		containerItem.itemRef.width = (containerHPx * resizeKoef) / presentationObject.curWidth * 100 + '%';

// 		containerItem.itemRef.height = containerHPx / presentationObject.curHeight * 100 + '%';

// 		if (containerItem.childItems[0].itemRef.height.indexOf('%') != -1) { //в пикселях
// 			// containerItem.childItems[0].itemRef.height = parseFloat(containerItem.childItems[0].itemRef.height) / height * 100 + '%';
// 			containerItem.childItems[0].itemRef.height = parseFloat(containerItem.childItems[0].itemRef.height) * height / 100;
// 		}

// 		containerItem.childItems[0].itemRef.height = parseFloat(containerItem.childItems[0].itemRef.height - bordersForHeight) / height * 100 + '%';

// 		if (resizeItemWidth && changeWidth && !containerItem.preventAutoResize) {
// 			containerItem.childItems[0].itemRef.width = containerItem.childItems[0].itemRef.width / containerWPx * 100 + '%';
// 		}

// 	} else {
// 		for (var i in containerItem.childItems) {
// 			var curChild = containerItem.childItems[i];
// 			if (curChild.key == 'textItem') {
// 				curChild.itemRef.height = parseFloat(curChild.itemRef.height) / height * 100 + '%';
// 				//Проблема с ресайзом по ширине. пока оставлю ширину на 100%
// 				// curChild.itemRef.width = '100%';
// 				// curChild.itemRef.width = parseFloat(curChild.itemRef.width) / containerW * 100 + '%';
// 			} else if (curChild.key == 'objectItem') {
// 				if (curChild.itemRef.height.indexOf('%') == -1) { //в пикселях
// 					curChild.itemRef.height = parseFloat(curChild.itemRef.height) / height * 100 + '%';
// 				} else { //в процентах
// 					//height += parseFloat(curChild.itemRef.height) / 100 * containerHeightPx;
// 				}
// 			}
// 			//Left, top
// 			var prevLeftPx = parseFloat(curChild.itemRef.left) * containerWidthPx / 100;
// 			var prevTopPx = parseFloat(curChild.itemRef.top) * containerHeightPx / 100;
// 			curChild.itemRef.left = (prevLeftPx + borders) / containerWPx * 100 + '%';
// 			if (typeof curChild.itemRef.top == "string") {
// 				if (curChild.itemRef.top.indexOf('%') == -1) { //в пикселях
// 					prevTopPx = curChild.itemRef.top;
// 				}
// 			} else {
// 				prevTopPx = curChild.itemRef.top;
// 			}

// 			curChild.itemRef.top = prevTopPx / containerHPx * 100 + '%';

// 			if (resizeItemWidth && changeWidth && !containerItem.preventAutoResize) {
// 				curChild.itemRef.width = curChild.itemRef.width / containerWPx * 100 + '%';
// 			}

// 			curChild.itemRef.left = '0%';
// 		}

// 		// for (var i in containerItem.childItems) {
// 		// 	var curTop = parseFloat(containerItem.childItems[i].itemRef.top) * containerHeightPx / 100;
// 		// 	curChild.itemRef.top = (curTop ) / containerHPx * 100 + '%';
// 		// }
// 	}

// 	var curItemContainer = angular.element('#item' + containerItem.curId); //HTML объект контейнера
// 	resizeHandlerE = curItemContainer.find(".angular-dnd-resizable-handle-e"); //HTML объект ресайзера
// 	var handlerTopPercent = (containerHPx / 2 - 3.5) / containerHPx * 100 + '%';
// 	resizeHandlerE.css('top', handlerTopPercent)

// 	resizeHandlerW = curItemContainer.find(".angular-dnd-resizable-handle-w"); //HTML объект ресайзера
// 	var handlerTopPercent = (containerHPx / 2 - 3.5) / containerHPx * 100 + '%';
// 	resizeHandlerW.css('top', handlerTopPercent)


// 	if (HTMLObject) {
// 		HTMLObject.width(width)
// 		HTMLObject.height(height)
// 	}
// 	//DOMElement.attr('style', '');
// }