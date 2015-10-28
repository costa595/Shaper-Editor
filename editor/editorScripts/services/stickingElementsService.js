/***************************ПРИКРЕПЛЕНИЕ ЭЛЕМЕНТОВ**************************/

angular.module('presEditor').factory("stickingElementsService", function() {

	var stickingElementsService = function($scope, avoidBodyClick, closeItem, moveTextEtitPopup, deleteChildItem, tmpTextItemNumber, tmpImageItemNumber) { 

		var myService = this,
			tmpAddedItems = new Object(); //Массив временных прикрепленных элементов.

		//инициализация прикрепления текста к элементу и отображение нужного меню
		myService.initTextAddShow = function(item) { 
			var key;
			if (item == 'group') {
				key = item;
			} else {
				key = item.key;
			}

			$scope.textStylePopup.addedTextType = [];

			switch (key) {
				case 'textItem':
					myService.openChildTextAdd(item.textType);
					$scope.addShow.addTextText = true;
				break;

				case 'objectItem':
					var i = 0;
					for (var k in textBlocksText) {
						if (k == 'header')
							continue;
						$scope.textStylePopup.addedTextType[i] = new Object();
						$scope.textStylePopup.addedTextType[i].type = k;
						$scope.textStylePopup.addedTextType[i].name = textBlocksText[k];
						i++;
					}
					$scope.addShow.addTextPicture = true;
				break;

				case 'group':
					var i = 0;
					for (var k in textBlocksText) {
						if (k == 'header')
							continue;
						$scope.textStylePopup.addedTextType[i] = new Object();
						$scope.textStylePopup.addedTextType[i].type = k;
						$scope.textStylePopup.addedTextType[i].name = textBlocksText[k];
						i++;
					}
					$scope.addShow.addTextPicture = true;
				break;
			}
		}

		$scope.checkClassTextTypeAdd = function(textType) {
			if (!$scope.curItem)
				return 'addTypeSubtitleInActive';
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					if ($scope.curItem.childItems[k].textType == textType) {
						return 'addTypeSubtitleActive';
					}
				}
			}
			return 'addTypeSubtitleInActive';
		}

		//инициализация для прикрепления текста к тексту
		myService.openChildTextAdd = function(textType) {
			var i = 0;
			for (var k in textBlocksText) {
				if ((k == 'header') || (k == textType))
					continue;

				$scope.textStylePopup.addedTextType[i] = new Object();
				$scope.textStylePopup.addedTextType[i].type = k;
				$scope.textStylePopup.addedTextType[i].name = textBlocksText[k];
				i++;
			}
		}

		$scope.showPlusText = function() { //Отображаем прикрепление текста
			if ($scope.addShow.addTextText || $scope.addShow.addTextPicture)
				return;

			if (tmpAddedItems.text) {
				var prevWidth = $scope.curItem.itemRef.width;
				var prevHeight = $scope.curItem.itemRef.height;

				myService.appendChildItem(tmpAddedItems.text.item);
				$scope.curItem.childItems = changeContainerToPattern($scope.curItem.childItems, tmpAddedItems.text.pattern);
				// resizeItemContainer($scope.curItem, true);
				// restoredItemId = tmpAddedItems.parentItem;
				// $scope.curItem.childItems = tmpAddedItems.text.pattern;
				$scope.curItem.itemRef.width = tmpAddedItems.containerWidth;
				$scope.curItem.itemRef.height = tmpAddedItems.containerHeight;

				tmpAddedItems.containerWidth = prevWidth;
				tmpAddedItems.containerHeight = prevHeight;
				resizeItemContainer($scope.curItem, true);
			}


			myService.closeAllPlus();
			if ($scope.curItem.curActiveChildItem) {
				myService.initTextAddShow($scope.curItem.curActiveChildItem)
			} else {
				var wasNotInited = true;
				if (tmpAddedItems.text) {
					if (tmpAddedItems.text.parentItem != undefined) {
						wasNotInited = false;
						myService.initTextAddShow($scope.curItem.childItems[tmpAddedItems.text.parentItem]);
					}
				} else if (tmpAddedItems.picture) {
					wasNotInited = false;
					myService.initTextAddShow($scope.curItem.childItems[tmpAddedItems.picture.parentItem]);
				} else if (tmpAddedItems.curParent != undefined) {
					wasNotInited = false;
					myService.initTextAddShow($scope.curItem.childItems[tmpAddedItems.curParent]);
				}
				if (wasNotInited) {
					if ($scope.curItem.childItems.length > 1) {
						myService.initTextAddShow('group');
					} else {
						myService.initTextAddShow($scope.curItem.childItems[0]) //Если 1 элемент, то прикрепление по типу этого элемента
					}
				}

			}
		}

		$scope.showPlusPicture = function() { //Отображаем прикрепление картинки
			if ($scope.addShow.addPictureText || $scope.addShow.addPicturePicture)
				return;

			if (tmpAddedItems.picture) {
				var prevWidth = $scope.curItem.itemRef.width;
				var prevHeight = $scope.curItem.itemRef.height;

				myService.appendChildItem(tmpAddedItems.picture.item);
				$scope.curItem.childItems = changeContainerToPattern($scope.curItem.childItems, tmpAddedItems.picture.pattern);
				var tmpO = clone($scope.curItem.childItems);
				// $scope.curItem.childItems = tmpAddedItems.picture.pattern;
				$scope.curItem.itemRef.width = tmpAddedItems.containerWidth;
				$scope.curItem.itemRef.height = tmpAddedItems.containerHeight;

				tmpAddedItems.containerWidth = prevWidth;
				tmpAddedItems.containerHeight = prevHeight;
				// resizeItemContainer($scope.curItem, true);
				// return;
				resizeItemContainer($scope.curItem, true);
			}

			myService.closeAllPlus();

			if ($scope.curItem.curActiveChildItem) {
				// console.log('$scope.curItem.curActiveChildItem.key', $scope.curItem.curActiveChildItem.key)
				switch ($scope.curItem.curActiveChildItem.key) {
					case 'textItem':
						$scope.addShow.addPictureText = true;
						break;
					case 'objectItem':
						$scope.addShow.addPicturePicture = true;
						break;
				}
			} else {
				if (tmpAddedItems.picture && $scope.curItem.childItems.length == 2 || $scope.curItem.childItems.length == 1) {
					//Если 1 элемент, то прикрепление по типу этого элемента
					var key;
					var wasNotInited = true;
					if (tmpAddedItems.picture) {
						if (tmpAddedItems.picture.parentItem != undefined) {
							key = $scope.curItem.childItems[tmpAddedItems.picture.parentItem].key;
							wasNotInited = false;
						}
					}

					if (wasNotInited)
						key = $scope.curItem.childItems[0].key

					switch (key) {
						case 'textItem':
							$scope.addShow.addPictureText = true;
							break;
						case 'objectItem':
							$scope.addShow.addPicturePicture = true;
							break;
					}
				}
				else {
					$scope.addShow.addPicturePicture = true;
				} 
			}
		}

		$scope.addChildText = function(type) { //Прикрепление дочернего объекта текста
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					if ($scope.curItem.childItems[k].key == 'textItem') {
						myService.changeAddedTextType(k, type);
						return;
					}
				}
			}
			var newItem = new textItem(type, textBlocksText[type], presentationObject.template.font.fontStyles[$scope.curslide.slideType]);
			myService.appendChildItem(newItem);
		}

		myService.changeAddedTextType = function(itemId, newType) {
			var curItem = $scope.curItem.childItems[itemId];
			var fontStyle = $scope.template.font.fontStyles[$scope.curslide.slideType][newType];
			for (var k in fontStyle)
				curItem.css[k] = fontStyle[k]
			curItem.textType = newType;
			resizeItemContainer($scope.curItem, true);
		}

		$scope.addShowAddingReady = function() {
			var newItem;
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					newItem = $scope.curItem.childItems[k];
					newItem.newItem = false;
					newItem.activeClass = '';
				}
				if ($scope.curItem.childItems[k].key == 'textItem')
					$scope.curItem.childItems[k].textContainerCss["border"] = "";
				else 
					$scope.curItem.childItems[k].itemRef["border"] = "";
			}
			tmpAddedItems = {};
			avoidBodyClick = false;
			$scope.showTextFormatPopup = false;

			$scope.curItem.convertContainerSizeInPx();
			// console.log('addShowAddingReady 1 $scope.curItem', clone($scope.curItem))
			convertContainerSizesPercentToPx($scope.curItem, false);
			// console.log('addShowAddingReady 2 $scope.curItem', clone($scope.curItem))
			$scope.curItem.curPatternIndex = presentationObject.addPattern($scope.curslide.slideType, new microPattern($scope.curItem.childItems), newItem);
			// console.log('addShowAddingReady 3 $scope.curItem', clone($scope.curItem))
			convertContainerSizesPxToPercent($scope.curItem, false);
			// console.log('addShowAddingReady 4 $scope.curItem', clone($scope.curItem))
			$scope.closeLeftWindows();

			newItem.tmpPosition = '';
			newItem.parentItem = undefined;

			myService.closeAllPlus();
		}

		$scope.addShowAddingCancel = function() {
			if ($scope.curItem)
				for (var k in $scope.curItem.childItems) {
					if ($scope.curItem.childItems[k].newItem) {
						deleteChildItem($scope.curItem, k);
					}
				}
			tmpAddedItems = {};
			closeItem();
			myService.closeAllPlus();
			$scope.closeLeftWindows();
		}

		myService.closeAllPlus = function() { //Закрыть весь контент в окне добавления
			//Именуем Add Что К чему
			$scope.addShow.addTextText = false; //Текст к текст
			$scope.addShow.addTextPicture = false; //Текст к картинке / текст к группе
			$scope.addShow.addPictureText = false; //Картинка к текст
			$scope.addShow.addPicturePicture = false; //Картинка к картинке / картинка к группе
		}

		//Только если к одному тексту прикрепляется новый 1. Для прикрепления к группе другая функция
		//То есть текст к текст
		$scope.changeTextToTextPosition = function(positionType) {
			var addedItemId, tmpNewItem;
			var lastItemId = $scope.curItem.childItems.length;
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					addedItemId = k;
					tmpNewItem = $scope.curItem.childItems[k];
					break;
				}
			}


			if (tmpNewItem.tmpPosition == positionType)
				return;

			var resetHierarchy = false;


			var parentItem = $scope.curItem.childItems[tmpNewItem.parentItem];
			var strHNew = parseInt(tmpNewItem.hierarchy.split('_')[0]);
			var strHOld = parseInt(parentItem.hierarchy.split('_')[0]);

			switch (positionType) {
				case 1: //Новый текст снизу слева
					tmpNewItem.css['text-align'] = 'left';

					if (strHOld > strHNew) { //Поменять местами эти элементы и все, кто на этой строке
						// $scope.curItem.childItems.splice(addedItemId, 1); //Удалить новый элемент из массива
						// $scope.curItem.childItems.splice(tmpNewItem.parentItem, 0, tmpNewItem);
						// tmpNewItem.parentItem -= 1;
						resetHierarchy = true;
						//Менять top
						var parentTop = parentItem.itemRef.top;
						parentItem.itemRef.top = tmpNewItem.itemRef.top;
						tmpNewItem.itemRef.top = parseFloat(tmpNewItem.itemRef.top) + parseFloat(parentItem.itemRef.height) + '%';
						//Swap left
						var parentLeft = parentItem.itemRef.left;
						parentItem.itemRef.left = tmpNewItem.itemRef.left;
						tmpNewItem.itemRef.left = parentLeft;
					}
					break;
				case 2: //Новый текст сверху слева
					tmpNewItem.css['text-align'] = 'left';

					if (strHOld < strHNew) { //Поменять местами эти элементы и все, кто на этой строке
						// $scope.curItem.childItems.splice(addedItemId, 1); //Удалить новый элемент из массива
						// $scope.curItem.childItems.splice(tmpNewItem.parentItem, 0, tmpNewItem);
						// tmpNewItem.parentItem += 1;
						resetHierarchy = true;
						//Менять top
						var childTop = tmpNewItem.itemRef.top;
						tmpNewItem.itemRef.top = parentItem.itemRef.top;
						parentItem.itemRef.top = parseFloat(parentItem.itemRef.top) + parseFloat(tmpNewItem.itemRef.height) + '%';
						//Swap left
						var parentLeft = parentItem.itemRef.left;
						parentItem.itemRef.left = tmpNewItem.itemRef.left;
						tmpNewItem.itemRef.left = parentLeft;
					}

					break;
				case 3: //Новый текст сверху справа
					tmpNewItem.css['text-align'] = 'right';

					if (strHOld < strHNew) { //Поменять местами эти элементы и все, кто на этой строке
						// $scope.curItem.childItems.splice(addedItemId, 1); //Удалить новый элемент из массива
						// $scope.curItem.childItems.splice(tmpNewItem.parentItem, 0, tmpNewItem);
						// tmpNewItem.parentItem += 1;
						resetHierarchy = true;
						//Менять top
						var childTop = tmpNewItem.itemRef.top;
						tmpNewItem.itemRef.top = parentItem.itemRef.top;
						parentItem.itemRef.top = parseFloat(parentItem.itemRef.top) + parseFloat(tmpNewItem.itemRef.height) + '%';
						//Swap left
						var parentLeft = parentItem.itemRef.left;
						parentItem.itemRef.left = tmpNewItem.itemRef.left;
						tmpNewItem.itemRef.left = parentLeft;
					}

					break;
				case 4: //Новый текст снизу справа
					tmpNewItem.css['text-align'] = 'right';

					if (strHOld > strHNew) { //Поменять местами эти элементы и все, кто на этой строке
						// $scope.curItem.childItems.splice(addedItemId, 1); //Удалить новый элемент из массива
						// $scope.curItem.childItems.splice(tmpNewItem.parentItem, 0, tmpNewItem);
						// tmpNewItem.parentItem -= 1;
						resetHierarchy = true;
						//Менять top
						var parentTop = parentItem.itemRef.top;
						parentItem.itemRef.top = tmpNewItem.itemRef.top;
						tmpNewItem.itemRef.top = parseFloat(tmpNewItem.itemRef.top) + parseFloat(parentItem.itemRef.height) + '%';
						//Swap left
						var parentLeft = parentItem.itemRef.left;
						parentItem.itemRef.left = tmpNewItem.itemRef.left;
						tmpNewItem.itemRef.left = parentLeft;
					}

					break;
			}

			tmpNewItem.tmpPosition = positionType;

			if (resetHierarchy)
				myService.swapHierarchy($scope.curItem.childItems, tmpNewItem, strHNew, strHOld);

			//Изменяем текущий паттерн
			// presentationObject.changePattern($scope.curslide.slideType, $scope.curItem.curPatternIndex, new microPattern($scope.curItem.childItems))
			resizeItemContainer($scope.curItem, false);
			moveTextEtitPopup(addedItemId);
		}

		//Изменяет иерархию добавленного элемента. Container - текущий контейнер
		myService.swapHierarchy = function(container, tmpNewItem, strHNew, strHOld) {
			for (var k in $scope.curItem.childItems) {
				var hierarchy = $scope.curItem.childItems[k].hierarchy.split('_');
				var tmpStrH = parseInt(hierarchy[0]);
				var tmpVerticalH = parseInt(hierarchy[1]);
				if (tmpStrH == strHNew) {
					$scope.curItem.childItems[k].hierarchy = strHOld + '_' + tmpVerticalH;
				} else if (tmpStrH == strHOld) {
					$scope.curItem.childItems[k].hierarchy = strHNew + '_' + tmpVerticalH;
				}
			}

		}

		myService.appendChildItem = function(newItem) {
			//Разрешить автоматический ресайз так как добавился новый контент
			// $scope.curItem.preventAutoResize = false;

			setTimeout(function() {
				angular.element('.angular-dnd-resizable-handle').remove();
			}, 0)

			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					switch ($scope.curItem.childItems[k].key) {
						case 'textItem':
							tmpAddedItems.text = new Object();
							tmpAddedItems.text.item = clone($scope.curItem.childItems[k]);
							// tmpAddedItems.text.pattern = clone($scope.curItem.childItems);
							tmpAddedItems.text.pattern = new microPattern($scope.curItem.childItems);
							tmpAddedItems.text.parentItem = $scope.curItem.childItems[k].parentItem;
							break;
						case 'objectItem':
							tmpAddedItems.picture = new Object();
							tmpAddedItems.picture.item = clone($scope.curItem.childItems[k]);
							// tmpAddedItems.picture.pattern = clone($scope.curItem.childItems);
							tmpAddedItems.picture.pattern = new microPattern($scope.curItem.childItems);
							tmpAddedItems.picture.parentItem = $scope.curItem.childItems[k].parentItem;
							break;
					}


					if (!tmpAddedItems.containerWidth) {
						tmpAddedItems.containerWidth = $scope.curItem.itemRef.width;
						tmpAddedItems.containerHeight = $scope.curItem.itemRef.height;
					}
					deleteChildItem($scope.curItem, k);
				}
			}

			//Сделаем новую область активной
			newItem.activeClass = "newTextEditor";
			newItem.newItem = true;

			//Убираем рамку и кружок
			$scope.curItem.cssContainer["border"] = '';
			$scope.curItem.curClass = '';

			if (newItem.parentItem == undefined)
				if ($scope.curItem.curActiveChildItem) {
					$scope.curItem.curActiveChildItem.isActive = false;
					if ($scope.curItem.curActiveChildItem.key == 'textItem')
						$scope.curItem.curActiveChildItem.textContainerCss["border"] = "";
					else 
						$scope.curItem.curActiveChildItem.itemRef["border"] = "";
					newItem.parentItem = parseInt(tmpTextItemNumber);
				} else {
					newItem.parentItem = 0;
				}

			switch (newItem.key) {
				case 'textItem':
					if (tmpTextItemNumber != -1) {
						tmpAddedItems.curParent = tmpTextItemNumber;
					} else {
						tmpAddedItems.curParent = 0;
					}
					break;
				case 'objectItem':
					if (tmpImageItemNumber != -1) {
						tmpAddedItems.curParent = tmpImageItemNumber;
					} else {
						tmpAddedItems.curParent = 0;
					}
					break;
			}
			//Перевод ширины для картинки в проценты
			if (newItem.key == 'objectItem') {
				var containerWidthPx = $scope.curItem.sizeInPx('width');
				var containerHeightPx = $scope.curItem.sizeInPx('height');
				newItem.itemRef.width = parseFloat(newItem.itemRef.width) / containerWidthPx * 100 + '%';
				newItem.itemRef.height = parseFloat(newItem.itemRef.height) / containerHeightPx * 100 + '%';
			}
			console.log('newItem.itemRef', clone(newItem.itemRef))

			// $scope.curItem.addChildAtIndex(newItem, newItem.parentItem + 1);
			$scope.curItem.addChild(newItem);
			var newItemIndex = $scope.curItem.childItems.length - 1;

			if (((newItem.key == 'textItem') && tmpAddedItems.text) || ((newItem.key == 'objectItem') && tmpAddedItems.picture))
				return

			$scope.curItem.childItems[newItem.parentItem + 1].tmpPosition = 1;

			var itemsTypes = new Array();
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].key == 'objectItem') {
					itemsTypes.push($scope.curItem.childItems[k].key)
				} else if ($scope.curItem.childItems[k].key == 'textItem') {
					itemsTypes.push($scope.curItem.childItems[k].textType)
				}
			}

			var findPattern = presentationObject.findPattern($scope.curslide.slideType, itemsTypes);
			var rightPattern = findPattern.pattern;

			console.log('findPattern', findPattern)
			if (findPattern.patternIndex === false) {

				console.log('$scope.curItem - -1', clone($scope.curItem))
				resizeItemContainer($scope.curItem, true);


				//Только если идет работа просто текст к текст
				/*
				$scope.addShow.addTextText = false; //Текст к текст
				$scope.addShow.addTextPicture = false; //Текст к картинке / текст к группе
				$scope.addShow.addPictureText = false; //Картинка к текст
				$scope.addShow.addPicturePicture = false; //Картинка к картинке / картинка к группе
				*/

				var parentItem = $scope.curItem.childItems[newItem.parentItem];
				var parentHierarchy = parentItem.hierarchy.split('_');
				if ($scope.addShow.addTextText) {
					var strH = parseInt(parentHierarchy[0]) + 1;
					newItem.hierarchy = strH + '_0';
					for (var k in $scope.curItem.childItems) {
						if ($scope.curItem.childItems[k].newItem)
							continue;
						var tmpH = $scope.curItem.childItems[k].hierarchy.split('_');
						if (tmpH[0] >= strH) {
							tmpH[0] ++;
							$scope.curItem.childItems[k].hierarchy = tmpH[0] + '_' + tmpH[1];
						}
					}

					//Присвоить left от родителя
					newItem.itemRef.left = parentItem.itemRef.left;

					$scope.curItem.convertChildsSizeInPx();

					newItem.itemRef.top = parentItem.itemRef.top + parentItem.itemRef.height;
					var newItemLeft = newItem.itemRef.left;
					var newItemRight = newItem.itemRef.left + newItem.itemRef.width;
					var newItemTop = newItem.itemRef.top;
					var newItemHeight = newItem.itemRef.height;

					for (var k in $scope.curItem.childItems) {
						if (k == newItemIndex)
							continue;
						var curChild = $scope.curItem.childItems[k];
						var curTop = curChild.itemRef.top;
						var curRight = curChild.itemRef.left + curChild.itemRef.width;
						var curLeft = curChild.itemRef.left;
						if ((curTop.toFixed(2) > newItemTop.toFixed(2)) && (curRight.toFixed(2) >= newItemLeft.toFixed(2)) && (curLeft.toFixed(2) <= newItemRight.toFixed(2))) {
							curChild.itemRef.top = curTop + newItemHeight;
						}

					}
					var containerHeight = $scope.curItem.sizeInPx('height') + newItemHeight;
					var containerWidth = $scope.curItem.sizeInPx('width');
					$scope.curItem.itemRef.height = containerHeight / presentationObject.curHeight * 100 + '%';

					if (parentItem.type == 'textItem' && newItem.type == textItem) {
						if (newItem.itemRef.width < parentItem.itemRef.width)
							newItem.itemRef.width = parentItem.itemRef.width;
					}

					$scope.curItem.convertChildsSizeInPercent();

				}



				if (newItem.key == "objectItem") {
					newItem.tmpPosition = undefined;

					if ($scope.addShow.addPictureText) {
						$scope.changeImagePosition(1);
					}
				}
			} else {
				console.log('rightPattern', rightPattern)
				$scope.curItem.childItems = changeContainerToPattern($scope.curItem.childItems, rightPattern);
				$scope.curItem.convertChildsSizeInPercent();
				console.log('after pattern $scope.curItem.childItems', clone($scope.curItem.childItems));
				newItem.fromPatternPosition = newItem.tmpPosition;
			}


			resizeItemContainer($scope.curItem, true);
			console.log('$scope.curItem', clone($scope.curItem))

			$scope.showTextFormatPopup = false;
			console.log('newItem.itemRef2', newItem.itemRef)
		}

		$scope.changeAddedItemPosition = function(positionType) {
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					switch ($scope.curItem.childItems[k].key) {
						case 'textItem':
							if ($scope.addShow.addTextText)
								if ($scope.curItem.childItems[k].parentItem != 'group') {
									$scope.changeTextToTextPosition(positionType);
								}
							break;
						case 'objectItem':
							if ($scope.addShow.addPictureText)
								if ($scope.curItem.childItems[k].parentItem != 'group') {
									$scope.changeImagePosition(positionType);
								}
							break;
					}
					break;
				}
			}
		}

		$scope.changeImagePosition = function(positionType) {
			var addedItemId, tmpNewItem;

			var lastItemId = $scope.curItem.childItems.length;
			//Размер и позиция текущего текста (так как данная функция только для одного текста)
			var contentLeft = contentTop = contentWidth = contentHeight = 0;
			var contentBottom = $scope.curItem.itemRef.height;
			var contentRight = $scope.curItem.itemRef.width;

			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
					addedItemId = k;
					tmpNewItem = $scope.curItem.childItems[k];
					if (tmpNewItem.tmpPosition == positionType)
						return;
					//break;
					continue;
				}
				var itemRef = $scope.curItem.childItems[k].itemRef;
				var curTop = parseFloat(itemRef.top);
				var curLeft = parseFloat(itemRef.left);
				var curRight = parseFloat(itemRef.width) + parseFloat(itemRef.left);
				var curBottom = parseFloat(itemRef.height) + parseFloat(itemRef.top);

				if (curTop < contentTop)
					contentTop = curTop;
				if (curLeft < contentLeft)
					contentLeft = curLeft;
				if (curRight > contentRight)
					contentRight = curRight;
				if (curBottom > contentBottom)
					contentBottom = curBottom;
			}

			//Позиционируем картинку (ставим значения top,left)
			var containerWidthPx = $scope.curItem.sizeInPx('width');
			var containerHeightPx = $scope.curItem.sizeInPx('height');

			var newImageWidthPx = parseFloat(tmpNewItem.itemRef.width) * containerWidthPx / 100;
			var newImageHeightPx = parseFloat(tmpNewItem.itemRef.height) * containerHeightPx / 100;

			var parentItem = $scope.curItem.childItems[tmpNewItem.parentItem];
			var parentHierarchy = parentItem.hierarchy.split('_');
			var newItemHierarchy = tmpNewItem.hierarchy.split('_');

			switch (positionType) {
				case 1:

					if (tmpNewItem.tmpPosition != 4) {
						tmpNewItem.hierarchy = parentItem.hierarchy;
						parentHierarchy[1] ++;
						parentItem.hierarchy = parentHierarchy[0] + '_' + parentHierarchy[1];
						for (var k in $scope.curItem.childItems) {
							console.log('$scope.curItem.childItems[k]', $scope.curItem.childItems[k])
							if ($scope.curItem.childItems[k].newItem) {
								continue;
							}

							var tmpH = $scope.curItem.childItems[k].hierarchy.split('_');
							console.log('tmpH newItemHierarchy', tmpH, newItemHierarchy)
							if ((tmpH[0] == newItemHierarchy[0]) && (tmpH[1] > parentHierarchy[1])) {
								tmpH[1] ++;
								console.log('newItemHierarchy', newItemHierarchy)
								$scope.curItem.childItems[k].hierarchy = tmpH[0] + '_' + tmpH[1];
							}


							var newItemLeftPx = parseFloat($scope.curItem.childItems[k].itemRef.left) * containerWidthPx / 100 + newImageWidthPx + baseLineSize;
							$scope.curItem.childItems[k].itemRef.left = newItemLeftPx / containerWidthPx * 100 + '%';
							console.log('$scope.curItem.childItems[k].itemRef.left', $scope.curItem.childItems[k].itemRef.left)
						}
					} else {
						var tmpHierarch = tmpNewItem.hierarchy;
						tmpNewItem.hierarchy = tmpNewItem.hierarchy;
						parentItem.hierarchy = tmpHierarch;
						tmpNewItem.itemRef.left = parentItem.itemRef.left;
						parentItem.itemRef.left = parseFloat(tmpNewItem.itemRef.left) + parseFloat(tmpNewItem.itemRef.width) + '%';
					}
					parentItem.itemRef.top = tmpNewItem.itemRef.top;

					//РЕСАЙЗ ВСЕХ ОТНОСИТЕЛЬНО НОВОГО РАЗМЕРА КОНТЕЙНЕРА
					break;

				case 2:
					console.log('$scope.curItem-0', clone($scope.curItem))
					var newItemPrevHierarche = tmpNewItem.hierarchy.split('_');
					var newItemHierarchyStr = parentHierarchy[0];
					var newItemHierarchyColumn = parentHierarchy[1];
					tmpNewItem.hierarchy = newItemHierarchyStr + '_' + newItemHierarchyColumn;
					$scope.curItem.convertContainerSizeInPx();
					convertContainerSizesPercentToPx($scope.curItem, false);
					console.log('$scope.curItem-1', clone($scope.curItem.childItems))

					var newImageWidthPx = tmpNewItem.itemRef.width;
					var newImageHeightPx = tmpNewItem.itemRef.height;

					var oneItemInColumn = true;

					for (var k in $scope.curItem.childItems) {
						if (k == addedItemId)
							continue;
						var tmpHierarchy = $scope.curItem.childItems[k].hierarchy.split('_');
						if (tmpHierarchy[1] == newItemPrevHierarche[1]) {
							oneItemInColumn = false;
						}
						if ((tmpHierarchy[1] == newItemHierarchyColumn) && (tmpHierarchy[0] >= newItemHierarchyStr)) {
							tmpHierarchy[0] ++;
							$scope.curItem.childItems[k].hierarchy = tmpHierarchy[0] + '_' + tmpHierarchy[1];
							$scope.curItem.childItems[k].itemRef.top += newImageHeightPx;
						}
					}

					//Унать, был ли текущий элемент единственным в столбце. 
					//Сдвинуть все элементы правее контейнера налево (так как новый элемент встал в новый столбец)
					console.log('oneItemInColumn', oneItemInColumn, baseLineSize)
					if (oneItemInColumn) {
						for (var k in $scope.curItem.childItems) {
							if (k == addedItemId)
								continue;
							var tmpHierarchy = $scope.curItem.childItems[k].hierarchy.split('_');
							if (tmpHierarchy[1] > newItemPrevHierarche[1]) {
								console.log('$scope.curItem.childItems[k].itemRef.left - 1', $scope.curItem.childItems[k].itemRef.left, newImageWidthPx)
								$scope.curItem.childItems[k].itemRef.left -= (newImageWidthPx + baseLineSize);
								console.log('$scope.curItem.childItems[k].itemRef.left - 2', $scope.curItem.childItems[k].itemRef.left)
							}
						}
					}

					$scope.curItem.itemRef.height += newImageHeightPx;

					// $scope.curItem.convertContainerSizeInPercent();

					convertContainerSizesPxToPercent($scope.curItem, false);
					parentItem.itemRef.left = tmpNewItem.itemRef.left;
					//Увеличиваем высоту контейнера
					console.log('$scope.curItem-2', clone($scope.curItem.childItems))
					break;

				case 3:
					var newItemPrevHierarche = tmpNewItem.hierarchy.split('_');
					$scope.curItem.convertContainerSizeInPx();
					convertContainerSizesPercentToPx($scope.curItem, false);
					console.log('$scope.curItem-1', clone($scope.curItem))

					var newImageWidthPx = tmpNewItem.itemRef.width;
					var newImageHeightPx = tmpNewItem.itemRef.height;

					var oneItemInColumn = true;

					if (tmpNewItem.tmpPosition != 2) {
						tmpNewItem.itemRef.left = parentItem.itemRef.left;
						var parentBottom = parentItem.itemRef.top + parentItem.itemRef.height;
						tmpNewItem.itemRef.top = parentBottom;

						for (var k in $scope.curItem.childItems) {
							if (k == addedItemId)
								continue;
							var tmpHierarchy = $scope.curItem.childItems[k].hierarchy.split('_');
							if (tmpHierarchy[1] == newItemPrevHierarche[1]) {
								oneItemInColumn = false;
							}
							if ((tmpHierarchy[1] == newItemHierarchyColumn) && (tmpHierarchy[0] > parentHierarchy[0])) {
								tmpHierarchy[0] ++;
								$scope.curItem.childItems[k].hierarchy = tmpHierarchy[0] + '_' + tmpHierarchy[1];
								$scope.curItem.childItems[k].itemRef.top += newImageHeightPx;


							}
						}

					} else {
						parentHierarchy[0] = parseInt(parentHierarchy[0]) - 1;
						parentItem.hierarchy = parentHierarchy[0] + '_' + parentHierarchy[1];
						parentItem.itemRef.top = tmpNewItem.itemRef.top;
						tmpNewItem.itemRef.top = parentItem.itemRef.top + parentItem.itemRef.height;
					}

					var newItemHierarchyStr = parseInt(parentHierarchy[0]) + 1;
					var newItemHierarchyColumn = parentHierarchy[1];
					tmpNewItem.hierarchy = newItemHierarchyStr + '_' + newItemHierarchyColumn;

					
					convertContainerSizesPxToPercent($scope.curItem, false);

					break;
				case 4:
					console.log('tmpNewItem.tmpPosition', tmpNewItem.tmpPosition)
					if (tmpNewItem.tmpPosition != 1) {
						var newItemHierarchyColumn = parseInt(parentHierarchy[1]) + 1;
						var newItemHierarchyStr = parentHierarchy[0];
						tmpNewItem.hierarchy = parentHierarchy[0] + '_' + newItemHierarchyColumn;
						
						for (var k in $scope.curItem.childItems) {
							console.log('$scope.curItem.childItems[k]', $scope.curItem.childItems[k])
							if ($scope.curItem.childItems[k].newItem) {
								continue;
							}

							var tmpH = $scope.curItem.childItems[k].hierarchy.split('_');
							console.log('tmpH newItemHierarchy', tmpH, newItemHierarchy)
							if ((tmpH[0] == newItemHierarchyStr) && (tmpH[1] > parentHierarchy[1])) {
								tmpH[1] ++;
								console.log('newItemHierarchy', newItemHierarchy)
								$scope.curItem.childItems[k].hierarchy = tmpH[0] + '_' + tmpH[1];

								var newItemLeftPx = parseFloat($scope.curItem.childItems[k].itemRef.left) * containerWidthPx / 100 + newImageWidthPx + baseLineSize;
								$scope.curItem.childItems[k].itemRef.left = newItemLeftPx / containerWidthPx * 100 + '%';
								console.log('$scope.curItem.childItems[k].itemRef.left', $scope.curItem.childItems[k].itemRef.left)
							}
						}
						parentItem.itemRef.top = tmpNewItem.itemRef.top;

					} else {
						var tmpHierarch = parentItem.hierarchy;
						parentItem.hierarchy = tmpNewItem.hierarchy;
						tmpNewItem.hierarchy = tmpHierarch;
						parentItem.itemRef.left = tmpNewItem.itemRef.left;
					}
					tmpNewItem.itemRef.left = parseFloat(parentItem.itemRef.left) + parseFloat(parentItem.itemRef.width) + '%';

					break;

			}

			tmpNewItem.tmpPosition = positionType;
			console.log('$scope.curItem-1163', clone($scope.curItem))
			resizeItemContainer($scope.curItem, true);

		}

	}


	return stickingElementsService;

}); 