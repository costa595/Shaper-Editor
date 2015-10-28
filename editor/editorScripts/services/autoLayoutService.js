/******************************************************************************************************/
/******************************************************************************************************/
/************************************************АВТОВЕРСТКA*******************************************/
/******************************************************************************************************/
/******************************************************************************************************/

angular.module('presEditor').factory("autoLayoutService", function() {

	var autoLayoutService = function($scope, aligmentCalledFromFunctionAddNewItem, closeItem, curActiveItem, textWasChanged, moveTextEtitPopup, itemClick) { 

		var myAutoLayout = this;

		//-------главный объект поиска! ПАХАН ОБЪЕКТОВ АВТОВЕРСТКИ!

		var activeBlock = 0;

		topsOfObjects = {
			gTopText: 0,
			gTopImage: 0,
			minimumTopTextWasFound: false,
			minimumTopImageWasFound: false
		}

		var addedElement = '';
		var secondCallOfAlignInit = false; //----избежание повторного вызова myAutoLayout.alignInitialization

		var arrayOfSlidesOfToppedElements = new Array(); //---запоминаем на каком слайде второй элемент ушел от первого на 2.7%
		var checkedBlocks = new Array(); //-----запоминаем какой блок был проверен на совмещение с другими

		var topForUsual = 0;
		var topForNextElement = 0;

		//*************** ПЕРЕНОС ЭЛЕМЕНТА НА ДРУГОЙ СЛАЙД, ЕСЛИ ОН НЕ ПОМЕЩАЕТСЯ ***************

		//-------размещение элемента на другом слайде
		myAutoLayout.putAddedElementToNextSlide = function() {
			var itemToRemove = clone($scope.curItem);
			deleteItem();
			createNewSlide($scope.curActiveSlide);
			$scope.initSlide("middle");
			$scope.openSlide($scope.curActiveSlide);
			itemToRemove.preventDrag = false;
			resizeItemContainer(itemToRemove, true);
			presentationObject.slides[$scope.curActiveSlide].items.push(itemToRemove);
			closeItem();
			itemClick($scope.curslide.items.length - 1);
		}

		//------проверяет возможность разместить элемент на слайде
		myAutoLayout.checkForAccommodating = function() {
			if ($scope.objectsAlignment == "inHeight") {
				//------условие переноса
				// var checkedSum = searchObject[$scope.curActiveSlide].checkedSum + parseFloat($scope.curslide.items[$scope.curslide.items.length - 1].itemRef.width);
				if (searchObject[$scope.curActiveSlide].checkedSum > 100) {
					myAutoLayout.putAddedElementToNextSlide();
				}
			}
		}

		//****************************************************************************************
		//****************************************************************************************

		//********************************************************** РАСПРЕДЕЛЕНИЕ *******************************************************************

		//----распределение по вертикали
		myAutoLayout.alignByVertical = function() {

			switch ($scope.objectsVerticalAlignment) {
				case "top":
					for (var indexElement in $scope.curslide.items) {
						if (indexElement != searchObject[$scope.curActiveSlide].minTopIndex) {
							var diff = parseFloat($scope.curslide.items[indexElement].itemRef.top) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top);
							if ($scope.turnOnTop) {
								$scope.curslide.items[indexElement].itemRef.top = (searchObject[$scope.curActiveSlide].baseLineSizeInPercent + diff) + '%';
							}
							searchObject[$scope.curActiveSlide].topObject.element[indexElement] = $scope.curslide.items[indexElement].itemRef.top;
						}
					}
					$scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top = searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';
					$scope.turnOnTop = false;
					break;

				case "middle":
					var minTop = (100 - searchObject[$scope.curActiveSlide].wholeHeight) / 2;
					if (minTop + searchObject[$scope.curActiveSlide].wholeHeight > 100) {
						minTop -= minTop + searchObject[$scope.curActiveSlide].wholeHeight - 100 - baseLineSize * 100 / presentationObject.curHeight;
					}
					for (var indexElement in $scope.curslide.items) {
						if (indexElement != searchObject[$scope.curActiveSlide].minTopIndex) {
							var diff = parseFloat($scope.curslide.items[indexElement].itemRef.top) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top);
							$scope.curslide.items[indexElement].itemRef.top = (minTop + diff) + '%';
							searchObject[$scope.curActiveSlide].topObject.element[indexElement] = $scope.curslide.items[indexElement].itemRef.top;
						}
					}
					$scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top = Math.abs(minTop) + '%';


					break;

				case "bottom":
					var maxTop = parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.top);
					$scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.top = 100 - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.height) - searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';
					for (var indexElement in $scope.curslide.items) {
						if (indexElement != searchObject[$scope.curActiveSlide].maxTopIndex) {
							var diff = maxTop - parseFloat($scope.curslide.items[indexElement].itemRef.top);
							$scope.curslide.items[indexElement].itemRef.top = (parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.top) - diff) + '%';
							searchObject[$scope.curActiveSlide].topObject.element[indexElement] = $scope.curslide.items[indexElement].itemRef.top;
						}
					}
					break;
			}
			searchObject[$scope.curActiveSlide].topObject.element[searchObject[$scope.curActiveSlide].minTopIndex] = $scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top;
		}

		//----распределение по горизонтали
		myAutoLayout.alignByHorizontal = function() {

			switch ($scope.objectsHorizontalAlignment) {
				case "left":

					$scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left = searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';

					for (var indexElement in $scope.curslide.items) {
						if (indexElement != searchObject[$scope.curActiveSlide].minLeftIndex) {
							var diff = parseFloat($scope.curslide.items[indexElement].itemRef.left) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left);
							//-----------первая проверка для исключения сдвига при добавлении элемента. Вторая для правильного float`a, иначе бы первый элемент всегда бы становился к левому краю, а другие оставались на месте при нажатии на кнопку.
							diff = (diff == searchObject[$scope.curActiveSlide].baseLineSizeInPercent || aligmentCalledFromFunctionAddNewItem == false) ? 0 : diff;
							$scope.curslide.items[indexElement].itemRef.left = (searchObject[$scope.curActiveSlide].baseLineSizeInPercent + diff) + '%';
							searchObject[$scope.curActiveSlide].leftObject.element[indexElement] = $scope.curslide.items[indexElement].itemRef.left;
						}
					}
					// $scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left = searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';

					break;

				case "middle":

					var minLeft = (100 - searchObject[$scope.curActiveSlide].wholeWidth) / 2;
					// if(minLeft + searchObject[$scope.curActiveSlide].wholeWidth > 100) {
					// 	minLeft -= minLeft + searchObject[$scope.curActiveSlide].wholeWidth - 100 - searchObject[$scope.curActiveSlide].baseLineSizeInPercent;
					// }
					for (var indexElement in $scope.curslide.items) {
						if (indexElement != searchObject[$scope.curActiveSlide].minLeftIndex) {
							var diff = parseFloat($scope.curslide.items[indexElement].itemRef.left) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left);
							//------------для правильного float`a, иначе бы первый элемент всегда бы становился к левому краю, а другие оставались на месте при нажатии на кнопку.
							// diff = (aligmentCalledFromFunctionAddNewItem == false) ? 0 : diff;
							$scope.curslide.items[indexElement].itemRef.left = (minLeft + diff) + '%';
							searchObject[$scope.curActiveSlide].leftObject.element[indexElement] = $scope.curslide.items[indexElement].itemRef.left;
						}
					}
					$scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left = Math.abs(minLeft) + '%';
					break;

				case "right":
					var maxLeft = parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.left);
					$scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.left = 100 - searchObject[$scope.curActiveSlide].wholeWidth - searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';
					for (var indexElement in $scope.curslide.items) {
						if (indexElement != searchObject[$scope.curActiveSlide].maxLeftIndex) {
							var diff = maxLeft - parseFloat($scope.curslide.items[indexElement].itemRef.left);
							diff = (diff == searchObject[$scope.curActiveSlide].baseLineSizeInPercent || aligmentCalledFromFunctionAddNewItem == false) ? 0 : diff;
							$scope.curslide.items[indexElement].itemRef.left = (parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.left) - diff) + '%';
							searchObject[$scope.curActiveSlide].leftObject.element[indexElement] = $scope.curslide.items[indexElement].itemRef.left;
						}
					}
					break;
			}

			searchObject[$scope.curActiveSlide].leftObject.element[searchObject[$scope.curActiveSlide].minLeftIndex] = $scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left;
		}

		//****************************************************************************************************************************

		//******************************************************************** РАБОТА С БЛОКАМИ *********************************************************************

		//--------проверка на наличие других блоков поверх добавленного
		myAutoLayout.checkOtherBlocksInLeftZone = function() {
			if (!(activeBlock in checkedBlocks)) {
				var activeBlockLeft = (parseFloat(Blocks[$scope.curActiveSlide][activeBlock].leftOfBlock) == 0) ? parseFloat(searchObject[$scope.curActiveSlide].baseLineSizeInPercent) : parseFloat(Blocks[$scope.curActiveSlide][activeBlock].leftOfBlock);
				for (var indexBlock in Blocks[$scope.curActiveSlide]) {
					if (activeBlock != indexBlock && activeBlockLeft == parseFloat(Blocks[$scope.curActiveSlide][indexBlock].leftOfBlock)) {
						Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][indexBlock].height - parseFloat(searchObject[$scope.curActiveSlide].baseLineSizeInPercent) - parseFloat($scope.curslide.items[curActiveItem].itemRef.height);
					}
				}
				checkedBlocks.push(activeBlock);
			}
		}

		//-----создание нового блока
		myAutoLayout.createNewBlock = function(indexElement) {
			Blocks[$scope.curActiveSlide][indexElement] = new BlocksInit();
			Blocks[$scope.curActiveSlide][indexElement].elements.push(indexElement);
			Blocks[$scope.curActiveSlide][indexElement].width = $scope.curslide.items[indexElement].itemRef.width;
			if ($scope.curItem.childItems[0].textType == 'usual' || $scope.curItem.childItems[0].key == 'objectItem') {

				searchObject[$scope.curActiveSlide].sumOfColumnsWidth += (indexElement == 0 || indexElement == 2) ? 0 : parseFloat(searchObject[$scope.curActiveSlide].baseLineSizeInPercent); // для первого столбца ширина колонок - 0
				if (!textWasChanged) {
					searchObject[$scope.curActiveSlide].sumOfColumnsWidth += (indexElement == 0 || indexElement == 2) ? 0 : parseFloat(Blocks[$scope.curActiveSlide][indexElement].width);
				}
				// searchObject[$scope.curActiveSlide].checkedSum += (indexElement == 0) ? searchObject[$scope.curActiveSlide].baseLineSizeInPercent : parseFloat(Blocks[$scope.curActiveSlide][indexElement].width);
			}

			Blocks[$scope.curActiveSlide][indexElement].height = 100 - parseFloat($scope.curslide.items[indexElement].itemRef.top) - parseFloat($scope.curslide.items[indexElement].itemRef.height);


			if (topsOfObjects.minimumTopTextWasFound && searchObject[$scope.curActiveSlide].topForNextText == null) {
				searchObject[$scope.curActiveSlide].topForNextText = topsOfObjects.gTopText;
			} else if (topsOfObjects.minimumTopImageWasFound && searchObject[$scope.curActiveSlide].topForNextImage == null) {
				searchObject[$scope.curActiveSlide].topForNextImage = topsOfObjects.gTopImage;
			}

			activeBlock = indexElement;
			textWasChanged = false;
		}

		//---------проверка элемента на добавление в текущий блок или создание нового, если это другой тип
		myAutoLayout.checkElementForBlockTypeAndKey = function() {
			var savedHeight = Blocks[$scope.curActiveSlide][activeBlock].height;
			Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][activeBlock].height - searchObject[$scope.curActiveSlide].baseLineSizeInPercent - parseFloat($scope.curItem.itemRef.height);
			if (Blocks[$scope.curActiveSlide][activeBlock].height < parseFloat($scope.curItem.itemRef.height)) {
				//-----не помещается	
				Blocks[$scope.curActiveSlide][activeBlock].free = false;
				Blocks[$scope.curActiveSlide][activeBlock].height = savedHeight;
				myAutoLayout.createNewBlock(curActiveItem);
			} else {
				//----помещается
				Blocks[$scope.curActiveSlide][activeBlock].elements.push(curActiveItem);
			}
		}

		//-----------функция строит блоки из элементов
		myAutoLayout.createTheWallFromBlocks = function(indexElement) {
			if (!secondCallOfAlignInit) {
				if ($scope.curItem.childItems[0].textType == 'usual') {
					addedElement = 'usual';
				} else if ($scope.curItem.childItems[0].key == 'objectItem') {
					addedElement = 'objectItem';
				}

				var indexMainItemTypeOfActiveBlock = (Blocks[$scope.curActiveSlide][activeBlock] == null) ? curActiveItem : Blocks[$scope.curActiveSlide][activeBlock].elements[0];
				//-----------находим правильный top для элемента следующей колонки
				if (addedElement == 'usual' && addedElement == $scope.curslide.items[indexMainItemTypeOfActiveBlock].childItems[0].textType && Blocks[$scope.curActiveSlide][activeBlock] != null) {

					myAutoLayout.checkElementForBlockTypeAndKey();

				} else if (addedElement == 'objectItem' && addedElement == $scope.curslide.items[indexMainItemTypeOfActiveBlock].childItems[0].key && Blocks[$scope.curActiveSlide][activeBlock] != null) {

					myAutoLayout.checkElementForBlockTypeAndKey();

				} else {
					myAutoLayout.createNewBlock(indexElement);
				}
			}
		}

		//********************************************************************************************************************************

		//********************************************************* СТАНДАРТИЗАЦИЯ ******************************************************************

		//------установка заголовка наверх слайда-----
		myAutoLayout.setHeaderToTop = function() {
			if ($scope.curItem.childItems[0].textType == 'header' && $scope.curslide.items.length > 1) {
				closeItem();
				var last = $scope.curslide.items.length - 1;
				var savedFirstObject = clone($scope.curslide.items[0]);
				var savedLastObject = clone($scope.curslide.items[last]);
				var usualTextIndex = 0;

				var savedTop = savedLastObject.itemRef.top;

				$scope.curslide.items[usualTextIndex] = savedLastObject;
				$scope.curslide.items[last] = savedFirstObject;

				$scope.curslide.items[usualTextIndex].itemRef.left = savedFirstObject.itemRef.left;
				$scope.curslide.items[usualTextIndex].itemRef.top = savedFirstObject.itemRef.top;
				$scope.curslide.items[last].itemRef.top = savedTop;
				$scope.curslide.items[last].itemRef.left = savedLastObject.itemRef.left;

				if (!($scope.curActiveSlide in arrayOfSlidesOfToppedElements)) {
					$scope.curslide.items[1].itemRef.top = parseFloat($scope.curslide.items[1].itemRef.top) + searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';
					arrayOfSlidesOfToppedElements.push($scope.curActiveSlide);
				}

				itemClick(usualTextIndex);
				topsOfObjects.gTopText = parseFloat(savedTop) + parseFloat(searchObject[$scope.curActiveSlide].baseLineSizeInPercent);
			}
		}

		//--------устанавливаем заголовок наверх при наличии картинки/картинок
		myAutoLayout.setHeaderToTopEvenHavingImage = function() {
			$scope.curItem.itemRef.top = searchObject[$scope.curActiveSlide].baseLineSizeInPercent;
			$scope.curItem.itemRef.left = searchObject[$scope.curActiveSlide].baseLineSizeInPercent;
		}

		//--------устанавливаем картинки по центру при наличии заголовка
		myAutoLayout.setImageOnMiddleEvenHavingHeader = function() {
			var elementsCount = 0,
				imageIndex = 0;
			for (var element in $scope.curslide.items) {
				if ($scope.curslide.items[element].childItems[0].key == 'objectItem') {
					elementsCount++;
					imageIndex = element;
				}
			}
			if (elementsCount == 1 && $scope.curslide.items[imageIndex].childItems[0].key == 'objectItem') {
				$scope.curslide.items[imageIndex].itemRef.width = 20 + '%';
				$scope.curslide.items[imageIndex].itemRef.height = 33.3 + '%';
				var containerWidth = presentationObject.curWidth / 10;
				myAutoLayout.setInline($scope.curslide.items[imageIndex].childItems[0].key, imageIndex, presentationObject.curHeight / 3, containerWidth, 0, containerWidth, 0, 0, 0);
			}
		}

		//--------установка изображений посередине
		myAutoLayout.setImagesToTheMiddle = function() {
			//*********** В ВЫСОТУ *********** НЕ ТРОГАТЬ **********************
			// if($scope.objectsAlignment == "inHeight") {
			// 	myAutoLayout.setInheight($scope.curslide.items[0].childItems[0].key, 0, presentationObject.curHeight / 3, containerWidth, 0, presentationObject.curHeight / 3);
			// } else {
			// 	myAutoLayout.setInline($scope.curslide.items[0].childItems[0].key, 0, presentationObject.curHeight / 3, containerWidth, 0, containerWidth, 0, 0, 0);
			// }
			//*********************************************
			var elementsCount = 0;
			for (var element in $scope.curslide.items) {
				if ($scope.curslide.items[element].childItems[0].key == 'objectItem') {
					elementsCount++;
				}
			}

			if (elementsCount > 1) {
				var rowCount = 0,
					distance, wholeWidth, wholeHeight;
				//-----------установка дистанции, ширины, высоты каждой картинки
				switch (elementsCount) {
					case 2:
						distance = presentationObject.curWidth / 5;
						wholeWidth = distance;
						wholeHeight = presentationObject.curHeight / 3;
						break;
					case 3:
						distance = presentationObject.curWidth / 10;
						wholeWidth = distance;
						wholeHeight = presentationObject.curHeight / 6;
						break;
					case 4:
						distance = presentationObject.curWidth / 20;
						wholeWidth = presentationObject.curWidth / 10;
						wholeHeight = presentationObject.curHeight / 6;
						break;
					default:
						distance = baseLineSize;
						wholeWidth = presentationObject.curWidth / 10;
						wholeHeight = presentationObject.curHeight / 6;
						break;
				}
				var compositions = new Array();
				compositions[rowCount] = new Composition();

				for (var indexElement in $scope.curslide.items) {
					if ($scope.curslide.items[indexElement].childItems[0].key == "objectItem") {

						if (compositions[rowCount].elementsInRow == 4) {
							rowCount++;
							compositions[rowCount] = new Composition();
							compositions[rowCount].rowNumber = rowCount;
						}
						if (compositions[rowCount].elementsInRow == 0) {
							compositions[rowCount].allWidth = 0;
						}
						var tmpHeight = wholeHeight;
						compositions[rowCount].allWidth += parseFloat(wholeWidth) / 2 + distance / 2; // делим на 2 для выстраивания по середине (исп дальше в фун-ции)
						$scope.curslide.items[indexElement].itemRef.height = wholeHeight * 100 / presentationObject.curHeight + '%';
						$scope.curslide.items[indexElement].itemRef.width = wholeWidth * 100 / presentationObject.curWidth + '%';
						compositions[rowCount].allHeight += tmpHeight;
						var tmpObj = new Object();
						tmpObj.width = parseFloat(wholeWidth);
						tmpObj.height = tmpHeight;
						tmpObj.indexElement = indexElement;
						compositions[rowCount].widthHeightObj.push(tmpObj);
						compositions[rowCount].elementsInRow++;
					}
				}
				compositions[rowCount].allWidth -= distance / 2;
				var tmpHeight = 0,
					childPos = 0,
					search = '';
				var tmpRowCount = (compositions[rowCount].allWidth != 0) ? rowCount + 1 : rowCount;

				for (row = 0; row < tmpRowCount; row++) {

					var tmpWidth = 0,
						nextHeight = 0,
						nextWidth = 0,
						t = 0;

					for (var i in $scope.curslide.items) {
						if ($scope.curslide.items[i].childItems[0].key == 'objectItem') {
							if (rowCount > 0 && compositions[row + 1] != null) {

								nextHeight = (compositions[row + 1].widthHeightObj[t] != null) ? compositions[row + 1].widthHeightObj[t].height : nextHeight;
								nextWidth = (compositions[row + 1].widthHeightObj[t] != null) ? compositions[row + 1].widthHeightObj[t].width : nextWidth;

							} else if (rowCount > 0 && compositions[row + 1] == null) {

								nextHeight = (compositions[row - 1].widthHeightObj[t] != null) ? -compositions[row - 1].widthHeightObj[t].height : nextHeight;
								nextWidth = (compositions[row - 1].widthHeightObj[t] != null) ? -compositions[row - 1].widthHeightObj[t].width : nextWidth;
							}

							var parentTop = myAutoLayout.setInline($scope.curslide.items[i].childItems[0].key, compositions[row].widthHeightObj[t].indexElement, compositions[row].widthHeightObj[t].height, compositions[row].widthHeightObj[t].width, tmpWidth, compositions[row].allWidth, childPos, nextHeight, nextWidth);

							tmpWidth += compositions[row].widthHeightObj[t].width + distance;
							t++;
							//****************НУЖНО**********************
							// if(compositions[row].widthHeightObj[i].height / 2 > compositions[row].widthHeightObj[i+1].height) {
							// 	// childPos = parentTop; //----кверху
							// 	// childPos = parentTop + widthHeightObj[row][i].height - widthHeightObj[row][i+1].height; //---книзу
							// } else {
							// 	childPos = 0;
							// }
							//*******************************************
						}
					}
					//------расположение по вертикали
					// for(i = 0; i < elementsCount; i++) {
					// 	myAutoLayout.setInheight(i, widthHeightObj[row][i].height, widthHeightObj[row][i].width, tmpHeight, allHeight);
					// 	tmpHeight += widthHeightObj[row][i].height + baseLineSize;
					// }
				}
			}
		}

		//------проверка на использование функции setMiddleImages
		myAutoLayout.checkForUsualTextForImages = function() {
			var usualCount = 0;
			for (var indexElement in $scope.curslide.items) {
				if ($scope.curslide.items[indexElement].childItems[0].textType == "usual") {
					usualCount++;
				}
			}
			if (usualCount == 0) {
				myAutoLayout.setImagesToTheMiddle(); //проверка и установка для изображений > 1
				myAutoLayout.setImageOnMiddleEvenHavingHeader(); //проверка и установка для изображений = 1
			}
			return usualCount;
		}

		//-------функция стандартизации
		myAutoLayout.standartization = function() {
			if ($scope.curslide.items.length > 1 && $scope.curslide.items[0].childItems[0].key == 'objectItem' && $scope.curItem.childItems[0].textType == 'header') {
				myAutoLayout.setHeaderToTopEvenHavingImage();
			} else {
				myAutoLayout.setHeaderToTop();
			}
			myAutoLayout.checkForUsualTextForImages();
		}

		//***************************************************************************************************
		//****************************************************************************************************************************

		//---------инициализация необходимых начальных условий для расположения
		//--------пересчитывание общих высот и ширин, нахождение элементов мин и мах расположений по горизонтали и вертикали
		myAutoLayout.alignInitialization = function() {

			if (!secondCallOfAlignInit) {
				myAutoLayout.checkForAccommodating();
			}

			//------для переноса в следующую колонку
			for (var indexElement in $scope.curslide.items) {

				if (parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.left) < parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
					searchObject[$scope.curActiveSlide].maxLeftIndex = parseFloat(indexElement);
				} else if (parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left) > parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
					searchObject[$scope.curActiveSlide].minLeftIndex = parseFloat(indexElement);
				}

				if (parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.top) < parseFloat($scope.curslide.items[indexElement].itemRef.top)) {
					searchObject[$scope.curActiveSlide].maxTopIndex = parseFloat(indexElement);
				} else if (parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top) > parseFloat($scope.curslide.items[indexElement].itemRef.top)) {
					searchObject[$scope.curActiveSlide].minTopIndex = parseFloat(indexElement);
				}

			}

			myAutoLayout.createTheWallFromBlocks(indexElement);

			var wholeWidth = ($scope.curslide.items.length > 1) ? parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.left) + parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.width) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left) : parseFloat($scope.curslide.items[0].itemRef.width);
			var wholeHeight = ($scope.curslide.items.length > 1) ? parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.top) + parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.height) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top) : parseFloat($scope.curslide.items[0].itemRef.height);

			searchObject[$scope.curActiveSlide].wholeWidth = wholeWidth;
			searchObject[$scope.curActiveSlide].wholeHeight = wholeHeight;
			searchObject[$scope.curActiveSlide].topObject.element = new Array();
			searchObject[$scope.curActiveSlide].leftObject.element = new Array();
		}

		//---------устанавливает координаты для добавленного элемента в зависимости от расположенного контента
		myAutoLayout.setNewCoords = function() {

			if (searchObject[$scope.curActiveSlide].wholeHeight + parseFloat($scope.curItem.itemRef.height) <= 100 - searchObject[$scope.curActiveSlide].baseLineSizeInPercent) {
				//--помещается по высоте
				$scope.curItem.itemRef.top = parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top) + searchObject[$scope.curActiveSlide].wholeHeight + searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';
			} else {

				// $scope.curItem.itemRef.top = (searchObject[$scope.curActiveSlide].topForNextElement != null) ? searchObject[$scope.curActiveSlide].topForNextElement : Blocks[$scope.curActiveSlide][activeBlock].topCurrent + searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';
				if ($scope.curItem.childItems[0].textType == 'usual') {
					$scope.curItem.itemRef.top = (searchObject[$scope.curActiveSlide].topForNextText != null) ? searchObject[$scope.curActiveSlide].topForNextText : Blocks[$scope.curActiveSlide][activeBlock].topCurrent + searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';

					//---опускаем в объекте на установленный топ
					if (searchObject[$scope.curActiveSlide].topForNextText != null) {
						Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][activeBlock].height - parseFloat(topsOfObjects.gTopText);
						// Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][activeBlock].height;
					}
				} else if ($scope.curItem.childItems[0].key == 'objectItem') {
					$scope.curItem.itemRef.top = (searchObject[$scope.curActiveSlide].topForNextImage != null) ? searchObject[$scope.curActiveSlide].topForNextImage : Blocks[$scope.curActiveSlide][activeBlock].topCurrent + searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';

					//---опускаем в объекте на установленный топ
					if (searchObject[$scope.curActiveSlide].topForNextImage != null) {
						Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][activeBlock].height;
						// Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][activeBlock].height;
					}
				}

				$scope.curItem.itemRef.left = searchObject[$scope.curActiveSlide].sumOfColumnsWidth + searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%';

				if ($scope.curItem.childItems[0].textType == 'usual') {
					searchObject[$scope.curActiveSlide].topForNextText = null;
				} else if ($scope.curItem.childItems[0].key == 'objectItem') {
					searchObject[$scope.curActiveSlide].topForNextImage = null;
				}
			}
		}

		//--------находим мах ширину блока и изменяем
		// setMaxWidthOfBlockElementToBlock = function() {
		// 	//ширина блока становится равна мах контейнеру по ширине
		// 	if(parseFloat(Blocks[$scope.curActiveSlide][activeBlock].width) < parseFloat($scope.curItem.itemRef.width)) {
		// 		Blocks[$scope.curActiveSlide][activeBlock].width = $scope.curItem.itemRef.width;
		// 	}
		// }

		//-----запись координат для блоков
		myAutoLayout.savingCoordsForBlocks = function() {
			for (var indexElement in $scope.curslide.items) {

				if ($scope.curslide.items[indexElement].childItems[0].textType == 'usual') { //----для обычного текста
					addedElement = $scope.curslide.items[indexElement].childItems[0].textType;
					if (!topsOfObjects.minimumTopTextWasFound) {
						searchObject[$scope.curActiveSlide].topForNextText = $scope.curslide.items[indexElement].itemRef.top;
						topsOfObjects.gTopText = searchObject[$scope.curActiveSlide].topForNextText;
						topsOfObjects.minimumTopTextWasFound = true;
					}
				} else if ($scope.curslide.items[indexElement].childItems[0].key == 'objectItem') { //----для картинки
					addedElement = $scope.curslide.items[indexElement].childItems[0].key;
					if (!topsOfObjects.minimumTopImageWasFound) {
						searchObject[$scope.curActiveSlide].topForNextImage = $scope.curslide.items[indexElement].itemRef.top;
						topsOfObjects.gTopImage = searchObject[$scope.curActiveSlide].topForNextImage;
						topsOfObjects.minimumTopImageWasFound = true;
					}
				}

				if (Blocks[$scope.curActiveSlide][indexElement] != null) {
					Blocks[$scope.curActiveSlide][indexElement].topOfBlock = $scope.curslide.items[indexElement].itemRef.top;
					Blocks[$scope.curActiveSlide][indexElement].leftOfBlock = (parseFloat($scope.curslide.items[indexElement].itemRef.left) < 3) ? parseFloat(searchObject[$scope.curActiveSlide].baseLineSizeInPercent) : $scope.curslide.items[indexElement].itemRef.left;
					// Blocks[$scope.curActiveSlide][indexElement].leftOfBlock = $scope.curslide.items[indexElement].itemRef.left;
				}
			}
		}

		//----выстраивание добавленного элемента
		myAutoLayout.objectsAlignment = function() {

			//---проврка на включенность автоверстки
			if (presentationObject.autoLayoutTurnOn) {
				if (!aligmentCalledFromFunctionAddNewItem) {
					closeItem();
				}

				if (aligmentCalledFromFunctionAddNewItem && $scope.curItem != null) {
					//----если нужно не двигать контент при его распредлении к определенной границе, а оставлять его на месте, но двигать элементы, нужно закомментить условие
					// if(searchObject[$scope.curActiveSlide].wholeHeight == null || searchObject[$scope.curActiveSlide].wholeWidth == null) {
					myAutoLayout.alignInitialization(); //-----обновление мин и мах, общих ширин, высот 
					secondCallOfAlignInit = true;
					// }
					myAutoLayout.setNewCoords();
				}

				myAutoLayout.alignInitialization();
				myAutoLayout.alignByVertical();
				myAutoLayout.alignByHorizontal();

				myAutoLayout.standartization();

				//------запись координат для блоков
				myAutoLayout.savingCoordsForBlocks();

				myAutoLayout.checkOtherBlocksInLeftZone();

				if (!aligmentCalledFromFunctionAddNewItem) {
					searchObject[$scope.curActiveSlide].checkedSum += parseFloat(Blocks[$scope.curActiveSlide][indexElement].leftOfBlock);
				}

				if ($scope.curItem != null) {
					Blocks[$scope.curActiveSlide][activeBlock].topCurrent = parseFloat($scope.curItem.itemRef.top) + parseFloat($scope.curItem.itemRef.height);
				}

				if (aligmentCalledFromFunctionAddNewItem && $scope.curItem != null) {
					moveTextEtitPopup($scope.curItem);
					aligmentCalledFromFunctionAddNewItem = false;
				}
				secondCallOfAlignInit = false;

			}
		}

		//------расположение в ряд
		myAutoLayout.setInline = function(type, index, height, width, tmpWidth, allWidth, childPos, nextHeight, nextWidth) {
			var elementsTop = ((presentationObject.curHeight) - height - nextHeight - 2 * baseLineSize) / 2;
			if (type == 'objectItem') {
				$scope.curslide.items[index].itemRef.top = (((childPos == 0) ? elementsTop : childPos) * 100) / (presentationObject.curHeight) + '%';
				$scope.curslide.items[index].itemRef.left = 50 - allWidth * 100 / presentationObject.curWidth + tmpWidth * 100 / presentationObject.curWidth + '%';
			}
			return elementsTop;
		}

		//------расположение в колонну
		myAutoLayout.setInheight = function(type, index, height, width, tmpHeight, allHeight) {
			var elementsTop = ((presentationObject.curHeight) - allHeight) / 2;
			if (type == 'objectItem') {
				$scope.curslide.items[index].itemRef.top = (elementsTop * 100) / (presentationObject.curHeight) + (tmpHeight * 100) / (presentationObject.curHeight) + '%';
				$scope.curslide.items[index].itemRef.left = 50 - allHeight * 100 / presentationObject.curWidth + tmpHeight * 100 / presentationObject.curWidth + '%';
			} else {

			}
		}
 
	}

	return autoLayoutService;
});