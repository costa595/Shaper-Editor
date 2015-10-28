var editorApp = angular.module('presEditor', ['dnd', "xeditable", 'uiSlider', 'ngLettering', 'angularFileUpload']);

editorApp.run(function(editableOptions, editableThemes) {


	// editableOptions.theme = 'default'; // bootstrap3 theme. Can be also 'bs2', 'default'
	// editableThemes['default'].submitTpl = '';
	// editableThemes['default'].cancelTpl = '';
	// editableThemes['default'].controlsTpl = '<div class="activeTextEditor"></div>';
	// editableThemes['default'].formTpl = '<form style="width: 100%;" class="editable-wrap"></form>';
});

editorApp.controller("presentationEditorController", ["$scope", '$http', 'FileUploader', presentationEditor]);

var bordersSize = 0; //Ширина рамок
var baseLineSize = 0; //Размер базовой линии
function presentationEditor($scope, $http, FileUploader) { //Контроллер

		var uploader = $scope.uploader = new FileUploader({
			url: '/php/upload.php'
		});

		// FILTERS

		uploader.filters.push({
			name: 'imageFilter',
			fn: function(item /*{File|FileLikeObject}*/ , options) {
				var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			}
		});

		// CALLBACKS

		uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/ , filter, options) {};
		uploader.onAfterAddingFile = function(fileItem) {
			console.info('onAfterAddingFile', fileItem);
		};

		uploader.onAfterAddingAll = function(addedFileItems) {
			uploader.uploadAll();
			console.info('onAfterAddingAll', addedFileItems);
		};
		uploader.onBeforeUploadItem = function(item) {
			$scope.showImagePopup = false;
			console.info('onBeforeUploadItem', item);
		};
		uploader.onProgressItem = function(fileItem, progress) {
			console.info('onProgressItem', fileItem, progress);
		};
		uploader.onProgressAll = function(progress) {
			console.info('onProgressAll', progress);
		};
		uploader.onSuccessItem = function(fileItem, response, status, headers) {
			console.info('onSuccessItem', fileItem, response, status, headers);
		};
		uploader.onErrorItem = function(fileItem, response, status, headers) {
			console.info('onErrorItem', fileItem, response, status, headers);
		};
		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.info('onCancelItem', fileItem, response, status, headers);
		};
		uploader.onCompleteItem = function(fileItem, response, status, headers) {
			console.info('onCompleteItem', fileItem, response, status, headers);
			var newImageItem = new imageItem(response.file_name, response.width, response.height);
			if ($scope.addShow.show) {
				//Задание ширины картинки в 150 пикселей
				var resizeKoef = response.width / response.height;
				newImageItem.itemRef.width = 150 * resizeKoef + 'px';
				newImageItem.itemRef.height = '150px';
				appendChildItem(newImageItem);
			} else {
				addNewItem(newImageItem);
			}
		};
		uploader.onCompleteAll = function() {
			console.info('onCompleteAll');
		};

		/*********************ГЛОБАЛЬНЫЕ ОБЪЕКТЫ ДЛЯ SCOPE**********************************/

		var Blocks = new Array();
		var searchObject = new Array();

		//---объект поиска для автоверстки
		Search = function() {
			return {
				maxLeftIndex: 0,
				minLeftIndex: 0,
				maxTopIndex: 0,
				minTopIndex: 0,
				baseLineSizeInPercent: 100 * (30 * presentationObject.curWidth / 1920) / presentationObject.curHeight,
				wholeWidth: 0,
				wholeHeight: 0,
				topObject: new Object(),
				leftObject: new Object(),
				sumOfColumnsWidth: 0,
				checkedSum: 0,
				savedHeight: 0,
				savedWidth: 0,
				curActiveStringLength: 0
			}
		}

		var initNewSlides = false;
		eval('presentationObject='+$('#presObj').attr('value'));
		if (!presentationObject) {
			presentationObject = new presentation();
			console.log(presentationObject)
			mergeTheme();
			resize_window_editor();
			initNewSlides = true;
		} else {
			for (var k in presentationMethods)
				presentationObject[k] = presentationMethods[k];
			//
			for (var k in presentationObject.slides) {
				Blocks[k] = new Array();
				searchObject[k] = new Search();
				var curSlide = presentationObject.slides[k];
				curSlide.active = false;
				curSlide.curClass = '';
				curSlide.showDopMenuButton = false;
				curSlide.bkgshow = {
					visibility: 'visible'
				};
				for (var i in slideMethods) {
					curSlide[i] = slideMethods[i];
				}
				for (var i in curSlide.items) {
					var curContainer = curSlide.items[i];
					curContainer.active = false;
					curContainer.cssContainer["border"] = '';
					// closeItem(i)
					for (var j in itemContainerMethods)
						curContainer[j] = itemContainerMethods[j];

					for (var t in curContainer.childItems) {
						curContainer.childItems[t].active = false;
						curContainer.childItems[t].css["border"] = '';
						for (var p in itemsMethods)
							curContainer.childItems[t][p] = itemsMethods[p];
					}


				}

			}
		}
		setTimeout(function() {
			angular.element('.angular-dnd-resizable-handle').remove();
		}, 1)


		//$scope.patternImg = '<object data="/images/patterns/2_2.svg" class="slide_background"></object>'

		//presentationObject.curWidth = '1000px'; //пока что костыль, чтобы получить первый размер презентации. Позже будет получаться из сохраненной
		$scope.presentation = presentationObject;
		$scope.template = presentationObject.template;
		//Цвета для перекраски слайда
		slidesColorArr = new Array();
		for (var c in $scope.template.color)
			slidesColorArr.push($scope.template.color[c])
		$scope.slides = presentationObject.slides;
		if (!presentationObject.autoLayoutTurnOn) {
			presentationObject.autoLayoutTurnOn = false;
		}

		$scope.bestAreas = clone(bestAreasTemplate); //Копируем объект наилучших областей. В процессе автоверстки обхект в scope может меняться, но объект от презентации должен оставаться неизменным
		$scope.showedAreas = new Array(); //Массив с наилучшими областями
		$scope.curActiveSlide = 0; //Активный слайд
		$scope.showLastPlusSlide = true;
		var curActiveItem = -1;
		var activeChildIndex = -1;
		$scope.curItem = null; //Активный элемент
		//$scope.curItem.curActiveChildItem = new Object(); //Текущее активное поле с текстом
		var tmpTextItemNumber = -1; //При первом клике туда записывается номер элемента, в itemClick инициализация объекта
		var tmpImageItemNumber = -1;
		var avoidBodyClick = true; //Работать ли клику по body
		var leftMenuClick = false;
		$scope.textBlocksText = textBlocksText;
		$scope.textEditPopup = angular.element('.editTextPopupCircle');
		$scope.openNewSlidePopup = false; //Открытие окна создания слайда
		$scope.mouseDownElement = new Object(); //Элемент, на котором был mouseDown. 
		$scope.avoidItemDelete = true;
		var curPressedKeys = new Array(); //Текущие зажатые клавиши. Массив создан для того, чтобы отслеживать комбинации клавиш
		var firstItemClick = true; //true - на текущий элемент только переключились (требуется для отслеживания textStylePopup.textType, чтобы не сбрасывались стили)
		var selectionRanges;

		//Для модульной сетки
		var rowAndSquareHeight, squareWidth;
		baseLineSize = 30 * presentationObject.curWidth / 1920;

		var DOMElement = angular.element('#tmpTextPlace'); //Объект id="tmpTextPlace"
		DOMElement.html('tmpTextPlace');
		$scope.curTmpText = { //Временный объект объекта id="tmpTextPlace" для анализа характеристик теста
			value: '',
			css: '',
		}
		var possibleAreaDif = 10; //Пограшность при наведении на наилучшие области
		//ВЫнесено в глобальный объект из-за того что тормозит, когда происходит добавление указателей в объект $scope.curItem
		$scope.curItemContainer = new Object(); //Объект контенера элемента
		var resizeHandler = new Object(); //Объект за который идет перетаскивание
		var mainSlide = angular.element('#main_slide');

		//Цвета рамки
		var borderColors = {
			red: '#4b8fff',
			green: '#00ff12',
		}

		$scope.textP = 0;
		$scope.coord = 22;

		/*********************POPUP редатирования текста*************************/
		//Объект попапа стиля текста
		$scope.textStylePopup = {
			curStyle: {
				floor: 0,
				ceiling: 10,
				step: 1,
				value: 5
			},
			fontSize: {
				floor: 10,
				ceiling: 80,
				step: 1,
				value: 5
			},
			letterSpacing: {
				floor: 0,
				ceiling: 30,
				step: 1,
				value: 5
			},
			lineHeight: {
				floor: 80,
				ceiling: 200,
				step: 1,
				value: 5
			},
			textType: '',
			childTextPopup: false,
		};

		var aligmentCalledFromFunctionAddNewItem = false;

		$scope.lineHelpersArray = new Array();
		$scope.squareArray = new Array();
		$scope.lineEqualHelpersArray = new Array();
		$scope.bigCoords = new Object();

		/***************************POPUP НАД ЭЛЕМЕНТОМ*****************************/

		$scope.textFormatStyle = true;
		$scope.imageFormatStyle = true;
		$scope.graphFormatStyle = true;
		$scope.formatGraphInfo = true;
		$scope.textFormatLayout = true;
		$scope.textFormatAdd = true;
		// $scope.textFormatMagic = true;
		$scope.textFormatGroup = true;
		$scope.textFormatUnGroup = true;

		function closeAllFormatCircles() {
			$scope.textFormatStyle = false;
			$scope.imageFormatStyle = false;
			$scope.graphFormatStyle = false;
			$scope.formatGraphInfo = false;
			$scope.textFormatLayout = false;
			$scope.textFormatAdd = false;
			// $scope.textFormatMagic = false;
			$scope.textFormatGroup = false;
			$scope.textFormatUnGroup = false;
		}

		function openFormatPopupText(type, subKey) {
			closeAllFormatCircles()
			$scope.showTextFormatPopup = true;
			switch (type) {
				case 'textItem':
					if (subKey != 'infograf') {
						$scope.textFormatStyle = true;
						$scope.textFormatLayout = true;
						$scope.textFormatAdd = true;
						if ($scope.curItem.curActiveChildItem)
							if ($scope.curItem.curActiveChildItem.newItem)
								$scope.textFormatAdd = false;
					}

					// $scope.textFormatMagic = true;
					break;

				case 'objectItem':
					if (subKey == 'objectItem') {
						$scope.imageFormatStyle = true;
					}
					if(subKey == 'graphItem') {
						$scope.graphFormatStyle = true;
						$scope.formatGraphInfo = true;
					}
					$scope.textFormatLayout = true;
					// $scope.textFormatAdd = true;
					break;

				case 'group':
					// $scope.textFormatAdd = true;
					$scope.textFormatLayout = true;
					$scope.textFormatUnGroup = true;
					break;
			}

		}

		/***************************ПРИКРЕПЛЕНИЕ ЭЛЕМЕНТОВ**************************/

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

		$scope.textStylePopup.addedTextType = new Array();
		var tmpAddedItems = new Object(); //Массив временных прикрепленных элементов. 

		//инициализация прикрепления теста к элементу и отображение нужного меню
		function initTextAddShow(item) {
			var key;
			if (item == 'group') {
				key = item;
			} else {
				key = item.key;
			}


			$scope.textStylePopup.addedTextType = [];

			switch (key) {
				case 'textItem':
					openChildTextAdd(item.textType);
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

		//инициализация для прикрепления текста к тексту
		function openChildTextAdd(textType) {
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

		//-------добавление текста
		$scope.addTextItem = function(type) {
			var newTextItem = new textItem(type, textBlocksText[type], presentationObject.template.font.fontStyles[$scope.curslide.slideType]);
			addNewItem(newTextItem);
			$scope.showFontPopup = false;
		}

		//-------добавление изображения
		$scope.addImageItem = function(imgSrc) {
			var newImageItem = new iconItem(imgSrc);
			if ($scope.addShow.show) {
				for (var k in $scope.curItem.childItems) {
					if ($scope.curItem.childItems[k].newItem) {
						if ($scope.curItem.childItems[k].key == 'objectItem') {
							$scope.curItem.childItems[k].value = imgSrc;
							return;
						}
					}
				}
				//Задание ширины картинки в 150 пикселей
				newImageItem.itemRef.width = '100px';
				newImageItem.itemRef.height = '100px';
				appendChildItem(newImageItem);
			} else {
				addNewItem(newImageItem);
			}
		}

		//-------добавление графика
		$scope.addGraphItem = function(graphType) {
			var newGraphItem = new graphItem(graphType, presentationObject.template.font.fontStyles[$scope.curslide.slideType]);
			newGraphItem.standart = standartGraphObject;
			addNewItem(newGraphItem);
			var itemId = 'item' + $scope.curItem.curId;

			newGraphItem.standart.chart.type = graphType;
			newGraphItem.standart.chart.renderTo = itemId;

			setTimeout(function() { 
				var chart = new Highcharts.Chart(newGraphItem.standart);
			}, 0);

			console.log(newGraphItem, itemId);
		}

		function reInitGraph(infoGraphObj) {
			// var plotGraphObj = new Object();
			// if(standartBool) {
			// 	plotGraphObj = infoGraphObj;
			// } else {
				var plotGraphObj = new Object();
				plotGraphObj.chart = new Object();
				plotGraphObj.chart.type = infoGraphObj.graphType;
			// }

		}

		function closeAllPlus() { //Закрыть весь контент в окне добавления
			//Именуем Add Что К чему
			$scope.addShow.addTextText = false; //Текст к текст
			$scope.addShow.addTextPicture = false; //Текст к картинке / текст к группе
			$scope.addShow.addPictureText = false; //Картинка к текст
			$scope.addShow.addPicturePicture = false; //Картинка к картинке / картинка к группе
		}

		$scope.showPlusText = function() { //Отображаем прикрепление текста
			if ($scope.addShow.addTextText || $scope.addShow.addTextPicture)
				return;

			if (tmpAddedItems.text) {
				var prevWidth = $scope.curItem.itemRef.width;
				var prevHeight = $scope.curItem.itemRef.height;

				appendChildItem(tmpAddedItems.text.item);
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


			closeAllPlus();
			if ($scope.curItem.curActiveChildItem) {
				initTextAddShow($scope.curItem.curActiveChildItem)
			} else {
				var wasNotInited = true;
				if (tmpAddedItems.text) {
					if (tmpAddedItems.text.parentItem != undefined) {
						wasNotInited = false;
						initTextAddShow($scope.curItem.childItems[tmpAddedItems.text.parentItem]);
					}
				} else if (tmpAddedItems.picture) {
					wasNotInited = false;
					initTextAddShow($scope.curItem.childItems[tmpAddedItems.picture.parentItem]);
				} else if (tmpAddedItems.curParent != undefined) {
					wasNotInited = false;
					initTextAddShow($scope.curItem.childItems[tmpAddedItems.curParent]);
				}
				if (wasNotInited) {
					if ($scope.curItem.childItems.length > 1) {
						initTextAddShow('group');
					} else {
						initTextAddShow($scope.curItem.childItems[0]) //Если 1 элемент, то прикрепление по типу этого элемента
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

				appendChildItem(tmpAddedItems.picture.item);
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

			closeAllPlus();

			if ($scope.curItem.curActiveChildItem) {
				console.log('$scope.curItem.curActiveChildItem.key', $scope.curItem.curActiveChildItem.key)
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
						changeAddedTextType(k, type);
						return;
					}
				}
			}
			var newItem = new textItem(type, textBlocksText[type], presentationObject.template.font.fontStyles[$scope.curslide.slideType]);
			appendChildItem(newItem);
		}

		function changeAddedTextType(itemId, newType) {
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
			console.log('addShowAddingReady 1 $scope.curItem', clone($scope.curItem))
			convertContainerSizesPercentToPx($scope.curItem, false);
			console.log('addShowAddingReady 2 $scope.curItem', clone($scope.curItem))
			$scope.curItem.curPatternIndex = presentationObject.addPattern($scope.curslide.slideType, new microPattern($scope.curItem.childItems), newItem);
			console.log('addShowAddingReady 3 $scope.curItem', clone($scope.curItem))
			convertContainerSizesPxToPercent($scope.curItem, false);
			console.log('addShowAddingReady 4 $scope.curItem', clone($scope.curItem))
			$scope.closeLeftWindows();

			newItem.tmpPosition = '';
			newItem.parentItem = undefined;

			closeAllPlus();
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
			closeAllPlus();
			$scope.closeLeftWindows();
		}

		function appendChildItem(newItem) {
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

		function changeContainerToPattern(items, pattern) {
			var patternIcons = clone(pattern.icons);
			var patternText = clone(pattern.text);

			var patternContainer = patternIcons.concat(patternText);

			for (var k in patternContainer) {
				patternContainer[k].hierarchy = patternContainer[k].hierarchy.split('_');
				patternContainer[k].free = true; //При подборе контейнера использовано ли данное место или нет
			}

			var tmp;

			for (var i = patternContainer.length - 1; i > 0; i--) {
				for (var j = 0; j < i; j++) {
					if (patternContainer[j].hierarchy[0] > patternContainer[j + 1].hierarchy[0]) {
						tmp = patternContainer[j];
						patternContainer[j] = patternContainer[j + 1];
						patternContainer[j + 1] = tmp;
					}
				}
			}

			var maxStr = patternContainer[patternContainer.length - 1].hierarchy[0];

			var tmpContainer = new Array();
			var orderedPatternContainer = new Array();
			var curStr = 0;

			for (var k in patternContainer) {
				if (patternContainer[k].hierarchy[0] != curStr) {
					for (var i = tmpContainer.length - 1; i > 0; i--) {
						for (var j = 0; j < i; j++) {
							if (tmpContainer[j].hierarchy[1] > tmpContainer[j + 1].hierarchy[1]) {
								tmp = tmpContainer[j];
								tmpContainer[j] = tmpContainer[j + 1];
								tmpContainer[j + 1] = tmp;
							}
						}
					}
					orderedPatternContainer = orderedPatternContainer.concat(tmpContainer);
					tmpContainer = [];
					curStr = patternContainer[k].hierarchy[0];
				}
				tmpContainer.push(patternContainer[k]);
			}

			for (var i = tmpContainer.length - 1; i > 0; i--) {
				for (var j = 0; j < i; j++) {
					if (tmpContainer[j].hierarchy[1] > tmpContainer[j + 1].hierarchy[1]) {
						tmp = tmpContainer[j];
						tmpContainer[j] = tmpContainer[j + 1];
						tmpContainer[j + 1] = tmp;
					}
				}
			}
			orderedPatternContainer = orderedPatternContainer.concat(tmpContainer);
			patternContainer = orderedPatternContainer;


			var newContainer = new Array();

			//Проход по паттерну, потом для текущего места паттерна ищем элемент в контейнере
			for (var k in patternContainer) {
				for (var i in items) {
					if (items[i].key == patternContainer[k].type) {
						var addThisItem = false;
						if (patternContainer[k].type == 'textItem') {
							if (patternContainer[k].textType == items[i].textType) {
								addThisItem = true;
							}
						} else if (patternContainer[k].type == 'objectItem') {
							addThisItem = true;
						}

						if (addThisItem) {
							for (var c in patternContainer[k])
								items[i][c] = patternContainer[k][c];
							items[i].hierarchy = items[i].hierarchy[0] + '_' + items[i].hierarchy[1];
							// newContainer.push(items[i]);
						}
					}
				}
			}

			return items;
		}

		//Изменяет иерархию добавленного элемента. Container - текущий контейнер
		function swapHierarchy(container, tmpNewItem, strHNew, strHOld) {
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
				swapHierarchy($scope.curItem.childItems, tmpNewItem, strHNew, strHOld);

			//Изменяем текущий паттерн
			// presentationObject.changePattern($scope.curslide.slideType, $scope.curItem.curPatternIndex, new microPattern($scope.curItem.childItems))
			resizeItemContainer($scope.curItem, false);
			moveTextEtitPopup(addedItemId);
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


		/*********************************СТИЛИЗАЦИЯ ТЕКСТА************************/

		//Изменение размера текста
		// $scope.$watch('textStylePopup.fontSize.value', function(newVal, oldVal) {
		// 	if ($scope.curItem) {
		// 		$scope.curItem.curActiveChildItem.css['font-size'] = newVal + 'px';
		// 		resizeItemContainer($scope.curItem, true);
		// 	}
		// });

		//Изменение плотности текста
		// $scope.$watch('textStylePopup.letterSpacing.value', function(newVal, oldVal) {
		// 	if ($scope.curItem) {
		// 		$scope.curItem.curActiveChildItem.css['letter-spacing'] = newVal + 'px';
		// 		resizeItemContainer($scope.curItem, true);
		// 	}
		// });

		//Изменение интерлиньяжа текста
		// $scope.$watch('textStylePopup.lineHeight.value', function(newVal, oldVal) {
		// 	if ($scope.curItem) {
		// 		$scope.curItem.curActiveChildItem.css['line-height'] = newVal + '%';
		// 		resizeItemContainer($scope.curItem, true);
		// 	}
		// });

		function createTextSnippet(html) {
			//example as before, replace YOUR_TEXTAREA_ID
			//var html = CKEDITOR.instances.YOUR_TEXTAREA_ID.getSnapshot();
			var dom = document.createElement("DIV");
			dom.innerHTML = html;
			var plain_text = (dom.textContent || dom.innerText);

			//create and set a 128 char snippet to the hidden form field
			var snippet = plain_text.substr(0, 127);
			return snippet;
			//return document.getElementById("hidden_snippet").value = snippet;

			//return true, ok to submit the form
			//return true;
		}

		//Сокращение текста
		$scope.showMagicShow = function() {
			var curTextItemInfograf = tmpTextItemNumber;
			var curItem = $scope.curItem.curActiveChildItem;
			var strData = '';
			if (!$scope.curItem.curActiveChildItem) {
				curTextItemInfograf = 0;
				curItem = $scope.curItem.childItems[0];
				// strData = curItem.value;
			}
			if (curItem.subKey == 'infograf') {
				return;
			}
			//var strData = createTextSnippet($scope.curItem.curActiveChildItem.value);

			// var instanceId = 'textEditor' + $scope.curActiveSlide + '' + curActiveItem + '' + curTextItemInfograf;
			// var editor = CKEDITOR.instances[instanceId];
			// strData = editor.getSelection().getSelectedText();

			if (strData == '')
				strData = createTextSnippet(curItem.value);

			$http({
				method: 'POST',
				url: '/aot/magic.php',
				data: 'text=' + strData,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				withCredentials: true
			}).success(function(data, status, headers, config) {
				//InsertHTML(data, instanceId)

				// editor.insertText('');
				// curItem.value = editor.getSelection().getSelectedText();

				//Удалить curItem
				$scope.curslide.items.splice(curActiveItem, 1);

				var newTextItem = new textItem('usual', data, presentationObject.template.font.fontStyles[$scope.curslide.slideType]);
				addNewItem(newTextItem);
				newTextItem.subKey = 'infograf';
				var containerId = $scope.curslide.items.length - 1;
				var childId = 0;
				var slideId = $scope.curActiveSlide;
				setTimeout(function() {

					maxWidthInfograf(400, 1, 0, $scope.curslide.items[containerId].childItems[0].textEditorId);

				}, 300)

				closeItem();

			}).
			error(function(data, status, headers, config) {});
		}


		$scope.avoidBodyClick = function() {
			if ($scope.curItem)
				if ($scope.curItem.curActiveChildItem)
					saveItemSelection($scope.curItem.curActiveChildItem.textEditorId);
			avoidBodyClick = false;
			leftMenuClick = true;
		}

		/*********************НИЖНЯЯ ПАНЕЛЬ СЛАЙДОВ*************************/

		if (initNewSlides) { //Если презентация новая, то создать 3 слайда. В противном случае слайды уже созданные есть
			presentationObject.slides.push(new slide('first', $scope.template));
			presentationObject.slides.push(new slide('middle', $scope.template));
			presentationObject.slides.push(new slide('last', $scope.template));
			for (var k = 0; k < 3; k++) {
				Blocks[k] = new Array();
				searchObject[k] = new Search();
			}

			var presentation_object = presentationObject.preparePresentationForSave();
			createPres(presentation_object)
				// $.ajax({
				// 	type: 'POST',
				// 	url: '/php/wizard.php?ref=editors',
				// 	data: {
				// 		data: presentation_object,
				// 		name: presq_name,
				// 		about: presq_about,
				// 	},
				// 	success: function(res) {
				// 		presq_id = res;
				// 	}
				// });
				// save_pres();
		}

		$scope.curslide = presentationObject.slides[0];
		$scope.curslide.active = true;
		$scope.curslide.showDopMenuButton = true;
		$scope.slidePopup = false;
		$scope.curslide.curClass = 'active-slide'; //Стиль активного слайда
		angular.element('.slide_background').attr('data', $scope.curslide.background)

		colorSlide();
		//Перекраска слайда


		//Перекраска всех превью
		// var intervalIDSmallSlides = setInterval(function() {
		// 	color_pattern(slidesColorArr, 'img_slide', intervalIDSmallSlides);
		// }, 50);


		$scope.openSlide = function(index) {
			openSlide(index)
		}

		function openSlide(index) {
			closeItem();
			//Предыдущий слайд
			$scope.curslide.active = false;
			$scope.curslide.showDopMenuButton = false;
			$scope.slidePopup = false;
			$scope.curslide.curClass = '';
			//Новый слайд
			$scope.curslide = $scope.slides[index];
			$scope.curslide.active = true;
			$scope.curslide.showDopMenuButton = true;
			$scope.curslide.curClass = 'active-slide'; //Стиль активного слайда
			$scope.curActiveSlide = index;
			colorSlide();

			avoidBodyClick = false;
		}

		$scope.openSlidePopup = function(index) {
			$scope.slidePopup = true;
			avoidBodyClick = false;
			slide_popup_on(index, $scope.slides.length + 1);
		}

		$scope.createSlide = function() {
			createNewSlide($scope.curActiveSlide);
			positionPopupChooseTypeOfSlide();
			$scope.showLastPlusSlide = false;
			colorSlide();
		}

		$scope.createNewLastSlide = function() {
			$scope.showLastPlusSlide = false;
			createNewSlide($scope.slides.length - 1);
			positionPopupChooseTypeOfSlide();
			colorSlide();
		}

		var addedSlideIndex = 0;

		$scope.initSlide = function(type) {
			openSlide(addedSlideIndex)
			scroll_left_position_end($scope.slides.length + 1);
			$scope.curslide.initSlide(type, presentationObject.template);
			$scope.openNewSlidePopup = false;
			$scope.curslide.newSlide = false;
			$scope.curslide.showDopMenuButton = true;
			$scope.curslide.curClass = '';
			colorSlide();
			openSlide($scope.curActiveSlide);
			$scope.showLastPlusSlide = true;
			$scope.curslide.bkgshow = {
				visibility: 'visible'
			};
		}

		$scope.dublicateSlide = function() {
			var tmpLogObj = new logObj($scope.curActiveSlide, $scope.slides, 'dublicateSlide');
			presentationObject.addLog(tmpLogObj);
			resize_scroll_width_duble($scope.curActiveSlide, $scope.slides.length + 1);
			var newSlide = clone($scope.curslide); //Копирование объектов
			$scope.curActiveSlide = parseInt($scope.curActiveSlide) + 1;
			$scope.slides.splice($scope.curActiveSlide, 0, newSlide)
			openSlide($scope.curActiveSlide)
			avoidBodyClick = false;
			$scope.slidePopup = false;
			colorSlide();
		}

		$scope.deleteSlide = function(index) {
			var tmpLogObj = new logObj($scope.curActiveSlide, $scope.slides, 'deleteSlide');
			presentationObject.addLog(tmpLogObj);
			$scope.slides.splice($scope.curActiveSlide, 1);
			if ($scope.slides.length != 0) {
				if ($scope.curActiveSlide != 0) {
					openSlide($scope.curActiveSlide - 1);
				} else {
					openSlide(0);
				}
			} else {
				//Пустой
				//Дофиксить - положить подложку
				$scope.curslide = new slide('no-slides', $scope.template);
				$scope.curslide.background = '/images/patterns/2_1.svg'

			}
			if ($scope.slides.length == 0) {
				createNewSlide(-1);
				positionPopupChooseTypeOfSlide(1);
			}
			delete_slide($scope.slides.length + 1);

		}

		function createNewSlide(index) {
			var tmpLogObj = new logObj($scope.curActiveSlide, $scope.slides, 'createSlide');
			presentationObject.addLog(tmpLogObj);
			$scope.slidePopup = false;
			scroll_left_position(index, $scope.slides.length + 1);
			addedSlideIndex = index + 1;
			$scope.slides.splice(addedSlideIndex, 0, new slide('first', $scope.template))
				// openSlide(addedSlideIndex)
			var newSlide = $scope.slides[addedSlideIndex];
			newSlide.curClass = 'new-slide';
			newSlide.bkgshow = {
				visibility: 'hidden'
			};
			newSlide.newSlide = true;
			newSlide.showDopMenuButton = false;
			$scope.openNewSlidePopup = true;
			avoidBodyClick = false;
			colorSlide();
			Blocks[addedSlideIndex] = new Array();
			searchObject[addedSlideIndex] = new Search();
		}

		//Перетаскивание слайдов
		// $scope.$watch("slides", function(value) {
		// 	var numIterator = -1;
		// 		numIterator++;
		// 		return numIterator;
		// 	}).join(','));
		// }, true);

		/*****************ДОБАВЛЕНИЕ ЭЛЕМЕНТОВ НА СЛАЙД*************************/

		var avoidAddPopupOpen = true;

		function closeAddingPopup() {
			$scope.showFontPopup = false;
			$scope.showImagePopup = false;
		}

		$scope.openAddTextPopup = function() {
			if (avoidAddPopupOpen) {
				var prevState = $scope.showFontPopup;
				closeAddingPopup()
				$scope.showFontPopup = !prevState;
				avoidBodyClick = false;
			} else {
				avoidAddPopupOpen = true;
			}
		}

		$scope.openAddImagePopup = function() {
			if (avoidAddPopupOpen) {
				var prevState = $scope.showImagePopup;
				closeAddingPopup()
				$scope.showImagePopup = !prevState;
				avoidBodyClick = false;
			} else {
				avoidAddPopupOpen = true;
			}
		}

		$scope.ungroupContainer = function() {
			var containerLeftPx = $scope.curItem.sizeInPx('left');
			var containerTopPx = $scope.curItem.sizeInPx('top');
			var containerWidthPx = $scope.curItem.sizeInPx('width');
			var containerHeightPx = $scope.curItem.sizeInPx('height');
			var childsToUngroup = $scope.curItem.childItems;
			for (var k in childsToUngroup) {
				var curChild = childsToUngroup[k]
				var childInContainerTopPx = parseFloat(curChild.itemRef.top) * containerHeightPx / 100;
				var childInContainerLeftPx = parseFloat(curChild.itemRef.left) * containerWidthPx / 100;
				var childInContainerWidthPx = parseFloat(curChild.itemRef.width) * containerWidthPx / 100;
				var childInContainerHeightPx = parseFloat(curChild.itemRef.height) * containerHeightPx / 100;
				var newItem = clone(curChild);
				newItem.hierarchy = '0_0';

				var newContainerAbsoluteLeft = containerLeftPx + childInContainerLeftPx;
				var newContainerAbsoluteTop = containerTopPx + childInContainerTopPx;

				var newItemContainer = new slideItem(newItem);
				newItem.itemRef.left = '0%';
				newItem.itemRef.top = '0%';
				newItem.itemRef.width = '100%';
				newItem.itemRef.height = '100%';

				newItemContainer.itemRef.top = newContainerAbsoluteTop / presentationObject.curHeight * 100 + '%';
				newItemContainer.itemRef.left = newContainerAbsoluteLeft / presentationObject.curWidth * 100 + '%';
				newItemContainer.itemRef.width = (childInContainerWidthPx + 3) / presentationObject.curWidth * 100 + '%';
				newItemContainer.itemRef.height = childInContainerHeightPx / presentationObject.curHeight * 100 + '%';



				newItemContainer.preventDrag = false;

				// resizeItemContainer(newItemContainer, true);


				$scope.curslide.items.push(newItemContainer);

				closeItem($scope.curslide.items.length - 1);

				// if (newItem.key == 'objectItem') {
				// 	//Картинка на 100% от конетйнера
				// 	newItem.css.width = '100%';
				// 	newItem.css.height = '100%';
				// }
				// addNewItem(newItem);

			}
			var itemToDelete = curActiveItem;
			closeItem();
			$scope.curslide.items.splice(itemToDelete, 1);
		}

		function addNewItem(item) {
			var tmpLogObj = new logObj($scope.curActiveSlide, $scope.curslide, 'addItem');
			presentationObject.addLog(tmpLogObj);
			var curSlideType = $scope.curslide.slideType
			var newItemContainer = new slideItem(item);
			var type;
			if (item.key == 'textItem') {
				type = item.textType;
				// for (var area in $scope.bestAreas[curSlideType].text[type])
				// 	newItemContainer.addBestArea($scope.bestAreas[curSlideType].text[type][area]);
			}

			if (item.key == 'objectItem') {
				var koef = item.itemRef.width / item.itemRef.height;
				if (item.itemRef.width > presentationObject.curWidth) {
					item.itemRef.width = presentationObject.curWidth - 2 * baseLineSize;
					item.itemRef.height = item.itemRef.width * koef;
				}
				if (item.itemRef.height > presentationObject.curHeight) {
					item.itemRef.height = presentationObject.curHeight - 2 * baseLineSize;
					item.itemRef.width = item.itemRef.height / koef;
				}

				//Так как картинка первая и единственная в контейнере, ставим ширину контейнера под ее размер
				console.log(item.itemRef.width, item.itemRef.height)
				newItemContainer.itemRef.width = parseFloat(item.itemRef.width) / presentationObject.curWidth * 100 + '%';
				newItemContainer.itemRef.height = parseFloat(item.itemRef.height) / presentationObject.curHeight * 100 + '%';
				//Картинка на 100% от конетйнера
				item.itemRef.width = '100%';
				item.itemRef.height = '100%';
			} 


			newItemContainer.preventDrag = false;

			resizeItemContainer(newItemContainer, true);

			$scope.curslide.items.push(newItemContainer);

			emptyLassoContainer();
			itemClick($scope.curslide.items.length - 1);
			avoidAddPopupOpen = false;
			$scope.showFontPopup = false;
			$scope.showImagePopup = false;

			//-----инициализация выстраивания
			aligmentCalledFromFunctionAddNewItem = true;
			objectsAlignment();
		}

		$scope.itemClick = function(index, event, keyPressed) {
			if ($scope.preventItemClick) {
				$scope.preventItemClick = false;
				return;
			}
			var pressedKey = curPressedKeys[0];
			if ((pressedKey === 17) || (pressedKey == 18) || (pressedKey == 91)) {
				var curItem = $scope.curslide.items[index];
				if (curItem.manuallySelected) {
					curItem.manuallySelected = false;
					curItem.cssContainer["border"] = '';

				} else {
					curItem.manuallySelected = true;
					$scope.onSelecting(curItem);
					curItem.canUnselect = false;
				}
				curItem.canUnselect = true;
				if ($scope.curItem) {
					var tmpCurItem = $scope.curItem;
					closeItem();
					tmpCurItem.manuallySelected = true;
					$scope.onSelecting(tmpCurItem);
					tmpCurItem.canUnselect = false;
				}
				avoidBodyClick = false;
				return;
			}
			itemClick(index);
		}

		var curItemPrevState = new Object();

		function itemClick(index) {
			emptyLassoContainer();
			var firstContainerClick = true;
			if ($scope.curItem) { //Если произошло перещелкивание между объектами, обнулить предыдущий
				if (curActiveItem != index) {
					closeItem();
					$scope.curItem = $scope.curslide.items[index];
					curItemPrevState = clone($scope.curItem);
					if ($scope.curItem.curActiveChildItem)
						$scope.curItem.curActiveChildItem.resizeHandlers = '';
					$scope.curItem.curActiveChildItem = null;
				} else {
					firstContainerClick = false;
				}
			} else {
				$scope.curItem = $scope.curslide.items[index];
				curItemPrevState = clone($scope.curItem);
				if ($scope.curItem.curActiveChildItem)
					$scope.curItem.curActiveChildItem.resizeHandlers = '';
				$scope.curItem.curActiveChildItem = null;
			}

			$scope.curItem.curClass = 'activeTextEditor';
			curActiveItem = index;

			$scope.curItem.active = true;
			$scope.curItem.curId = index;

			// if ($scope.curItem.inArea) { //Инициализация цвета рамки контейнера
			// 	$scope.curItem.cssContainer["border"] = "1px " + borderColors.green + " solid";
			// } else {
			// 	$scope.curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
			// }

			$scope.curItemContainer = angular.element('#item' + index); //HTML объект контейнера
			resizeHandler = $scope.curItemContainer.find(".angular-dnd-resizable-handle"); //HTML объект ресайзера

			moveTextEtitPopup(index); //Перемещаем popup редактирования текста

			$scope.curItem.resizeHandlers = [];

			if ($scope.curItem.childItems.length == 1) {
				$scope.curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
				switch ($scope.curItem.childItems[0].key) {
					case 'textItem':
						$scope.curItem.resizeHandlers = ["e", "w"];
						break;
					case 'objectItem':
						$scope.curItem.resizeHandlers = ["se", "nw"];
						break;
				}
			} else {
				$scope.curItem.cssContainer["border"] = "1px #c1c2c2 dashed";
				//Поиск по типам однородного контента (весь текст)
				var requiredKey = 'textItem';
				var showTextResizeHandlers = true
				for (var k in $scope.curItem.childItems) {
					if ($scope.curItem.childItems[k].key != requiredKey) {
						showTextResizeHandlers = false
					}
				}
				if (showTextResizeHandlers) {
					$scope.curItem.resizeHandlers = ["e", "w"];
				} else {
					angular.element("#item" + curActiveItem).find(".angular-dnd-resizable-handle").remove();
				}
			}

			if (!firstContainerClick) {
				var moveBorders = true;
				if (activeChildIndex != -1)
					moveBorders = false;
				if (tmpTextItemNumber >= 0) {
					$scope.curItem.cssContainer["border"] = ""; //Так как клик на текст, у него своя рамка

					$scope.curItem.curClass = '';

					var itemsIterator = 0;
					for (var i in $scope.curItem.childItems) {
						if ($scope.curItem.childItems[i].key == 'textItem')
							$scope.curItem.childItems[i].textContainerCss["border"] = "";
						else 
							$scope.curItem.childItems[i].itemRef["border"] = "";
						if ($scope.curItem.childItems[i].key == "textItem") {
							if (itemsIterator == tmpTextItemNumber) {
								tmpTextItemNumber = i;
								break;
							}
							itemsIterator++;
						}
					}
					var firstClick = true; //Это первый или второй клик по элементу?
					if ($scope.curItem.curActiveChildItem) {
						firstClick = false;
					}

					for (var k in $scope.curItem.childItems) {
						var curChild = $scope.curItem.childItems[k];
						curChild.textContainerCss["border"] = '';
						if (curChild.key == 'textItem')
							curChild.textContainerCss["border"] = "";
						else 
							curChild.itemRef["border"] = "";
						curChild.css["pointer-events"] = 'none';
					}

					activeChildIndex = tmpTextItemNumber;
					$scope.curItem.curActiveChildItem = $scope.curItem.childItems[tmpTextItemNumber];

					$scope.curItem.curActiveChildItem.resizeHandlers = ["e", "w"];

					openFormatPopupText($scope.curItem.curActiveChildItem.key, $scope.curItem.curActiveChildItem.subKey)

					$scope.curItem.curActiveChildItem.textContainerCss["border"] = "1px " + borderColors.red + " solid";
					$scope.curItem.curActiveChildItem.css["pointer-events"] = '';

					//CKEditor
					var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
					angular.element('#' + $scope.curItem.curActiveChildItem.textEditorId).css('cursor', 'text');

					$scope.curItem.curActiveChildItem.activeClass = "texteditorActive";

					$scope.textStylePopup.textType = $scope.curItem.curActiveChildItem.textType; //Инициализация popup стилизации текста

					var content = $scope.curItem.curActiveChildItem.value.replace(/\n/g, '<br>');
					//DOMElement.html(content + '<br class="lbr">')
					//activeTextEditor

					//Выделяем все содержимое
					try {
						if (firstClick) {
							var editor = CKEDITOR.instances[instanceId];

							var range = editor.createRange();

							if (range) {
								range.selectNodeContents(editor.editable());
								editor.getSelection().selectRanges([range]);
							}

						}
					} catch (e) {}
				} else if (tmpImageItemNumber >= 0) {
					var itemsIterator = 0;
					for (var i in $scope.curItem.childItems) {
						if ($scope.curItem.childItems[i].key == "objectItem") {
							if (itemsIterator == tmpImageItemNumber) {
								tmpImageItemNumber = i;
								break;
							}
							itemsIterator++;
						}
					}
					activeChildIndex = tmpImageItemNumber;
					$scope.curItem.curActiveChildItem = $scope.curItem.childItems[tmpImageItemNumber];
					openFormatPopupText($scope.curItem.curActiveChildItem.key, $scope.curItem.curActiveChildItem.subKey)

				} else {
					if ($scope.curItem.curActiveChildItem)
						$scope.curItem.curActiveChildItem.resizeHandlers = '';
					$scope.curItem.curActiveChildItem = null;
				}

				//Очистить области
				$scope.showedAreas = [];
				//поправка на рамки
				if (moveBorders) {
					var containerNewLeftPx = $scope.curItem.sizeInPx("left") + 1;
					var containerNewTopPx = $scope.curItem.sizeInPx("top") + 1;
					$scope.curItem.itemRef.left = containerNewLeftPx / presentationObject.curWidth * 100 + '%';
					$scope.curItem.itemRef.top = containerNewTopPx / presentationObject.curHeight * 100 + '%';
					var containerWidthPx = $scope.curItem.sizeInPx("width");
					var containerHeightPx = $scope.curItem.sizeInPx("height");
					for (var k in $scope.curItem.childItems) {
						if (k == activeChildIndex)
							continue;
						var curChild = $scope.curItem.childItems[k];
						var childNewLeftPx = curChild.sizeInPx($scope.curItem, "left") + 1;
						var childNewTopPx = curChild.sizeInPx($scope.curItem, "top") + 1;

						curChild.itemRef.left = childNewLeftPx / containerWidthPx * 100 + '%';
						curChild.itemRef.top = childNewTopPx / containerHeightPx * 100 + '%';
					}
				}
				moveTextEtitPopup(index);

			} else {
				activeChildIndex = -1;
				//Поправка на рамки
				var bordersDiff = 1
				if ($scope.curItem.childItems.length > 1)
					bordersDiff = 2
				moveContainerBorders($scope.curItem, -bordersDiff)
					// var containerNewLeftPx = $scope.curItem.sizeInPx("left") - bordersDiff;
					// var containerNewTopPx = $scope.curItem.sizeInPx("top") - bordersDiff;
					// $scope.curItem.itemRef.left = containerNewLeftPx / presentationObject.curWidth * 100 + '%';
					// $scope.curItem.itemRef.top = containerNewTopPx / presentationObject.curHeight * 100 + '%';

				if ($scope.curItem.childItems.length > 1) {
					openFormatPopupText('group')
				} else {
					openFormatPopupText($scope.curItem.childItems[0].key, $scope.curItem.childItems[0].subKey)
						// showBestAreas(index);
					checkForArea();
				}

				if ($scope.curItem.childItems.length > 1) {
					for (var i in $scope.curItem.childItems) {
						if ($scope.curItem.childItems[i].key == 'textItem')
							$scope.curItem.childItems[i].textContainerCss["border"] = "1px #4b8fff solid";
						else 
							$scope.curItem.childItems[i].itemRef["border"] = "1px #4b8fff solid";
					}
				}
			}
			avoidBodyClick = false;

			//---запоминаем высоту, ширину и количество символов
			searchObject[$scope.curActiveSlide].savedHeight = $scope.curslide.items[curActiveItem].itemRef.height;
			searchObject[$scope.curActiveSlide].savedWidth = $scope.curslide.items[curActiveItem].itemRef.width;

			searchObject[$scope.curActiveSlide].curActiveStringLength = $scope.curslide.items[curActiveItem].childItems[0].value.length;
		}

		function saveItemSelection(instanceId) {
			try {
				var editor = CKEDITOR.instances[instanceId];

				var sel = editor.getSelection();
				selectionRanges = sel.getRanges(); // CKEDITOR.dom.rangeList instance.

				restoreSelection();

				// if (range) {
				// 	range.selectNodeContents(editor.editable());
				// 	editor.getSelection().selectRanges([range]);
				// }


			} catch (e) {}
		}

		function restoreSelection() {
			var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
			try {
				var editor = CKEDITOR.instances[instanceId];

				// var sel = editor.getSelection();
				// selectionRanges = sel.getRange(); // CKEDITOR.dom.rangeList instance.


				if (selectionRanges) {
					// range.selectNodeContents(editor.editable());
					editor.getSelection().selectRanges(selectionRanges);
				}


			} catch (e) {}
		}

		// function deleteNewAddedItem(id) {
		// 	$scope.curItem.childItems.splice(id, 1);
		// 	resizeItemContainer($scope.curItem, true);
		// }

		$scope.imageItemClick = function(index) {
			tmpTextItemNumber = -1;
			tmpImageItemNumber = index;
		}

		$scope.textClick = function(index) {
			tmpImageItemNumber = -1;
			if (tmpTextItemNumber === index)
				firstItemClick = false;
			else
				firstItemClick = true;
			tmpTextItemNumber = index;

		}

		var keyDown = false;

		$scope.textareaKeyDown = function(keyEvent, index) {
			if (keyDown)
				return
			var prevChildWidthPx = $scope.curItem.curActiveChildItem.sizeInPx($scope.curItem, 'width');
			var containerWidth = $scope.curItem.sizeInPx('width');

			var right = parseFloat($scope.curItem.itemRef.width) + parseFloat($scope.curItem.itemRef.left);
			var maxRightPercent = 100 - 2 * baseLineSize / presentationObject.curWidth;

			if (right > maxRightPercent)
				return

			DOMElement.attr('style', '');
			DOMElement.html('');
			var prevItemWidth = $scope.curItem.curActiveChildItem.css.width;
			$scope.curItem.curActiveChildItem.css.width = '';
			DOMElement.css($scope.curItem.curActiveChildItem.css);
			$scope.curItem.curActiveChildItem.css.width = prevItemWidth;

			DOMElement.html($scope.curItem.curActiveChildItem.value);

			var contentChildWidth = parseFloat(DOMElement.width());

			DOMElement.html('W');
			tmpWidth = parseFloat(DOMElement.width());

			var newWidth = (prevChildWidthPx + tmpWidth) / presentationObject.curWidth * 100 + '%';
			var newRight = parseFloat($scope.curItem.itemRef.left) + parseFloat(newWidth);

			if (newRight > maxRightPercent)
				return

			DOMElement.attr('style', '');
			DOMElement.html('');
			var canIncreaseWidth = true;
			if (contentChildWidth + tmpWidth < prevChildWidthPx)
				canIncreaseWidth = false;

			if (canIncreaseWidth && !$scope.curItem.preventAutoResize) {
				var newWidth = prevChildWidthPx + tmpWidth;
				var curChildWidthPx = $scope.curItem.curActiveChildItem.sizeInPx($scope.curItem, 'width');
				$scope.curItem.curActiveChildItem.itemRef.width = newWidth / containerWidth * 100 + '%';
			}

			keyDown = true;
		}

		$scope.textareaKeyUp = function(keyEvent, index) {
			keyDown = false;
		}

		var textWasChanged = false;

		$scope.textChange = function(index) {
			if ($scope.curItem) {
				var prevChildLeftPx = parseFloat($scope.curItem.curActiveChildItem.itemRef.left) * $scope.curItem.sizeInPx('width') / 100;
				var prevContainerWidth = $scope.curItem.itemRef.width;
				var prevChildWidth = $scope.curItem.curActiveChildItem.itemRef.width;
				resizeItemContainer($scope.curItem, true);
				$scope.curItem.curActiveChildItem.itemRef.left = prevChildLeftPx / $scope.curItem.sizeInPx('width') * 100 + '%';
				var right = parseFloat($scope.curItem.itemRef.width) + parseFloat($scope.curItem.itemRef.left);

				var maxRightPercent = 100 - baseLineSize / presentationObject.curWidth;

				if (right > maxRightPercent) {
					// $scope.curItem.itemRef.width = parseFloat(prevContainerWidth) + '%';
					// $scope.curItem.curActiveChildItem.itemRef.width = prevChildWidth;
					// resizeItemContainer($scope.curItem, false);
					// // $scope.curItem.itemRef.width = parseFloat(prevContainerWidth) + '%';
					// $scope.curItem.curActiveChildItem.css.width = "100%";
					if (!$scope.curItem.curActiveChildItem.preventAutoResize) {
						$scope.curItem.itemRef.width = parseFloat(prevContainerWidth) + '%';
						$scope.curItem.curActiveChildItem.itemRef.width = prevChildWidth;
						resizeItemContainer($scope.curItem, false);
						// $scope.curItem.itemRef.width = parseFloat(prevContainerWidth) + '%';
						$scope.curItem.curActiveChildItem.css.width = "100%";
						$scope.curItem.curActiveChildItem.preventAutoResize = true;
					}
				}
				var bordersPercentWidth = parseFloat(bordersSize) / presentationObject.curWidth * 100;
				$scope.curItem.itemRef.width = parseFloat($scope.curItem.itemRef.width) + bordersPercentWidth + '%';

				var containerBottomPx = $scope.curItem.sizeInPx('top') + $scope.curItem.sizeInPx('height');
				if (containerBottomPx >= presentationObject.curHeight) {
					var diff = containerBottomPx - presentationObject.curHeight;
					var newContainerTop = $scope.curItem.sizeInPx('top') - diff;
					$scope.curItem.itemRef.top = newContainerTop / presentationObject.curHeight * 100 + '%';
					moveTextEtitPopup(index);
				}
				//----если автоверстка включена
				var text = $($scope.curslide.items[curActiveItem].childItems[0].value).text();
				if (presentationObject.autoLayoutTurnOn && text.length != searchObject[$scope.curActiveSlide].curActiveStringLength) {
					setChangesOfTextToBlocksModel();
					searchObject[$scope.curActiveSlide].curActiveStringLength = text.length;
				}
			}
		}

		//---фиксирует изменения текста для модели блоков
		function setChangesOfTextToBlocksModel() {

			var changingBlockIndex = 0;
			//---находим изменяющийся блок
			for (var indexBlock in Blocks[$scope.curActiveSlide]) {
				for (var indexElement in $scope.curslide.items) {
					if (parseFloat(Blocks[$scope.curActiveSlide][indexBlock].elements[indexElement]) == curActiveItem) {
						changingBlockIndex = indexBlock;
					}
				}
			}

			Blocks[$scope.curActiveSlide][changingBlockIndex].width = $scope.curslide.items[curActiveItem].itemRef.width;

			if (searchObject[$scope.curActiveSlide].sumOfColumnsWidth > 0) {
				searchObject[$scope.curActiveSlide].sumOfColumnsWidth = searchObject[$scope.curActiveSlide].sumOfColumnsWidth - parseFloat(searchObject[$scope.curActiveSlide].savedWidth);
			}

			searchObject[$scope.curActiveSlide].sumOfColumnsWidth = searchObject[$scope.curActiveSlide].sumOfColumnsWidth + parseFloat($scope.curslide.items[curActiveItem].itemRef.width);

			if (Blocks[$scope.curActiveSlide][changingBlockIndex].height != parseFloat(searchObject[$scope.curActiveSlide].savedHeight)) {
				Blocks[$scope.curActiveSlide][changingBlockIndex].height = Blocks[$scope.curActiveSlide][changingBlockIndex].height + parseFloat(searchObject[$scope.curActiveSlide].savedHeight);
			}

			Blocks[$scope.curActiveSlide][changingBlockIndex].height = Blocks[$scope.curActiveSlide][changingBlockIndex].height - parseFloat($scope.curslide.items[curActiveItem].itemRef.height);

			searchObject[$scope.curActiveSlide].savedWidth = $scope.curslide.items[curActiveItem].itemRef.width; //запоминаем ширину
			searchObject[$scope.curActiveSlide].savedHeight = $scope.curslide.items[curActiveItem].itemRef.height; //запоминаем высоту

			textWasChanged = true;
		}

		// $scope.textSelecting = function() { //Выделенеи текста
		// 	$scope.lassoEnable.enable = false;
		// }

		$scope.textMouseDown = function(event, index) {
			// if ($scope.curItem){
			// 	if ($scope.curItem.active)
			// 		event.preventDefault();
			//}
		}

		$scope.bkgColorTextChainge = function() {
			changeBkg('red', 'textEditor' + $scope.curActiveSlide + '' + curActiveItem + '' + tmpTextItemNumber)
		}

		$scope.textCase = function(command) {
			// var instanceId = 'textEditor' + $scope.curActiveSlide + '' + curActiveItem + '' + tmpTextItemNumber;
			var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
			var editor = CKEDITOR.instances[instanceId];
			var curText = editor.getSelection().getSelectedText();

			var sel = editor.getSelection();
			var selectionRanges = sel.getRanges();

			switch (command) {
				case 'upper':
					editor.insertText(curText.toUpperCase());
					break;
				case 'lower':
					editor.insertText(curText.toLowerCase());
					break;
				case 'normal':
					curText = curText.toLowerCase();
					editor.insertText(curText.charAt(0).toUpperCase() + curText.substr(1));
					break;
			}

			editor.getSelection().selectRanges(selectionRanges);
			resizeItemContainer($scope.curItem, true);

		}

		$scope.getTextCaseStyles = function(type) {
			if (!$scope.curItem)
				return;
			if (!$scope.curItem.curActiveChildItem)
				return;

			if ($scope.curItem.curActiveChildItem.key != 'textItem')
				return

			var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
			var editor = CKEDITOR.instances[instanceId];
			var curText = editor.getSelection().getSelectedText();

			var pattern;
			var checked = true;
			if (curText.length == 0)
				return '';

			for (var k in curText) {
				var curLetter = curText[k];
				var expr = new RegExp('[^A-Za-zА-Яа-я]', "");
				if (expr.test(curLetter))
					continue
				switch (type) {
					case 'upper':
						pattern = '^[A-Z]|[А-Я]$';
						break;
					case 'lower':
						pattern = '^[a-z]|[а-я]$';
						break;
					case 'normal':
						if (k == 0)
							pattern = '^[A-Z]|[А-Я]$';
						else
							pattern = '^[a-z]|[а-я]$';
						break;
				}
				expr = new RegExp(pattern, "");
				if (!expr.test(curLetter)) {
					checked = false;
				}
			}



			if (checked)
				return 'threeButtonsInOneLine_active';
			else
				return '';
		}


		//Используется для отображения наилучших областей, index - номер текущего активного элемента (если объект null, то игнициализировать его заново)
		// function showBestAreas(index) {
		// 	if (!$scope.curItem) {
		// 		$scope.curItem = $scope.curslide.items[index];
		// 		curActiveItem = index
		// 	}

		// 	if ($scope.showedAreas.length > 0)
		// 		hideAreas();

		// 	if ((!$scope.curItem.inArea) && ($scope.curItem.showAreas)) {
		// 		for (var area in $scope.curItem.bestAreas) {
		// 			$scope.showedAreas.push($scope.curItem.bestAreas[area])
		// 		}
		// 	}
		// }

		//Используется для сокрытия лучших областей
		function hideAreas() {
			$scope.showedAreas = [];
		}

		var startPositionObj = new Object();

		//http://habrahabr.ru/sandbox/80139/
		$scope.dragstart = function(index) {
			if (curActiveItem != index)
				itemClick(index);
			$scope.lassoEnable.enable = false;
			$scope.curItem.selectable = false;
			//angular.element('.editTextPopup').css('display', 'none');
			$scope.showTextFormatPopup = false;

			//Сохраняем состояние до перетаскивания
			var tmpLogObj = new logObj($scope.curActiveSlide + '_' + curActiveItem, $scope.curItem, 'move');
			presentationObject.addLog(tmpLogObj);

			//-----запоминаем координаты для прощения ошибок--------
			startPositionObj.topInPX = presentationObject.curHeight * parseFloat($scope.curslide.items[index].itemRef.top) / 100;
			startPositionObj.leftInPX = presentationObject.curWidth * parseFloat($scope.curslide.items[index].itemRef.left) / 100;
			// startPositionObj.top = $scope.curslide.items[index].itemRef.top;
			// startPositionObj.left = $scope.curslide.items[index].itemRef.left;
			//------------------------------------------------------

			$scope.curItem.inArea = false;
			// showBestAreas(index);
			avoidBodyClick = false;
		};


//**************************************   НАПРАВЛЯЮЩИЕ ***********************************

	//-------конструктор для горизонтальных линий
	horizontalLine = function() {
		return {
			width:"100%",
			height:"1px",
			top:0
		}
	}

	//-------конструктор для вертикальных линий
	verticalLine = function() {
		return {
			width:"1px",
			height:"100%",
			left:0
		}
	}

	//-------конструктор для прямоугольника
	squareLine = function() {
		return {
			width: 100 - 2 * searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%',
			height: 100 - 2 * searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%',
			top: searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%',
			left: searchObject[$scope.curActiveSlide].baseLineSizeInPercent + '%'
		}
	}

	//---двигаем элемент
	$scope.dragItem = function(index) {

		moveTextEtitPopup(index);
		checkForArea();
		callAllHelperLinesGuards();
	}

	//----устанавливает ширину для горизонтальных направляющих
	function setBordersForHorizontalHelperLines(object, leftElement, leftDragged) {
		if(leftDragged >= leftElement) {
			object.left = leftElement + '%';
			object.width =  leftDragged + parseFloat($scope.curItem.itemRef.width) - leftElement + '%';
		} else {
			object.left = leftDragged + '%';
			object.width = leftElement + parseFloat($scope.curItem.itemRef.width) - leftDragged + '%';
		}
	}

	//----устанавливает высоту для вертикальных направляющих
	function setBordersForVerticalHelperLines(object, topElement, topDragged) {
		if(topDragged >= topElement) {
			object.top = topElement + '%';
			object.height =  topDragged + parseFloat($scope.curItem.itemRef.height) - topElement + '%';
		} else {
			object.top = topDragged + '%';
			object.height = topElement + parseFloat($scope.curItem.itemRef.height) - topDragged + '%';
		}
	}

	//---создаёт направляющие элементов
	function setHelperLinesOfElements(topsOfDraggedItem, leftsOfDraggedItem) {

		var koef = 0.5;

		for(var indexElement in $scope.curslide.items) {
			if(indexElement != curActiveItem) {

				var bottom = parseFloat($scope.curslide.items[indexElement].itemRef.top) + parseFloat($scope.curslide.items[indexElement].itemRef.height);

				var middleTop = parseFloat($scope.curslide.items[indexElement].itemRef.top) + parseFloat($scope.curslide.items[indexElement].itemRef.height) / 2;

				var right = parseFloat($scope.curslide.items[indexElement].itemRef.left) + parseFloat($scope.curslide.items[indexElement].itemRef.width);

				var middleLeft = parseFloat($scope.curslide.items[indexElement].itemRef.left) + parseFloat($scope.curslide.items[indexElement].itemRef.width) / 2;

				for(var indexDragged in topsOfDraggedItem) {

					if(parseFloat($scope.curslide.items[indexElement].itemRef.top) + koef >= topsOfDraggedItem[indexDragged] && parseFloat($scope.curslide.items[indexElement].itemRef.top) - koef <= topsOfDraggedItem[indexDragged]) {

						var newLine = new horizontalLine();
						newLine.top = $scope.curslide.items[indexElement].itemRef.top;

						setBordersForHorizontalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.left), leftsOfDraggedItem[0]);

						$scope.lineHelpersArray.push(newLine);
						autoBring($scope.curslide.items[indexElement].itemRef.top, null);
					}

					if(bottom + koef >= topsOfDraggedItem[indexDragged] && bottom - koef <= topsOfDraggedItem[indexDragged]) {
						var newLine = new horizontalLine();
						newLine.top = bottom + '%';

						setBordersForHorizontalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.left), leftsOfDraggedItem[0]);

						$scope.lineHelpersArray.push(newLine);
						autoBring(bottom, null);
					}

					if(middleTop + koef >= topsOfDraggedItem[indexDragged] && middleTop - koef <= topsOfDraggedItem[indexDragged]) {
						var newLine = new horizontalLine();
						newLine.top = middleTop + '%';

						setBordersForHorizontalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.left), leftsOfDraggedItem[0]);

						$scope.lineHelpersArray.push(newLine);
						autoBring(middleTop, null);
					}
				}

				for(var indexDragged in leftsOfDraggedItem) {

					if(parseFloat($scope.curslide.items[indexElement].itemRef.left) + koef >= leftsOfDraggedItem[indexDragged] && parseFloat($scope.curslide.items[indexElement].itemRef.left) - koef <= leftsOfDraggedItem[indexDragged]) {
						var newLine = new verticalLine();
						newLine.left = $scope.curslide.items[indexElement].itemRef.left;

						setBordersForVerticalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.top), topsOfDraggedItem[0]);

						$scope.lineHelpersArray.push(newLine);
						autoBring(null, $scope.curslide.items[indexElement].itemRef.left);
					}

					if(right + koef >= leftsOfDraggedItem[indexDragged] && right - koef <= leftsOfDraggedItem[indexDragged]) {
						var newLine = new verticalLine();
						newLine.left = right + '%';

						setBordersForVerticalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.top), topsOfDraggedItem[0]);

						$scope.lineHelpersArray.push(newLine);
						autoBring(null, right);
					}

					if(middleLeft + koef >= leftsOfDraggedItem[indexDragged] && middleLeft - koef <= leftsOfDraggedItem[indexDragged]) {
						var newLine = new verticalLine();
						newLine.left = middleLeft + '%';

						setBordersForVerticalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.top), topsOfDraggedItem[0]);

						$scope.lineHelpersArray.push(newLine);
						autoBring(null, middleLeft);
					}
				}
			}
		}
	}

	//----создаёт срединные линии слайда
	function setMiddleHelperLines(middleTopOfDraggedElement, middleLeftOfDraggedElement) {

		var koef = 0.5;

		if(50 + koef >= middleTopOfDraggedElement && 50 - koef <= middleTopOfDraggedElement) {
			var newEqualHorizontalLine = new horizontalLine();
			newEqualHorizontalLine.top = middleTopOfDraggedElement + '%';
			$scope.lineEqualHelpersArray.push(newEqualHorizontalLine);

			var newSquare = new squareLine();
			$scope.squareArray.push(newSquare);

			autoBring(middleTopOfDraggedElement, null);
		}

		if(50 + koef >= middleLeftOfDraggedElement && 50 - koef <= middleLeftOfDraggedElement) {
			var newEqualVerticalLine = new verticalLine();
			newEqualVerticalLine.left = middleLeftOfDraggedElement + '%';
			$scope.lineEqualHelpersArray.push(newEqualVerticalLine);

			var newSquare = new squareLine();
			$scope.squareArray.push(newSquare);

			autoBring(null, middleLeftOfDraggedElement);
		}
	}

	//----автодоводка
	function autoBring(broughtTop, broughtLeft) {
		if(presentationObject.autoBringTurnOn) {
			if(broughtTop != null) {
				$scope.bigCoords.top = broughtTop + '%';
				// console.log("TOO = ", $scope.bigCoords.top);
			}
			if(broughtLeft != null) {
				$scope.bigCoords.left = broughtLeft + '%';
			}
		}
	}

	//----создаёт квадрат при подведении элемента к границам слайда
	function setSquareHelperOnBorders(topBottomOfDraggedElement, leftRightOfDraggedElement) {
		
		var koef = 0.5;
		var baseLine = searchObject[$scope.curActiveSlide].baseLineSizeInPercent;

		for(var indexDragged in topBottomOfDraggedElement) {
			if ((baseLine + koef >= topBottomOfDraggedElement[indexDragged] && baseLine - koef <= topBottomOfDraggedElement[indexDragged]) || (100 - baseLine + koef >= topBottomOfDraggedElement[indexDragged] && 100 - baseLine - koef <= topBottomOfDraggedElement[indexDragged])) {
				var newSquare = new squareLine();
				$scope.squareArray.push(newSquare);
			}
		}

		for(var indexDragged in leftRightOfDraggedElement) {
			if ((baseLine + koef >= leftRightOfDraggedElement[indexDragged] && baseLine - koef <= leftRightOfDraggedElement[indexDragged]) || (100 - baseLine + koef >= leftRightOfDraggedElement[indexDragged] && 100 - baseLine - koef <= leftRightOfDraggedElement[indexDragged])) {
				var newSquare = new squareLine();
				$scope.squareArray.push(newSquare);
			}
		}

	}

	//***************ГОРИЗОНТАЛЬНЫЕ СТРЕЛКИ*************
	//-----создаёт горизонтальные стрелки между элементами
	function findClosestHorizontal() {

		if($scope.savedLeft != parseFloat($scope.curItem.itemRef.left) && $scope.curslide.items.length > 1) {

			var indexMinLeft = curActiveItem;
			var indexMaxLeft = curActiveItem;

			var closestDisFromLeft = 100;
			var closestLeft,
				koef = 0.5;

			//----проверка на наличие ближайшего элемента слева для перетаскиваемого элемента
			//----находим ближайшее расстояние до левого элемента для перетаскиваемого элемента
			for(var indexElement in $scope.curslide.items) {
				if(indexElement != curActiveItem) {
					//ищем минимальный left
					if(parseFloat($scope.curslide.items[indexMinLeft].itemRef.left) > parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
						indexMinLeft = indexElement;
					}
					//ищем мах left
					if(parseFloat($scope.curslide.items[indexMaxLeft].itemRef.left) < parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
						indexMaxLeft = indexElement;
					}
					//ближайшие элементы слева
					if(parseFloat($scope.curslide.items[curActiveItem].itemRef.left) > parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
						var tmpDis = parseFloat($scope.curslide.items[curActiveItem].itemRef.left) - parseFloat($scope.curslide.items[indexElement].itemRef.left) - parseFloat($scope.curslide.items[indexElement].itemRef.width);

						closestDisFromLeft = (closestDisFromLeft > tmpDis) ? tmpDis : closestDisFromLeft;
						var closestIndexFromLeft = indexElement;
					}
				}
			}
			//---линия для минимального left
			if(parseFloat($scope.curslide.items[indexMinLeft].itemRef.left) + koef >= closestDisFromLeft && parseFloat($scope.curslide.items[indexMinLeft].itemRef.left) - koef <= closestDisFromLeft) {

				var horLine = new horizontalLine();
				horLine.top = parseFloat($scope.curslide.items[indexMinLeft].itemRef.top) + parseFloat($scope.curslide.items[indexMinLeft].itemRef.height) / 2 + '%';
				horLine.left = 0;
				horLine.width = closestDisFromLeft + '%';
				$scope.lineEqualHelpersArray.push(horLine);

				createLine(closestIndexFromLeft, closestDisFromLeft, "horizontal");
			}
			//---линия для максимального left
			var disToBorderFromMaxLeft = 100 - parseFloat($scope.curslide.items[indexMaxLeft].itemRef.left) - parseFloat($scope.curslide.items[indexMaxLeft].itemRef.width);
			if(disToBorderFromMaxLeft + koef >= closestDisFromLeft && disToBorderFromMaxLeft - koef <= closestDisFromLeft) {

				createLine(indexMaxLeft, disToBorderFromMaxLeft, "horizontal");

				createLine(closestIndexFromLeft, closestDisFromLeft, "horizontal");
			}
			
			createHorizontalLinesFromLeft(indexMinLeft, closestDisFromLeft, closestIndexFromLeft);

			// createHorizontalLinesFromRight(indexMaxLeft, closestDisFromLeft, closestIndexFromLeft);
		}
	}

	//---нахождение ближ. расстояния до левого элемента для взятого объекта
	function createHorizontalLinesFromLeft(indexMin, closestDis, closestIndexFromLeftForDragged) {

		var koef = 0.5;

		for(var indexTaken in $scope.curslide.items) {
			if(indexTaken != curActiveItem) {

				var closestDisFromLeftForElement = 100;
				var closestIndexFromLeftForElement;

				for(var indexElement in $scope.curslide.items) {
					if(indexElement != indexTaken) {
						//ближайшие элементы слева
						if(parseFloat($scope.curslide.items[indexTaken].itemRef.left) > parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
							var tmpDis = parseFloat($scope.curslide.items[indexTaken].itemRef.left) - parseFloat($scope.curslide.items[indexElement].itemRef.left) - parseFloat($scope.curslide.items[indexElement].itemRef.width);

							closestDisFromLeftForElement = (closestDisFromLeftForElement > tmpDis) ? tmpDis : closestDisFromLeftForElement;
							closestIndexFromLeftForElement = indexElement;
						}
					}
				}
				//---линия для left
				if(closestDis + koef >= closestDisFromLeftForElement && closestDis - koef <= closestDisFromLeftForElement ) {
					createLine(closestIndexFromLeftForElement, closestDisFromLeftForElement, "horizontal");
					createLine(closestIndexFromLeftForDragged, closestDis, "horizontal");
				}
			}
		}
	}

	//---нахождение ближ. расстояния до правого элемента для взятого объекта
	function createHorizontalLinesFromRight(indexMax, closestDis, closestIndexFromLeftForDragged) {

		var koef = 0.5;
		
		for(var indexTaken in $scope.curslide.items) {
			if(indexTaken != curActiveItem) {

				var closestDisFromRightForElement = 100;
				var closestIndexFromRightForElement;

				for(var indexElement in $scope.curslide.items) {
					if(indexElement != indexTaken) {
						//ближайшие элементы справа
						if(parseFloat($scope.curslide.items[indexTaken].itemRef.left) < parseFloat($scope.curslide.items[indexElement].itemRef.left)) {
							var tmpDis = parseFloat($scope.curslide.items[indexElement].itemRef.left) - parseFloat($scope.curslide.items[indexTaken].itemRef.left) - parseFloat($scope.curslide.items[indexTaken].itemRef.width);

							closestDisFromRightForElement = (closestDisFromRightForElement > tmpDis) ? tmpDis : closestDisFromRightForElement;
							closestIndexFromRightForElement = indexElement;
						}
					}
				}
				//---линия для right
				if(closestDis + koef >= closestDisFromRightForElement && closestDis - koef <= closestDisFromRightForElement ) {
					createLine(closestIndexFromRightForElement, closestDisFromRightForElement, "horizontal");
					createLine(closestIndexFromLeftForDragged, closestDis, "horizontal");
				}
			}
		}
	}
	//**************************************************

	//***************ВЕРТИКАЛЬНЫЕ СТРЕЛКИ***************
	//-----создаёт вертикальные стрелки между элементами
	function findClosestVertical() {

		if($scope.savedTop != parseFloat($scope.curItem.itemRef.top) && $scope.curslide.items.length > 1) {

			var indexMinTop = curActiveItem;
			var indexMaxTop = curActiveItem;

			var closestDisFromTop = 100;
			var closestTop,
				koef = 0.5;

			//----проверка на наличие ближайшего элемента слева для перетаскиваемого элемента
			//----находим ближайшее расстояние до левого элемента для перетаскиваемого элемента
			for(var indexElement in $scope.curslide.items) {
				if(indexElement != curActiveItem) {
					//ищем минимальный top
					if(parseFloat($scope.curslide.items[indexMinTop].itemRef.top) > parseFloat($scope.curslide.items[indexElement].itemRef.top)) {
						indexMinTop = indexElement;
					}
					//ищем мах top
					if(parseFloat($scope.curslide.items[indexMaxTop].itemRef.top) < parseFloat($scope.curslide.items[indexElement].itemRef.top)) {
						indexMaxTop = indexElement;
					}
					//ближайшие элементы сверху
					if(parseFloat($scope.curslide.items[curActiveItem].itemRef.top) > parseFloat($scope.curslide.items[indexElement].itemRef.top)) {
						var tmpDis = parseFloat($scope.curslide.items[curActiveItem].itemRef.top) - parseFloat($scope.curslide.items[indexElement].itemRef.top) - parseFloat($scope.curslide.items[indexElement].itemRef.height);

						closestDisFromTop = (closestDisFromTop > tmpDis) ? tmpDis : closestDisFromTop;
						var closestIndexFromTop = indexElement;
					}
				}
			}
			//---линия для минимального top
			if(parseFloat($scope.curslide.items[indexMinTop].itemRef.top) + koef >= closestDisFromTop && parseFloat($scope.curslide.items[indexMinTop].itemRef.top) - koef <= closestDisFromTop) {

				var verLine = new verticalLine();
				verLine.top = 0;
				verLine.left = parseFloat($scope.curslide.items[indexMinTop].itemRef.left) + parseFloat($scope.curslide.items[indexMinTop].itemRef.width) / 2 + '%';
				verLine.height = closestDisFromTop + '%';
				$scope.lineEqualHelpersArray.push(verLine);

				createLine(closestIndexFromTop, closestDisFromTop, "vertical");
			}
			//---линия для максимального top
			var disToBorderFromMaxTop = 100 - parseFloat($scope.curslide.items[indexMaxTop].itemRef.top) - parseFloat($scope.curslide.items[indexMaxTop].itemRef.height);
			if(disToBorderFromMaxTop + koef >= closestDisFromTop && disToBorderFromMaxTop - koef <= closestDisFromTop) {

				createLine(indexMaxTop, disToBorderFromMaxTop, "vertical");

				createLine(closestIndexFromTop, closestDisFromTop, "vertical");
			}
			
			createHorizontalLinesFromTop(closestDisFromTop, closestIndexFromTop);

			// createHorizontalLinesFromRight(indexMaxTop, closestDisFromTop, closestIndexFromTop);
		}
	}

	//---нахождение ближ. расстояния до левого элемента для взятого объекта
	function createHorizontalLinesFromTop(closestDis, closestIndexFromTopForDragged) {

		var koef = 0.5;

		for(var indexTaken in $scope.curslide.items) {
			if(indexTaken != curActiveItem) {

				var closestDisFromTopForElement = 100;
				var closestIndexFromTopForElement;

				for(var indexElement in $scope.curslide.items) {
					if(indexElement != indexTaken) {
						//ближайшие элементы слева
						if(parseFloat($scope.curslide.items[indexTaken].itemRef.top) > parseFloat($scope.curslide.items[indexElement].itemRef.top)) {
							var tmpDis = parseFloat($scope.curslide.items[indexTaken].itemRef.top) - parseFloat($scope.curslide.items[indexElement].itemRef.top) - parseFloat($scope.curslide.items[indexElement].itemRef.height);

							closestDisFromTopForElement = (closestDisFromTopForElement > tmpDis) ? tmpDis : closestDisFromTopForElement;
							closestIndexFromTopForElement = indexElement;
						}
					}
				}
				//---линия для Top
				if(closestDis + koef >= closestDisFromTopForElement && closestDis - koef <= closestDisFromTopForElement ) {
					createLine(closestIndexFromTopForElement, closestDisFromTopForElement, "vertical");
					createLine(closestIndexFromTopForDragged, closestDis, "vertical");
				}
			}
		}
	}

	//**************************************************

	//----создаёт стрелки
	function createLine(index, distance, type) {
		if(type == "horizontal") {

			var horLine = new horizontalLine();
			horLine.top = parseFloat($scope.curslide.items[index].itemRef.top) + parseFloat($scope.curslide.items[index].itemRef.height) / 2 + '%';
			horLine.left = parseFloat($scope.curslide.items[index].itemRef.left) + parseFloat($scope.curslide.items[index].itemRef.width) + '%';
			horLine.width = distance + '%';
			$scope.lineEqualHelpersArray.push(horLine);

		} else if(type == "vertical") {

			var verLine = new verticalLine();
			verLine.top = parseFloat($scope.curslide.items[index].itemRef.top) + parseFloat($scope.curslide.items[index].itemRef.height) + '%';
			verLine.left = parseFloat($scope.curslide.items[index].itemRef.left) + parseFloat($scope.curslide.items[index].itemRef.width) / 2 + '%';
			verLine.height = distance + '%';
			$scope.lineEqualHelpersArray.push(verLine);
		}
	}

	//создаёт линии одинаковых расстояний
	function setDistances(middleTopOfDraggedElement, leftsOfDraggedItem) {

		var koef = 0.5;

		if($scope.savedLeft != parseFloat($scope.curItem.itemRef.left) && $scope.curslide.items.length > 1) { //изменение только по горизонтали
			for(var indexElement in $scope.curslide.items) {
				if(indexElement != curActiveItem) {

					var middleTopOfTaken = parseFloat($scope.curslide.items[indexElement].itemRef.top) + parseFloat($scope.curslide.items[indexElement].itemRef.height) / 2;

					if(leftsOfDraggedItem[0] < parseFloat($scope.curslide.items[indexElement].itemRef.left)) { //перетаскиваемый элемент левее рассматриваемого
						var distanceOfLineOfDragging = leftsOfDraggedItem[0];
						var middleOfLineOfDragging = middleTopOfDraggedElement + '%';
						var leftOfLineOfDragging = 0 + '%';

						var middleTopOfLineOfTaken = middleTopOfTaken + '%';
						var leftOfLineOfTaken = parseFloat($scope.curslide.items[indexElement].itemRef.left) + parseFloat($scope.curslide.items[indexElement].itemRef.width) + '%';
						var distanceOfLineOfTaken = 100 - parseFloat($scope.curslide.items[indexElement].itemRef.left) - parseFloat($scope.curslide.items[indexElement].itemRef.width);

					} else if(leftsOfDraggedItem[0] > parseFloat($scope.curslide.items[indexElement].itemRef.left)) {

						var distanceOfLineOfDragging = parseFloat($scope.curslide.items[indexElement].itemRef.left);
						var middleOfLineOfDragging = middleTopOfTaken + '%';
						var leftOfLineOfDragging = 0 + '%';

						var middleTopOfLineOfTaken = middleTopOfDraggedElement + '%';
						var leftOfLineOfTaken = leftsOfDraggedItem[1] + '%';
						var distanceOfLineOfTaken = 100 - leftsOfDraggedItem[1];

					}

					//------------------
					if(distanceOfLineOfTaken + koef >= distanceOfLineOfDragging && distanceOfLineOfTaken - koef <= distanceOfLineOfDragging) {

						var horizontalLineOfDragging = new horizontalLine();

						horizontalLineOfDragging.top = middleOfLineOfDragging + '%';
						horizontalLineOfDragging.left = leftOfLineOfDragging;
						horizontalLineOfDragging.width = distanceOfLineOfDragging + '%';
						$scope.lineEqualHelpersArray.push(horizontalLineOfDragging);

						var newHorizontalLine = new horizontalLine();

						newHorizontalLine.top = middleTopOfLineOfTaken;
						newHorizontalLine.left = leftOfLineOfTaken;
						newHorizontalLine.width = distanceOfLineOfTaken + '%';

						$scope.lineEqualHelpersArray.push(newHorizontalLine);
					}
				}
			}
		}
	}

	//основная функция вызывающие доп-е функции направляющих
	function callAllHelperLinesGuards() {
		if(presentationObject.lineHelpersTurnOn) {
			var topsOfDraggedItem = new Array();
			var leftsOfDraggedItem = new Array();

			$scope.lineHelpersArray = [];
			$scope.squareArray = [];
			$scope.lineEqualHelpersArray = [];

			topsOfDraggedItem = [];
			topsOfDraggedItem[0] = parseFloat($scope.curItem.itemRef.top);
			topsOfDraggedItem[1] = topsOfDraggedItem[0] + parseFloat($scope.curItem.itemRef.height);
			topsOfDraggedItem[2] = topsOfDraggedItem[0] + parseFloat($scope.curItem.itemRef.height) / 2;

			leftsOfDraggedItem = [];
			leftsOfDraggedItem[0] = parseFloat($scope.curItem.itemRef.left);
			leftsOfDraggedItem[1] = leftsOfDraggedItem[0] + parseFloat($scope.curItem.itemRef.width);
			leftsOfDraggedItem[2] = leftsOfDraggedItem[0] + parseFloat($scope.curItem.itemRef.width) / 2;

			setMiddleHelperLines(topsOfDraggedItem[2], leftsOfDraggedItem[2]); //срединные направляющие
			setHelperLinesOfElements(topsOfDraggedItem, leftsOfDraggedItem); // направляющие элементов
			setSquareHelperOnBorders(topsOfDraggedItem, leftsOfDraggedItem); //прямоугольник
			setDistances(topsOfDraggedItem[2], leftsOfDraggedItem);

			findClosestHorizontal();
			findClosestVertical();
		}
	}


	//*********************************************************************************************



		//перемещение popup редактирования текста
		function moveTextEtitPopup(index) {
			var itemTop, itemLeft;

			var containerTop = $scope.curItem.itemRef.top;
			var containerLeft = $scope.curItem.itemRef.left;

			if (typeof containerTop == "string")
				if ((containerTop.indexOf("%") != -1)) {
					containerTop = parseFloat(containerTop) * presentationObject.curHeight / 100;
				}

			if (typeof containerLeft == "string")
				if (containerLeft.indexOf("%") != -1) {
					containerLeft = parseFloat(containerLeft) * presentationObject.curWidth / 100;
				}


			if ($scope.curItem.curActiveChildItem) {
				itemTop = $scope.curItem.curActiveChildItem.itemRef.top;
				itemLeft = $scope.curItem.curActiveChildItem.itemRef.left;

				var containerHeight = $scope.curItem.itemRef.height;
				var containerWidth = $scope.curItem.itemRef.width;

				if (typeof containerHeight == "string")
					if ((containerHeight.indexOf("%") != -1)) {
						containerHeight = parseFloat(containerHeight) * presentationObject.curHeight / 100;
					}

				if (typeof containerWidth == "string")
					if (containerWidth.indexOf("%") != -1) {
						containerWidth = parseFloat(containerWidth) * presentationObject.curWidth / 100;
					}

				if (typeof itemTop == "string") {
					if ((itemTop.indexOf("%") != -1)) {
						itemTop = parseFloat(itemTop) * containerHeight / 100 + containerTop;
					}
				} else {
					itemTop = itemTop + containerTop;
				}

				if (typeof itemLeft == "string") {
					if (itemLeft.indexOf("%") != -1) {
						itemLeft = parseFloat(itemLeft) * containerWidth / 100 + containerLeft;
					}
				} else {
					itemLeft = itemLeft + containerLeft;
				}


			} else {
				itemTop = containerTop;
				itemLeft = containerLeft;
			}

			var top = itemTop - parseFloat($scope.textEditPopup.css('height')) - 15; //Поправка на высоту popup

			$scope.textEditPopup.css({
				'top': top / presentationObject.curHeight * 100 + '%',
				'left': itemLeft / presentationObject.curWidth * 100 + '%'
			});
		}

		function checkForArea() {
			var itemTmp = new Object();
			//Доделать области
			for (var i in $scope.showedAreas) {
				var curArea = new Object();

				curArea.top = parseFloat(mainSlide.css('height')) * parseFloat($scope.showedAreas[i].top) / 100;
				curArea.left = parseFloat(mainSlide.css('width')) * parseFloat($scope.showedAreas[i].left) / 100;
				curArea.right = curArea.left + parseFloat(mainSlide.css('width')) * parseFloat($scope.showedAreas[i].width) / 100;
				curArea.bottom = curArea.top + parseFloat(mainSlide.css('height')) * parseFloat($scope.showedAreas[i].height) / 100;

				itemTmp.top = parseFloat($scope.curItem.itemRef.top)
				itemTmp.left = parseFloat($scope.curItem.itemRef.left)


				if ((itemTmp.left > curArea.left - possibleAreaDif) && (itemTmp.left < curArea.right + possibleAreaDif) && (itemTmp.top > curArea.top - possibleAreaDif) && (itemTmp.top < curArea.bottom + possibleAreaDif)) {
					$scope.curItem.cssContainer["border"] = "1px " + borderColors.green + " solid";
					resizeHandler.css('background', borderColors.green);
					break;
				} else {
					$scope.curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
					resizeHandler.css('background', borderColors.red);
				}
			}
		}

		$scope.dragend = function(index) {
			$scope.preventItemClick = true;
			$scope.lassoEnable.enable = true;
			if ($scope.curItem)
				$scope.curItem.selectable = true;
			var itemTmp = new Object();
			var curArea = new Object();
			for (var i in $scope.showedAreas) {
				//Растягиванеи объекта на область, если он в ней
				curArea.top = parseFloat($scope.showedAreas[i].top);
				curArea.left = parseFloat($scope.showedAreas[i].left);
				curArea.right = curArea.left + parseFloat($scope.showedAreas[i].width);
				curArea.bottom = curArea.top + parseFloat($scope.showedAreas[i].height);
				curArea.width = parseFloat($scope.showedAreas[i].width);
				curArea.height = parseFloat($scope.showedAreas[i].height);
				itemTmp.top = parseFloat($scope.curItem.itemRef.top)
				itemTmp.left = parseFloat($scope.curItem.itemRef.left)

				if ((itemTmp.left > curArea.left - possibleAreaDif) && (itemTmp.left < curArea.right + possibleAreaDif) && (itemTmp.top > curArea.top - possibleAreaDif) && (itemTmp.top < curArea.bottom + possibleAreaDif)) {
					//Resize объекта по размерам поля
					$scope.curItem.inArea = true;
					$scope.curItem.itemRef.left = curArea.left + '%';
					$scope.curItem.itemRef.top = curArea.top + '%';
					$scope.curItem.itemRef.width = curArea.width + '%';
					$scope.curItem.itemRef.height = curArea.height + '%';
				}
			}

			//---------------------------------------------ПРОЩЕНИЕ ОШИБОК----------------------------------------------------------

			var endTop = presentationObject.curHeight * parseFloat($scope.curslide.items[index].itemRef.top) / 100;
			var endLeft = presentationObject.curWidth * parseFloat($scope.curslide.items[index].itemRef.left) / 100;

			if ((Math.abs(endTop - startPositionObj.topInPX) <= presentationObject.curHeight / 6) && (Math.abs(endLeft - startPositionObj.leftInPX) <= presentationObject.curWidth / 10)) {
				$scope.curslide.items[index].itemRef.top = startPositionObj.top;
				$scope.curslide.items[index].itemRef.left = startPositionObj.left;
			}

			moveTextEtitPopup(index);
			$scope.showTextFormatPopup = true;
			$scope.lassoEnable.enable = true;

			$scope.lineHelpersArray = []; // удаляем направляющие
			$scope.squareArray = []; // удаляем прямоугольник
			$scope.lineEqualHelpersArray = []; // удаляем схожие линии
		};

		var prevChildsSize = new Array();
		var prevContainerWidthPx, prevContainerHeightPx, prevContainerLeftPx, prevContainerTopPx, prevContainerBottomPx;

		$scope.resizestart = function(index) {
			$scope.curItem.preventDrag = true;
			$scope.curItem.preventAutoResize = true; //Запретить автоматиеческое изменение размера рамки (высоты) из-за того, что пользователь сам изменил размер
			$scope.preventItemClick = true;

			for (var k in $scope.curItem.childItems) {
				prevChildsSize.push(clone($scope.curItem.childItems[k].itemRef));
			}
			prevContainerWidthPx = $scope.curItem.sizeInPx('width');
			prevContainerHeightPx = $scope.curItem.sizeInPx('height');
			prevContainerLeftPx = $scope.curItem.sizeInPx('left');
			prevContainerTopPx = $scope.curItem.sizeInPx('top');
			prevContainerBottomPx = prevContainerHeightPx + prevContainerTopPx;
			prevContainerRightPx = prevContainerWidthPx + prevContainerLeftPx;

		};

		$scope.childResizestart = function(index) {
			$scope.curItem.preventDrag = true;
			$scope.curItem.preventAutoResize = true; //Запретить автоматиеческое изменение размера рамки (высоты) из-за того, что пользователь сам изменил размер
			$scope.preventItemClick = true;

			$scope.curItem.curActiveChildItem.startRef = clone($scope.curItem.curActiveChildItem.itemRef);
		}

		$scope.resize = function(index) {
			if ($scope.curItem.childItems[0].key == 'objectItem') {
				var heightDifference = $scope.curItem.itemRef.height - prevContainerHeightPx;
				var widthDifference = $scope.curItem.itemRef.width - prevContainerWidthPx;
				var resizeKoef = $scope.curItem.childItems[0].initedsize.height / $scope.curItem.childItems[0].initedsize.width;

				if (heightDifference > widthDifference) {
					$scope.curItem.itemRef.height = $scope.curItem.itemRef.width * resizeKoef;
				} else {
					$scope.curItem.itemRef.width = $scope.curItem.itemRef.height / resizeKoef;
				}

				var newBottom = $scope.curItem.itemRef.height + prevContainerTopPx;
				var newRight = $scope.curItem.itemRef.width + prevContainerLeftPx;
				var topDifferecnce = 0;
				var leftDifference = 0;


				if (prevContainerLeftPx.toFixed(2) != $scope.curItem.itemRef.left.toFixed(2) || prevContainerTopPx.toFixed(2) != $scope.curItem.itemRef.top.toFixed(2)) {
					if (newBottom != prevContainerBottomPx) {
						topDifferecnce = (newBottom - prevContainerBottomPx).toFixed(5);
					}
					if (newRight != prevContainerRightPx) {
						leftDifference = (newRight - prevContainerRightPx).toFixed(5);
					}

					if (Math.abs(leftDifference) != 0)
						$scope.curItem.itemRef.left = prevContainerLeftPx - leftDifference;

					if (Math.abs(topDifferecnce) != 0)
						$scope.curItem.itemRef.top = prevContainerTopPx - topDifferecnce;
				}

			} else if ($scope.curItem.childItems.length > 1) {
				// for (var k in $scope.curItem.childItems){
				// 	var prevLeftPx = parseFloat(prevChildsSize[k].left) * prevContainerWidthPx / 100;

				// 	// var prevWidthPx = parseFloat(prevChildsSize[k].width) * prevContainerWidthPx / 100;
				// 	$scope.curItem.childItems[k].itemRef.left = prevLeftPx / $scope.curItem.itemRef.width * 100 + '%';

				// 	// $scope.curItem.childItems[k].itemRef.width = prevWidthPx / $scope.curItem.sizeInPx('width') * 100 + '%';
				// }
			}
			moveTextEtitPopup(index);
		}

		$scope.resizeend = function(index) {
			$scope.curItem.itemRef.top = parseFloat($scope.curItem.itemRef.top) / presentationObject.curHeight * 100 + '%';
			$scope.curItem.itemRef.left = parseFloat($scope.curItem.itemRef.left) / presentationObject.curWidth * 100 + '%';
			//Ширина пересчитается в resizeItemContainer
			$scope.curItem.itemRef.height = parseFloat($scope.curItem.itemRef.height) / presentationObject.curHeight * 100 + '%';
			$scope.curItem.itemRef.width = parseFloat($scope.curItem.itemRef.width) / presentationObject.curWidth * 100 + '%';
			$scope.curItem.preventDrag = false;
			if ($scope.curItem.childItems[0].key == 'textItem') {
				resizeItemContainer($scope.curItem, false);
			}
			avoidBodyClick = false;
		}

		$scope.childResizeend = function(index) {
			$scope.curItem.convertContainerSizeInPx();
			var containerWidth = $scope.curItem.itemRef.width;
			var containerHeight = $scope.curItem.itemRef.height;
			var curActiveChildItemRef = $scope.curItem.curActiveChildItem.itemRef;

			//В пикселях размер до ресайза
			var startTop = parseFloat($scope.curItem.curActiveChildItem.startRef.top) * containerHeight / 100;
			var startLeft = parseFloat($scope.curItem.curActiveChildItem.startRef.left) * containerWidth / 100;
			var startWidth = parseFloat($scope.curItem.curActiveChildItem.startRef.width) * containerWidth / 100;
			var startHeight = parseFloat($scope.curItem.curActiveChildItem.startRef.height) * containerHeight / 100;

			// curActiveChildItemRef.top = parseFloat(curActiveChildItemRef.top) / containerHeight * 100 + '%';

			var newLeft = parseFloat(curActiveChildItemRef.left).toFixed(3);
			var newWidth = parseFloat(curActiveChildItemRef.width).toFixed(3);
			var newHeight = parseFloat(curActiveChildItemRef.height).toFixed(3);

			convertContainerSizesPercentToPx($scope.curItem, index);

			// if ($scope.curItem.childItems.length == 1) {
			if (Math.abs(startLeft - newLeft) >= 0.5) { //Ресайзили налево
				var deltaLeft = startLeft - newLeft;
				if ($scope.curItem.childItems.length == 1) {
					//сдвинем контейнер налево на столько пикселей, на сколько перенесли текст
					$scope.curItem.itemRef.left = $scope.curItem.itemRef.left - deltaLeft;
					curActiveChildItemRef.left = startLeft;
				} else {
					if (newLeft < 0) {
						$scope.curItem.itemRef.left = parseFloat($scope.curItem.itemRef.left) + parseFloat(newLeft) - horizontalBorders;
						curActiveChildItemRef.left = 4;
						for (var k in $scope.curItem.childItems) {
							if (k == index)
								continue;
							$scope.curItem.childItems[k].itemRef.left = parseFloat($scope.curItem.childItems[k].itemRef.left) - parseFloat(newLeft) + horizontalBorders;
						}
					}

				}
			}

			if (Math.abs(startWidth - newWidth) >= 0.5) { //Ресайзили направо
				var deltaWidth = startWidth - newWidth;
				var containerNewWidth = $scope.curItem.itemRef.width - deltaWidth;

				//сдвинем контейнер направо на столько пикселей, на сколько перенесли текст
				$scope.curItem.itemRef.width = containerNewWidth;
				curActiveChildItemRef.width = newWidth;

			}

			if (Math.abs(startHeight - newHeight) >= 0.5) { //Ресайзили вниз
				var deltaHeight = startHeight - newHeight;
				// if ($scope.curItem.childItems.length == 1) {
				//сдвинем контейнер направо на столько пикселей, на сколько перенесли текст

				$scope.curItem.itemRef.height -= deltaHeight;
				curActiveChildItemRef.height = newHeight;
				// }
			}
			// }

			//Ширина пересчитается в resizeItemContainer
			// curActiveChildItemRef.height = parseFloat(curActiveChildItemRef.height) / containerHeight * 100 + '%';

			convertContainerSizesPxToPercent($scope.curItem, index);
			$scope.curItem.preventDrag = false;
			resizeItemContainer($scope.curItem, false);
			avoidBodyClick = false;
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

		/********************LASSO**********************************************/

		$scope.lassoEnable = new Object();
		$scope.lassoEnable.enable = true;

		var selectedCount = 0;
		var selectedItems = new Array();

		$scope.lassoOnEnd = function(item) {};

		$scope.onSelecting = function(curItem) {
			// if (curItem.inArea) { //Инициализация цвета рамки контейнера
			// 	curItem.cssContainer["border"] = "1px " + borderColors.green + " solid";
			// } else {
			// 	curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
			// }
			// if (!curItem.selecting && curItem.childItems.length == 1)
			if (!curItem.selecting)
				moveContainerBorders(curItem, -1);
			if (curItem.childItems.length == 1) {
				curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
			} else {
				curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
				// curItem.cssContainer['padding'] = '3px';
			}
		};

		$scope.onUnselecting = function(curItem) {
			if (curItem.selecting != curItem.selected) {
				if (curItem.canUnselect) {
					curItem.cssContainer["border"] = '';
					// if (curItem.childItems.length == 1)
					moveContainerBorders(curItem, 1)
				} else {
					curItem.canUnselect = true;
				}
			}
		}

		$scope.groupContainer = function() {
			// tmpItemContainer
			// selectedItems
			var deletedItemsId = new Array();
			var tmpItemContainer = $scope.selectedContainer;
			var newContainerAbsoluteTopPx = parseFloat(tmpItemContainer.itemRef.top) * presentationObject.curHeight / 100;
			var newContainerAbsoluteLeftPx = parseFloat(tmpItemContainer.itemRef.left) * presentationObject.curWidth / 100;
			var newContainerAbsoluteWidthPx = parseFloat(tmpItemContainer.itemRef.width) * presentationObject.curWidth / 100;
			var newContainerAbsoluteHeightPx = parseFloat(tmpItemContainer.itemRef.height) * presentationObject.curHeight / 100;

			newContainerAbsoluteWidthPx += horizontalBorders;
			newContainerAbsoluteHeightPx += verticalBorders;

			var newItemContainer;
			for (var k in selectedItems) {
				var curContainer = selectedItems[k];
				var containerAbsoluteTopPx = curContainer.sizeInPx('top');
				var containerAbsoluteLeftPx = curContainer.sizeInPx('left');
				var containerAbsoluteWidthPx = curContainer.sizeInPx('width');
				var containerAbsoluteHeightPx = curContainer.sizeInPx('height');

				for (var k in curContainer.childItems) {
					var curChild = curContainer.childItems[k];
					var newItem = clone(curChild);
					if (!newItemContainer) {
						newItemContainer = new slideItem(newItem);
					} else {
						newItemContainer.addChild(newItem);
					}
					var childInContainerTopPx = parseFloat(newItem.itemRef.top) * containerAbsoluteHeightPx / 100;
					var childInContainerLeftPx = parseFloat(newItem.itemRef.left) * containerAbsoluteWidthPx / 100;
					var childInContainerWidthPx = parseFloat(newItem.itemRef.width) * containerAbsoluteWidthPx / 100;
					var childInContainerHeightPx = parseFloat(newItem.itemRef.height) * containerAbsoluteHeightPx / 100;

					var newChildTopPx = containerAbsoluteTopPx - newContainerAbsoluteTopPx + childInContainerTopPx;
					var newChildLeftPx = containerAbsoluteLeftPx - newContainerAbsoluteLeftPx + childInContainerLeftPx;

					newItem.itemRef.top = newChildTopPx / newContainerAbsoluteHeightPx * 100 + '%';
					newItem.itemRef.left = newChildLeftPx / newContainerAbsoluteWidthPx * 100 + '%';
					newItem.itemRef.width = childInContainerWidthPx / newContainerAbsoluteWidthPx * 100 + '%';
					newItem.itemRef.height = childInContainerHeightPx / newContainerAbsoluteHeightPx * 100 + '%';


				}
				newItemContainer.itemRef.top = tmpItemContainer.itemRef.top;
				newItemContainer.itemRef.left = tmpItemContainer.itemRef.left;
				newItemContainer.itemRef.width = tmpItemContainer.itemRef.width;
				newItemContainer.itemRef.height = (newContainerAbsoluteHeightPx + 2) / presentationObject.curHeight * 100 + '%';

				var delthaForDelete = 0;
				for (var k in deletedItemsId) {
					if (deletedItemsId[k] < curContainer.tmpSlideItemId) {
						delthaForDelete++;
					}
				}

				$scope.curslide.items.splice((curContainer.tmpSlideItemId - delthaForDelete), 1);
				deletedItemsId.push(curContainer.tmpSlideItemId);
			}

			$scope.curslide.items.push(newItemContainer);
			var curItemIndex = $scope.curslide.items.length - 1;
			itemClick(curItemIndex);
			emptyLassoContainer();

		}

		var selectedIndexes = new Array();
		$scope.onSelected = function(index, keyPressed) {
			if ($scope.curItem)
				closeItem();
			closeAllFormatCircles();
			// $scope.lassoEnable.enable = false;
			selectedCount++;
			var paddingLeftPercent = horizontalBorders / presentationObject.curWidth * 100;
			var paddingTopPercent = verticalBorders / presentationObject.curHeight * 100;
			var paddingRightPercent = horizontalBorders / presentationObject.curWidth * 100;
			var paddingBottomPercent = verticalBorders / presentationObject.curHeight * 100;
			var curItem = $scope.curslide.items[index];

			//Собираем в контейнер
			//Все выделенные контейнеры в массив
			if (!containsObject(curItem, selectedItems)) {
				curItem.tmpSlideItemId = index; //Временное свойство, указывающее на индекс элемента на слайде (для перемещения элементов за рамкой)
				curItem.canUnselect = false;
				selectedItems.push(curItem);
			}

			if (selectedItems.length == 1) {
				// moveContainerBorders(curItem, -0.5)
				itemClick(index);
				selectedItems.push(curItem);
				return;
			} else {
				closeItem();
				//Если элементов все-таки больше 1-го, то выделить рамки у 0-го
				selectedItems[0].cssContainer["border"] = "1px " + borderColors.red + " solid";
				selectedItems[0].cssContainer["pointer-events"] = "none";
			}

			curItem.cssContainer["border"] = "1px " + borderColors.red + " solid";
			curItem.cssContainer["pointer-events"] = "none";

			//Координаты левого верхнего угла, расстояние до правой и нажней сторон для временного контейнера (все в %)
			var minTop = presentationObject.curHeight;
			var minLeft = presentationObject.curWidth;
			var minRight = minBottom = 0;

			var rightItemChildsLength = bottomItemChildsLength = 0;
			for (var c in selectedItems) {
				selectedItems[c].preventDrag = true;
				var itemRef = selectedItems[c].itemRef;
				var curTop = parseFloat(itemRef.top);
				var curLeft = parseFloat(itemRef.left);
				var curRight = parseFloat(itemRef.width) + parseFloat(itemRef.left);
				var curBottom = parseFloat(itemRef.height) + parseFloat(itemRef.top);

				if (curTop < minTop)
					minTop = curTop;
				if (curLeft < minLeft)
					minLeft = curLeft;
				if (curRight > minRight) {
					minRight = curRight;
					rightItemChildsLength = selectedItems[c].childItems.length;
				}
				if (curBottom > minBottom) {
					minBottom = curBottom;
					bottomItemChildsLength = selectedItems[c].childItems.length;
				}
			}

			//Ширина и высоте контейнера (пересчитано относительно содержимого)
			var curWidth = minRight - minLeft;
			var curHeight = minBottom - minTop;
			// if (bottomItemChildsLength > 1) {
			curHeight += paddingBottomPercent;
			// } 

			// if (rightItemChildsLength > 1) {
			curWidth += paddingRightPercent
				// }
			minLeft -= paddingLeftPercent;
			minTop -= paddingTopPercent;

			//Сбросим старый контейнер
			// $scope.selectedContainer = null;

			//Создаем новый временный контейнер
			var tmpItemContainer = new slideItem();
			tmpItemContainer.items = new Array();
			//tmpItemContainer.tmp = true; //Пишем, что он временный

			//Новые координаты для контейнера
			tmpItemContainer.itemRef.top = minTop + '%';
			tmpItemContainer.itemRef.left = minLeft + '%';
			tmpItemContainer.itemRef.width = curWidth + '%';
			tmpItemContainer.itemRef.height = curHeight + '%';


			//Добавляем все элементы из выделенных
			tmpItemContainer.css = new Object();
			$scope.selectedContainer = tmpItemContainer;
			$scope.selectedContainer.selectedItems = selectedItems;
			$scope.selectedContainer.css["border"] = "1px #bbbcbd dashed";

			$scope.textFormatGroup = true;
			$scope.showTextFormatPopup = true;

			var top = minTop * presentationObject.curHeight / 100;
			top = top - parseFloat($scope.textEditPopup.css('height')) - 15; //Поправка на высоту popup

			$scope.textEditPopup.css({
				'top': top / presentationObject.curHeight * 100 + '%',
				'left': tmpItemContainer.itemRef.left,
			});
		};

		$scope.onUnselected = function() {
			emptyLassoContainer();
		};

		function emptyLassoContainer() {
			$scope.textFormatGroup = false;
			$scope.showTextFormatPopup = false;
			selectedCount = 0;
			$scope.lassoEnable.enable = true;
			//Разбить временный контейнер
			$scope.selectedContainer = new slideItem();
			for (var k in selectedItems) {
				selectedItems[k].preventDrag = false;
				selectedItems[k].cssContainer["pointer-events"] = "auto";
				selectedItems[k].cssContainer["border"] = '';
			}
			selectedItems = [];
		}

		$scope.areaDragstart = function() {
			$scope.lassoEnable.enable = false;
		}

		$scope.areaDrag = function(dx, dy) {
			//Перемещаем элементы за рамкой
			for (var i in selectedItems) {
				var curItem = selectedItems[i];
				//From % to px
				var curTopPx = parseFloat(curItem.itemRef.top) * presentationObject.curHeight / 100 - dy;
				var curLeftPx = parseFloat(curItem.itemRef.left) * presentationObject.curWidth / 100 - dx;
				curItem.itemRef.top = curTopPx / presentationObject.curHeight * 100 + '%';
				curItem.itemRef.left = curLeftPx / presentationObject.curWidth * 100 + '%';
			}
			var popupTopPx = parseFloat($scope.selectedContainer.itemRef.top) * presentationObject.curHeight / 100 - 40;
			//-15
			$scope.textEditPopup.css({
				'top': popupTopPx / presentationObject.curHeight * 100 + '%',
				'left': $scope.selectedContainer.itemRef.left,
			});
		}

		$scope.areaDragend = function() {
			$scope.lassoEnable.enable = true;
			avoidBodyClick = false;
		}

		//входит ли объект в массив или нет
		function containsObject(obj, list) {
			var i;
			for (i = 0; i < list.length; i++) {
				if (list[i] === obj) {
					return true;
				}
			}
			return false;
		}


		/*******************РАБОТА С BODY***************************************/
		$scope.bodyClick = function() {

			if ($scope.mouseDownElement.id) {
				avoidBodyClick = false;
				$scope.mouseDownElement.id = '';
			}
			if (checkForAddingIsCompleted()) {
				if (avoidBodyClick) {
					$scope.onUnselected();
					if (!$scope.stylesShow.show) {
						$scope.closeLeftWindows();
						if ($scope.curItem) {
							closeItem()
						}
					}
					//$scope.openNewSlidePopup = false;
					$scope.showFontPopup = false;
					$scope.slidePopup = false;
					$scope.showImagePopup = false;
					$scope.lassoEnable.enable = true;
				}
			} else {
				if (!leftMenuClick)
					flashButton("addShowReadyButton", 2);
				leftMenuClick = false;
			}


			avoidBodyClick = true;
		}

		$scope.keyDown = function(e) {
			// $scope.keyCode = e.which;
			if (!$scope.avoidItemDelete) {
				$scope.avoidItemDelete = true;
				return;
			}
			if ($scope.curItem) {
				if (!$scope.curItem.curActiveChildItem) {
					if ((e.which === 8) || (e.which == 46)) {
						var eventTarget = e.target.parentElement.className.split(' ');
						if (eventTarget[1] != 'texteditorActive') {
							deleteItem();
							return false;
						}
					}
				} else {
					return true;
				}
			} else if (selectedItems.length > 0) {
				if ((e.which === 8) || (e.which == 46)) {
					deleteItem();
				}
			}
			if (curPressedKeys.indexOf(e.which) == -1)
				curPressedKeys.push(e.which);
		};

		$scope.keyUp = function(e) {
			var pressedKey = curPressedKeys[0];
			if ((pressedKey === 17) || (pressedKey == 18) || (pressedKey == 91)) {
				for (var k in $scope.curslide.items) {
					var curItem = $scope.curslide.items[k];
					if (curItem.manuallySelected) {
						$scope.$apply($scope.onSelected(k));
						curItem.manuallySelected = false;
					}
				}
			}
			curPressedKeys.splice(curPressedKeys.indexOf(e.which), 1);

		}

		function deleteItem(index) {
			if (selectedItems.length > 0) {
				//.tmpSlideItemId
				var deletedItemsId = new Array();
				for (var i in selectedItems) {
					var curContainer = selectedItems[i];
					var delthaForDelete = 0;
					for (var k in deletedItemsId) {
						if (deletedItemsId[k] < curContainer.tmpSlideItemId) {
							delthaForDelete++;
						}
					}

					$scope.curslide.items.splice((curContainer.tmpSlideItemId - delthaForDelete), 1);
					deletedItemsId.push(curContainer.tmpSlideItemId);
				}
				emptyLassoContainer();
			} else {
				var itemToDelete = (index == null) ? curActiveItem : index;
				closeItem();
				$scope.curslide.items.splice(itemToDelete, 1);
			}

		}


		$scope.reverseChanges = function() {
			closeItem();
			var type = presentationObject.reverseLogs();

			switch (type) {
				case 'dublicateSlide':
				case 'createSlide':
				case 'deleteSlide':
					$scope.slides = presentationObject.slides;
					for (var k in $scope.slides) {
						if ($scope.slides[k].active) {
							// scroll_left_position(k, $scope.slides.length + 1);

							openSlide(k);
							resize_scroll_width_duble($scope.curActiveSlide, $scope.slides.length + 1);
							scroll_left_position_end($scope.slides.length + 1);
							break;
						}
					}
					break;
			}
			setTimeout(function() {
				angular.element('.angular-dnd-resizable-handle').remove();
			}, 0)
		}

		$scope.forwardChanges = function() {
			closeItem()
			var type = presentationObject.forwardLogs();

			switch (type) {
				case 'dublicateSlide':
				case 'createSlide':
				case 'deleteSlide':
					$scope.slides = presentationObject.slides;
					for (var k in $scope.slides) {
						if ($scope.slides[k].active) {
							scroll_left_position(k + 1, $scope.slides.length + 1);
							openSlide(k);
							break;
						}
					}
					break;
			}

			setTimeout(function() {
				angular.element('.angular-dnd-resizable-handle').remove();
			}, 0)
		}

		//Перемещаем контейнера из-за появления рамок
		function moveContainerBorders(container, diff) {
			var containerNewLeftPx = container.sizeInPx("left") + diff;
			var containerNewTopPx = container.sizeInPx("top") + diff;
			container.itemRef.left = containerNewLeftPx / presentationObject.curWidth * 100 + '%';
			container.itemRef.top = containerNewTopPx / presentationObject.curHeight * 100 + '%';
		}

		//Снимает активность с элемента
		function closeItem(index) {
			var itemToClose = $scope.curItem;
			if (index) {
				itemToClose = $scope.curslide.items[index];
			} else {
				angular.element("#item" + curActiveItem).find(".angular-dnd-resizable-handle").remove();
				var differenceState = containerObjectsAreSame(curItemPrevState, itemToClose)
				if (differenceState != undefined && !differenceState) {
					var tmpLogObj = new logObj($scope.curActiveSlide + '_' + curActiveItem, itemToClose, 'move');
					presentationObject.addLog(tmpLogObj);
				}
			}

			// setTimeout(function() {
			// 	angular.element(".angular-dnd-resizable-handle").remove();
			// }, 0)

			angular.element(".angular-dnd-resizable-handle").remove();


			if (!itemToClose)
				return;
			itemToClose.curClass = '';
			itemToClose.active = false;
			itemToClose.cssContainer = {};

			//Поправка на рамки
			var bordersDiff = 1
			if (itemToClose.childItems.length > 1 && !itemToClose.curActiveChildItem)
				bordersDiff = 2
			moveContainerBorders(itemToClose, bordersDiff)
			if (itemToClose.curActiveChildItem) {
				var containerWidthPx = itemToClose.sizeInPx("width");
				var containerHeightPx = itemToClose.sizeInPx("height");

				for (var k in $scope.curItem.childItems) {
					if (k == activeChildIndex)
						continue;
					var curChild = $scope.curItem.childItems[k];
					var childNewLeftPx = curChild.sizeInPx($scope.curItem, "left") - 1;
					var childNewTopPx = curChild.sizeInPx($scope.curItem, "top") - 1;

					curChild.itemRef.left = childNewLeftPx / containerWidthPx * 100 + '%';
					curChild.itemRef.top = childNewTopPx / containerHeightPx * 100 + '%';
				}
			}

			for (var k in itemToClose.childItems) {
				itemToClose.childItems[k].resizeHandlers = '';
				if ($scope.curItem.childItems[k].key == 'textItem')
					$scope.curItem.childItems[k].textContainerCss["border"] = "";
				else 
					$scope.curItem.childItems[k].itemRef["border"] = "";
			}

			if (itemToClose && itemToClose.curActiveChildItem) {
				itemToClose.curActiveChildItem.activeClass = '';
				itemToClose.curActiveChildItem.css["pointer-events"] = 'none';
				//Проверка на наличие сожержимого в области текста
				for (var i in itemToClose.childItems) {
					var tmpValue = createTextSnippet(itemToClose.childItems[i].value);
					tmpValue = tmpValue.replace(/\s+/g, '');
					if (tmpValue.length == 0) {
						deleteChildItem(itemToClose, i)
					}
				}
			}

			for (var k in itemToClose.childItems) {
				if (itemToClose.childItems[k].newItem) {
					// itemToClose.childItems.splice(k, 1);
					deleteChildItem(itemToClose, k)
					resizeItemContainer(itemToClose, true);
				}
			}

			if (!index) {
				if (itemToClose.childItems.length == 0) {
					$scope.curslide.items.splice(curActiveItem, 1);
				} else {
					//resizeItemContainer(itemToClose, false)
				}
				$scope.curItem = null;
				curActiveItem = -1;
			}
			$scope.showTextFormatPopup = false;
			$scope.textStylePopup.childTextPopup = false;
			tmpTextItemNumber = -1; //При первом клике туда записывается номер элемента, в itemClick инициализация объекта
			tmpImageItemNumber = -1;
			hideAreas()

		}

		function deleteChildItem(containerObject, itemIndex) {
			var columnMaxWidth = 0;
			var containerWidthPx = containerObject.sizeInPx('width');
			var tmpChildItem = containerObject.childItems[itemIndex];
			var deletedItemWidth = parseFloat(tmpChildItem.itemRef.width) * containerWidthPx / 100;
			var hierarchy = tmpChildItem.hierarchy.split('_');
			var oneItemInColumn = true; //Элемент один в контейнере или нет
			for (var k in containerObject.childItems) {
				if (k == itemIndex)
					continue;
				var tmpHierarchy = containerObject.childItems[k].hierarchy.split('_');
				if (tmpHierarchy[1] == hierarchy[1]) {
					oneItemInColumn = false;
					var curItemWidthPx = parseFloat(containerObject.childItems[k].itemRef.width) * containerWidthPx / 100;
					if (columnMaxWidth < curItemWidthPx)
						columnMaxWidth = curItemWidthPx;
					if (tmpHierarchy[0] > hierarchy[0]) {
						containerObject.childItems[k].itemRef.top = parseFloat(containerObject.childItems[k].itemRef.top) - parseFloat(tmpChildItem.itemRef.height) + '%';
						tmpHierarchy[0] --;
						containerObject.childItems[k].hierarchy = tmpHierarchy[0] + '_' + tmpHierarchy[1];
					}
				}
			}

			var widthDifference = deletedItemWidth - columnMaxWidth;
			if (widthDifference > 0.5) { //Сдвинуть все элементы справа
				var newContainerWidth = containerObject.sizeInPx('width') - widthDifference;

				for (var k in containerObject.childItems) {
					if (k == itemIndex)
						continue;

					var tmpItem = containerObject.childItems[k];
					var tmpHierarchy = containerObject.childItems[k].hierarchy.split('_');
					var curLeftPx = parseFloat(containerObject.childItems[k].itemRef.left) * containerWidthPx / 100;
					var curWidthPx = parseFloat(containerObject.childItems[k].itemRef.width) * containerWidthPx / 100;
					if (tmpHierarchy[1] > hierarchy[1]) {
						curLeftPx -= widthDifference;
						if (oneItemInColumn) { //изменить столбец у других элементов так как с удалением текущего удалялся и столбец
							tmpHierarchy[1] --;
							containerObject.childItems[k].hierarchy = tmpHierarchy[0] + '_' + tmpHierarchy[1];
						}
					}
					containerObject.childItems[k].itemRef.left = curLeftPx / newContainerWidth * 100 + '%';
					containerObject.childItems[k].itemRef.width = curWidthPx / newContainerWidth * 100 + '%';
				}
			}

			$scope.curItem.childItems.splice(itemIndex, 1);
			resizeItemContainer(containerObject, true);
		}

		/********************Фиксирование элемента*******************************/

		$scope.fixElement = function() {
			$scope.curslide.items[curActiveItem].cssContainer.position_auto = 'false';
		}

		//*********************Закрытие левых окон******************************

		$scope.closeLeftWindows = function() {
			selectionRanges = {};
			$scope.stylesShow.show = false;
			$scope.stylesImage.show = false;
			$scope.stylesGraph.show = false;
			$scope.setGraphInfo.show = false;
			if ($scope.addShow.show && checkForAddingIsCompleted()) {
				$scope.addShow.show = false;
				$scope.addShowAddingCancel();
			} else {
				// flashButton("addShowReadyButton", 3);
			}
			$scope.layoutShow.show = false;
			$scope.magicShow.show = false;
			// $scope.imagesShow.show = false;
			$scope.graphShow = false;
			$scope.layoutGlobalShow.show = false;
		}

		function flashButton(buttonId, timesLeft) {
			if (timesLeft > 0) {
				setTimeout(function() {
					angular.element("#" + buttonId).css('display', 'none');
					setTimeout(function() {
						angular.element("#" + buttonId).css('display', 'block');
						flashButton(buttonId, timesLeft - 1);
					}, 50)
				}, 50)
			}
		}

		//----------------объекты левых окон

		$scope.stylesShow = new Object();
		$scope.stylesImage = new Object();
		$scope.stylesGraph = new Object();
		$scope.setGraphInfo = new Object();
		$scope.addShow = new Object();
		$scope.layoutShow = new Object();
		$scope.magicShow = new Object();
		$scope.imagesShow = new Object();
		$scope.graphsShow = new Object();
		$scope.layoutGlobalShow = new Object();

		$scope.imagesShow.show = true;
		$scope.graphsShow.show = true;

		$scope.graphsShow.style = {
			left: '-10000px'
		}
		$scope.imagesShow.style = {
			left: '-10000px'
		}

		function checkForAddingIsCompleted() {
			if ($scope.curItem)
				for (var k in $scope.curItem.childItems) {
					if ($scope.curItem.childItems[k].newItem) {
						return false; //Новые элементы в процессе добавления
					}
				}

			return true; //Нет новых элементов, можно закрывать окно
		}

		$scope.checkClassLeftMenuPopup = function() {
			var showStaus = false;
			for (var k in arguments) {
				if (arguments[k] || showStaus)
					showStaus = true;
			}
			if (showStaus)
				return 'menuTypeActive';
		}

		$scope.activeTextTextPosition = function(position) {
			if (!$scope.curItem)
				return '';
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {

					if ($scope.curItem.childItems[k].tmpPosition == position && $scope.curItem.childItems[k].key == 'textItem') {
						return 'addTextToTextActive';
					}
					break;
				}
			}

		}

		$scope.activePictureTextPosition = function(position) {
			if (!$scope.curItem)
				return '';
			for (var k in $scope.curItem.childItems) {
				if ($scope.curItem.childItems[k].newItem) {
						if ($scope.curItem.childItems[k].tmpPosition == position && $scope.curItem.childItems[k].key == 'objectItem') {
							return 'addTextToTextActive';
						}
					break;
				}
			}

		}

		$scope.open = function(tmpv) {
			avoidAddPopupOpen = false;
			$scope.avoidBodyClick();
			closeAddingPopup();

			if ($scope.imagesShow.style) {
				$scope.imagesShow.show = false;
				$scope.imagesShow.style = false;
			} 
			if($scope.graphsShow.style) {
				$scope.graphsShow.show = false;
				$scope.graphsShow.style = false;
			}

			if (checkForAddingIsCompleted()) {
				var t2show = !tmpv.show;
				$scope.closeLeftWindows();
				$scope.imagesShow.show = false;
				tmpv.show = t2show;
				tmpv.autoWindow = true;
				tmpv.dopWindow = false;
				tmpv.starWindow = false;
			}

			if ($scope.curItem)
				if ($scope.curItem.curActiveChildItem)
					saveItemSelection($scope.curItem.curActiveChildItem.textEditorId);
			avoidBodyClick = false;
		}

		$scope.checkforCicrcleClass = function(tmpv) {
			if (tmpv.show)
				return 'circleOpenIsActive';
		}

		//Объект с расстоянием до ближайшего элемента и массивом элементов, которые стоят на пути изменения границ
		var curNearestObjectsTop, curNearestObjectsBottom, curNearestObjectsLeft, curNearestObjectsRight;

		$scope.checkForCurBordersClassHorizontal = function(type) {
			if (type == "both-horizontal")
				type = "both"
			if ($scope.curHorizontalBordersSlider == type) {
				return 'active';
			}
		}

		$scope.checkForCurBordersClassVertical = function(type) {
			if ($scope.curVerticalBordersSlider == type) {
				return 'active';
			}
		}

		$scope.initLayoutShow = function() {
			$scope.curPossibleVerticalChild = new Array();
			$scope.curPossibleHorizontalChild = new Array();

			//инициализация отступов
			if (($scope.curItem.curActiveChildItem) && ($scope.curItem.childItems.length > 1)) {
				var posibleBordersChild = initPossibleBordersForChild($scope.curItem.curActiveChildItem);
				$scope.curPossibleVerticalChild = posibleBordersChild.curPossibleVertical;
				$scope.curPossibleHorizontalChild = posibleBordersChild.curPossibleHorizontal;
			}

			$scope.curHorizontalBordersSlider = 'both';
			$scope.curVerticalBordersSlider = 'both';

			$scope.initVerticalBordersSlider($scope.curVerticalBordersSlider);
			$scope.initHorizontalBordersSlider($scope.curHorizontalBordersSlider);
			//инициализация слайдера слоя
			$scope.layoutShow.slidePosition = parseInt($scope.curItemContainer.css('z-index'));
		}

		function initPossibleBordersForChild(childItem) {
			var curPossibleVertical = new Array();
			var curPossibleHorizontal = new Array();
			var curHorizontalBordersSlider, curVerticalBordersSlider;

			var curChildHierarchy = childItem.hierarchy.split('_');
			if (curChildHierarchy[1] != 0) {
				curPossibleHorizontal.push('left');
				curHorizontalBordersSlider = 'left';
			}

			if (curChildHierarchy[0] != 0) {
				curPossibleVertical.push('top');
				curVerticalBordersSlider = 'top';
			}
			for (var k in $scope.curItem.childItems) {
				var tmpHierarchy = $scope.curItem.childItems[k].hierarchy.split('_');
				//Справа есть элемент
				if ((tmpHierarchy[0] == curChildHierarchy[0]) && (curChildHierarchy[1] < tmpHierarchy[1])) {
					if (curPossibleHorizontal.indexOf('right') == -1) {
						curPossibleHorizontal.push('right');
						curHorizontalBordersSlider = 'right';
					}
				}
				//Снизу есть элемент
				if (curChildHierarchy[0] < tmpHierarchy[0]) {
					if (curPossibleVertical.indexOf('bottom') == -1) {
						curPossibleVertical.push('bottom');
						curVerticalBordersSlider = 'bottom';
					}
				}
			}

			if (curPossibleHorizontal.length == 2) {
				curPossibleHorizontal.push('both');
				curHorizontalBordersSlider = 'both';
			}
			if (curPossibleVertical.length == 2) {
				curPossibleVertical.push('both');
				curVerticalBordersSlider = 'both';
			}

			return {
				curPossibleVertical: curPossibleVertical,
				curPossibleHorizontal: curPossibleHorizontal,
				curVerticalBordersSlider: curVerticalBordersSlider,
				curHorizontalBordersSlider: curHorizontalBordersSlider,
			}
		}

		$scope.initHorizontalBordersSlider = function(side) {
			$scope.curHorizontalBordersSlider = side;
			if ($scope.curPossibleHorizontalChild.indexOf(side) != -1) {
				initChildHorizontalBordersSlider(side);
			} else {
				initContainerHorizontalBordersSlider(side);
			}
		}

		function initContainerHorizontalBordersSlider(side) {
			var initedParams = {
				containerLeft: $scope.curItem.sizeInPx('left'),
				containerWidth: $scope.curItem.sizeInPx('width'),
			};
			var initedSliderSize = new Object();

			curNearestObjectsLeft = findForLeftNearest($scope.curItem);
			initedSliderSizeLeft = initContainerBordersLeft(initedParams, $scope.curItem);

			curNearestObjectsLeft.initedContainerLeft = initedSliderSizeLeft.initedContainerLeft;
			curNearestObjectsLeft.otherItemsWidth = initedSliderSizeLeft.otherItemsWidth;

			curNearestObjectsRight = findForRightNearest($scope.curItem);
			initedSliderSizeRight = initContainerBordersRight(initedParams, $scope.curItem);

			curNearestObjectsRight.otherItemsWidth = initedSliderSizeRight.otherItemsWidth;
			curNearestObjectsRight.initedContainerLeft = initedSliderSizeRight.initedContainerLeft;
			curNearestObjectsRight.initedContainerRight = initedSliderSizeRight.initedContainerRight;


			if (side == 'left') {
				if (curNearestObjectsLeft.itemsArr.length == 0) {
					curNearestObjectsLeft.forRightBorders = curNearestObjectsRight;
					initedSliderSize.horizontalBorders = 0;
					initedSliderSize.bordersMax = initedSliderSizeRight.bordersMax;
					initedSliderSize.bordersMin = -initedSliderSizeLeft.bordersMax;
				} else {
					initedSliderSize.horizontalBorders = initedSliderSizeLeft.horizontalBorders;
					initedSliderSize.bordersMax = initedSliderSizeLeft.bordersMax;
					initedSliderSize.bordersMin = 0;
				}

			} else if (side == 'right') {
				if (curNearestObjectsRight.itemsArr.length == 0) {
					curNearestObjectsRight.forLeftBorders = curNearestObjectsLeft;
					initedSliderSize.horizontalBorders = 0;
					initedSliderSize.bordersMax = initedSliderSizeLeft.bordersMax;
					initedSliderSize.bordersMin = -initedSliderSizeRight.bordersMax;
				} else {
					initedSliderSize.horizontalBorders = initedSliderSizeRight.horizontalBorders;
					initedSliderSize.bordersMax = initedSliderSizeRight.bordersMax;
					initedSliderSize.bordersMin = 0;
				}

			} else if (side == 'both') {

				if (curNearestObjectsLeft.itemsArr.length != 0 && curNearestObjectsRight.itemsArr.length != 0) {

					curNearestObjectsRight = findForRightNearest($scope.curItem);
					sizesForBothSlider.sizeForRight = initContainerBordersRight(initedParams, $scope.curItem);

					curNearestObjectsLeft = findForLeftNearest($scope.curItem);
					sizesForBothSlider.sizeForLeft = initContainerBordersLeft(initedParams, $scope.curItem);

					initedSliderSize.bordersMax = Math.max(sizesForBothSlider.sizeForLeft.bordersMax, sizesForBothSlider.sizeForRight.bordersMax);
					initedSliderSize.horizontalBorders = Math.min(sizesForBothSlider.sizeForRight.horizontalBorders, sizesForBothSlider.sizeForLeft.horizontalBorders);

					if (sizesForBothSlider.sizeForRight.horizontalBorders - sizesForBothSlider.sizeForLeft.horizontalBorders > 0) {
						curNearestObjectsRight.minSide = 'bottom';
					} else {
						curNearestObjectsRight.minSide = 'top';
					}

					curNearestObjectsRight.initedBorders = sizesForBothSlider.sizeForRight.horizontalBorders;
					curNearestObjectsLeft.initedBorders = sizesForBothSlider.sizeForLeft.horizontalBorders;

				} else {
					initedSliderSize.horizontalBorders = 0;
					initedSliderSize.bordersMax = Math.abs(initedSliderSizeRight.horizontalBorders - initedSliderSizeLeft.horizontalBorders) / 2;
					initedSliderSize.bordersMin = 0;

					curNearestObjectsLeft.centerLeftForContainer = (initedSliderSizeRight.horizontalBorders + initedSliderSizeLeft.horizontalBorders) / 2;

					initedSliderSize.bordersMin = 0;
				}

			}


			$scope.layoutShow.horizontalBorderMin = initedSliderSize.bordersMin;
			$scope.layoutShow.horizontalBorder = initedSliderSize.horizontalBorders;
			$scope.layoutShow.horizontalBorderMax = initedSliderSize.bordersMax;

		}

		var sizesForBothSlider = new Object();

		function initContainerBordersLeft(initedParams, containerItem) {

			var otherItemsWidth = 0;
			if (curNearestObjectsLeft.itemsArr.length != 0)
				otherItemsWidth = parseFloat(curNearestObjectsLeft.itemsRight) - parseFloat(curNearestObjectsLeft.nearestCoord);

			var horizontalBorders = initedParams.containerLeft - curNearestObjectsLeft.itemsRight;

			var bordersMax = initedParams.containerLeft - otherItemsWidth;

			return {
				bordersMax: bordersMax,
				horizontalBorders: horizontalBorders,
				initedContainerLeft: initedParams.containerLeft,
				otherItemsWidth: otherItemsWidth,
			}
		}

		function initContainerBordersRight(initedParams, containerItem) {

			var containerRight = initedParams.containerLeft + initedParams.containerWidth;

			var otherItemsWidth = 0;
			if (curNearestObjectsRight.itemsArr.length != 0)
				otherItemsWidth = parseFloat(curNearestObjectsRight.itemsRight) - parseFloat(curNearestObjectsRight.nearestCoord);

			var horizontalBorders = curNearestObjectsRight.nearestCoord - containerRight;

			var bordersMax = presentationObject.curWidth - containerRight - otherItemsWidth;

			return {
				bordersMax: bordersMax,
				horizontalBorders: horizontalBorders,
				otherItemsWidth: otherItemsWidth,
				initedContainerLeft: initedParams.containerLeft,
				initedContainerRight: containerRight,
			}
		}

		$scope.initVerticalBordersSlider = function(side) {
			$scope.curVerticalBordersSlider = side;
			if ($scope.curPossibleVerticalChild.indexOf(side) != -1) {
				initChildVerticalBordersSlider(side);
			} else {
				initContainerVerticalBordersSlider(side);
			}
		}

		function initContainerVerticalBordersSlider(side) {
			var initedParams = {
				containerTop: $scope.curItem.sizeInPx('top'),
				containerHeight: $scope.curItem.sizeInPx('height'),
			};
			var initedSliderSize = new Object();

			curNearestObjectsBottom = findForBottomNearest($scope.curItem);
			var initedSliderSizeBottom = initContainerBordersBottom(initedParams, $scope.curItem);

			curNearestObjectsBottom.otherItemsHeight = initedSliderSizeBottom.otherItemsHeight;
			curNearestObjectsBottom.containerBottom = initedSliderSizeBottom.containerBottom;

			curNearestObjectsTop = findForTopNearest($scope.curItem);
			var initedSliderSizeTop = initContainerBordersTop(initedParams, $scope.curItem);

			curNearestObjectsTop.initedContainerTop = initedSliderSizeTop.initedContainerTop;
			curNearestObjectsTop.otherItemsHeight = initedSliderSizeTop.otherItemsHeight;

			if (side == 'top') {
				if (curNearestObjectsTop.itemsArr.length == 0) {
					//Двигаемся от границы слайда
					curNearestObjectsTop.forBottomBorders = curNearestObjectsBottom;
					initedSliderSize.verticalBorders = 0;
					initedSliderSize.bordersMax = initedSliderSizeBottom.bordersMax;
					initedSliderSize.bordersMin = -initedSliderSizeTop.verticalBorders;

					// curNearestObjectsTop.initedContainerTop -= initedSliderSizeTop.verticalBorders;
				} else {
					initedSliderSize.verticalBorders = initedSliderSizeTop.verticalBorders;
					initedSliderSize.bordersMax = initedSliderSizeTop.bordersMax;
					initedSliderSize.bordersMin = 0;
				}

			} else if (side == 'bottom') {


				if (curNearestObjectsBottom.itemsArr.length == 0) {
					//Двигаемся от границы слайда
					// var tmpBottom = curNearestObjectsBottom;
					curNearestObjectsBottom.forTopBorders = curNearestObjectsTop;
					initedSliderSize.verticalBorders = 0;
					initedSliderSize.bordersMax = initedSliderSizeTop.bordersMax;
					initedSliderSize.bordersMin = -initedSliderSizeBottom.verticalBorders;
				} else {
					initedSliderSize.verticalBorders = initedSliderSizeBottom.verticalBorders;
					initedSliderSize.bordersMax = initedSliderSizeBottom.bordersMax;
					initedSliderSize.bordersMin = 0;
				}



			} else if (side == 'both') {
				//Инициализация для обеих границ

				if (curNearestObjectsBottom.itemsArr.length != 0 && curNearestObjectsTop.itemsArr.length != 0) {
					sizesForBothSlider.sizeForTop = initedSliderSizeTop;
					sizesForBothSlider.sizeForBottom = initedSliderSizeBottom;

					initedSliderSize.bordersMax = Math.max(sizesForBothSlider.sizeForBottom.bordersMax, sizesForBothSlider.sizeForTop.bordersMax);
					initedSliderSize.verticalBorders = Math.min(sizesForBothSlider.sizeForTop.verticalBorders, sizesForBothSlider.sizeForBottom.verticalBorders);

					initedSliderSize.bordersMin = 0;

					if (sizesForBothSlider.sizeForTop.verticalBorders - sizesForBothSlider.sizeForBottom.verticalBorders > 0) {
						curNearestObjectsTop.minSide = 'bottom';
					} else {
						curNearestObjectsTop.minSide = 'top';
					}

					curNearestObjectsTop.initedBorders = sizesForBothSlider.sizeForTop.verticalBorders;
					curNearestObjectsBottom.initedBorders = sizesForBothSlider.sizeForBottom.verticalBorders;
				} else {
					initedSliderSize.verticalBorders = 0;
					initedSliderSize.bordersMax = Math.abs(initedSliderSizeTop.verticalBorders - initedSliderSizeBottom.verticalBorders) / 2;
					initedSliderSize.bordersMin = 0;

					curNearestObjectsTop.centerTopForContainer = (initedSliderSizeTop.verticalBorders + initedSliderSizeBottom.verticalBorders) / 2;


					initedSliderSize.bordersMin = 0;
				}

			}


			$scope.layoutShow.verticalBorderMin = initedSliderSize.bordersMin;
			$scope.layoutShow.verticalBorder = initedSliderSize.verticalBorders;
			$scope.layoutShow.verticalBorderMax = initedSliderSize.bordersMax;

		}

		function initContainerBordersTop(initedParams, containerItem) {

			var otherItemsHeight = 0;
			if (curNearestObjectsTop.itemsArr.length != 0)
				otherItemsHeight = parseFloat(curNearestObjectsTop.itemsBottom) - parseFloat(curNearestObjectsTop.nearestCoord);

			var verticalBorders;

			var bordersMax;
			if (otherItemsHeight > 0) {
				verticalBorders = initedParams.containerTop - curNearestObjectsTop.itemsBottom;
				bordersMax = initedParams.containerTop - otherItemsHeight;
			} else {
				verticalBorders = initedParams.containerTop;
				bordersMax = presentationObject.curHeight - initedParams.containerHeight;
			}

			// curNearestObjectsTop.initedContainerTop = initedParams.containerTop;
			// curNearestObjectsTop.otherItemsHeight = otherItemsHeight;

			return {
				bordersMax: bordersMax,
				verticalBorders: verticalBorders,
				initedContainerTop: initedParams.containerTop,
				otherItemsHeight: otherItemsHeight,
			}
		}

		function initContainerBordersBottom(initedParams, containerItem) {

			var containerBottom = initedParams.containerTop + initedParams.containerHeight;

			var otherItemsHeight = 0;
			if (curNearestObjectsBottom.itemsArr.length != 0)
				otherItemsHeight = parseFloat(curNearestObjectsBottom.itemsBottom) - parseFloat(curNearestObjectsBottom.nearestCoord);

			var verticalBorders = curNearestObjectsBottom.nearestCoord - containerBottom;

			var bordersMax = presentationObject.curHeight - containerBottom - otherItemsHeight;
			// curNearestObjectsBottom.otherItemsHeight = otherItemsHeight;
			// curNearestObjectsBottom.containerBottom = containerBottom;

			return {
				bordersMax: bordersMax,
				verticalBorders: verticalBorders,
				otherItemsHeight: otherItemsHeight,
				curNearestObjectsBottom: containerBottom,
			}
		}

		function initChildVerticalBordersSlider(side) {
			$scope.layoutShow.verticalBorderMin = 0;
			var curActiveChild;
			switch ($scope.curItem.curActiveChildItem.key) {
				case 'textItem':
					curActiveChild = tmpTextItemNumber;
					break;
				case 'objectItem':
					curActiveChild = tmpImageItemNumber;
					break;
			}

			var initedParams = initForChildBordersVerticalParams();
			var initedSliderSize;
			//Двигаем все, что ниже элемента
			if (side == 'bottom') {
				curNearestObjectsBottom = findForBottomNearest($scope.curItem);
				initedSliderSize = initChildBordersBottom(initedParams, curActiveChild);

			} else if (side == 'top') { //Все границы сверху элемента
				curNearestObjectsTop = findForTopNearest($scope.curItem);
				initedSliderSize = initChildBordersTop(initedParams, curActiveChild);

			} else if (side == 'both') {

				initedSliderSize = new Object();

				curNearestObjectsTop = findForTopNearest($scope.curItem);
				sizesForBothSlider.sizeForTop = initChildBordersTop(initedParams, curActiveChild);

				curNearestObjectsBottom = findForBottomNearest($scope.curItem);
				sizesForBothSlider.sizeForBottom = initChildBordersBottom(initedParams, curActiveChild);

				//initedSliderSize.bordersMax = Math.max(sizesForBothSlider.sizeForBottom.bordersMax, sizesForBothSlider.sizeForTop.bordersMax);
				initedSliderSize.bordersMax = sizesForBothSlider.sizeForBottom.bordersMax + sizesForBothSlider.sizeForTop.bordersMax;
				initedSliderSize.verticalBorders = Math.min(sizesForBothSlider.sizeForTop.verticalBorders, sizesForBothSlider.sizeForBottom.verticalBorders);

				curNearestObjectsTop.initedContainerHeight += initedSliderSize.verticalBorders;
				curNearestObjectsTop.initedContainerTop -= initedSliderSize.verticalBorders / 2;

				curNearestObjectsTop.itemsInitedSize[curActiveChild].top = parseFloat(curNearestObjectsTop.itemsInitedSize[curActiveChild].top) + initedSliderSize.verticalBorders / 2;
			}

			$scope.layoutShow.verticalBorderMin = -initedSliderSize.verticalBorders;
			$scope.layoutShow.verticalBorder = 0;
			$scope.layoutShow.initedVerticalParams = initedParams;
			$scope.layoutShow.verticalBorderMax = initedSliderSize.bordersMax;
		}

		function initForChildBordersVerticalParams() {
			var containerTop = $scope.curItem.sizeInPx('top');
			var containerHeight = $scope.curItem.sizeInPx('height');
			var childInContainerTop = parseFloat($scope.curItem.curActiveChildItem.itemRef.top) * containerHeight / 100;
			var childInContainerHeight = parseFloat($scope.curItem.curActiveChildItem.itemRef.height) * containerHeight / 100;
			return {
				containerTop: containerTop,
				containerHeight: containerHeight,
				childInContainerTop: childInContainerTop,
				childInContainerHeight: childInContainerHeight,
				childInContainerBottom: childInContainerTop + childInContainerHeight,
				childTop: parseFloat($scope.curItem.curActiveChildItem.itemRef.top) * containerHeight / 100 + containerTop,
			}
		}

		function initChildBordersTop(initedParams, curActiveChild) {

			curNearestObjectsTop.dependentItemsIndexes = new Array();
			curNearestObjectsTop.itemsInitedSize = new Array();
			//
			curNearestObjectsTop.itemsInitedTop = new Array();
			curNearestObjectsTop.dependentItemsInitedHeight = new Array();

			var otherItemsHeight = 0;
			if (curNearestObjectsTop.itemsArr.length != 0)
				otherItemsHeight = parseFloat(curNearestObjectsTop.itemsBottom) - parseFloat(curNearestObjectsTop.nearestCoord);

			//Сумма top и height у ближайшего элемента сверху
			var curChildHierarchy = $scope.curItem.curActiveChildItem.hierarchy.split('_');
			var nearestLine = -1;
			var verticalBorders;
			for (var k in $scope.curItem.childItems) {
				var curNearestItem = $scope.curItem.childItems[k];
				var nearestChildTop = parseFloat(curNearestItem.itemRef.top) * initedParams.containerHeight / 100;
				var nearestChildHeight = parseFloat(curNearestItem.itemRef.height) * initedParams.containerHeight / 100;
				curNearestObjectsTop.itemsInitedSize[k] = new Object();
				curNearestObjectsTop.itemsInitedSize[k].top = nearestChildTop;
				curNearestObjectsTop.itemsInitedSize[k].height = nearestChildHeight;
				var tmpHierarchy = curNearestItem.hierarchy.split('_');
				if ((tmpHierarchy[0] < curChildHierarchy[0]) && (tmpHierarchy[1] == curChildHierarchy[1])) {
					curNearestObjectsTop.dependentItemsIndexes.push(k);
					if (nearestLine < tmpHierarchy[0]) {
						nearestLine = tmpHierarchy[0];
						verticalBorders = Math.abs(nearestChildTop + nearestChildHeight - initedParams.childInContainerTop);
						curNearestObjectsTop.toNearestDifference = verticalBorders;
					}
					curNearestObjectsTop.itemsInitedTop.push(nearestChildTop);
					curNearestObjectsTop.dependentItemsInitedHeight.push(nearestChildHeight);
				}
			}

			// for (var k in $scope.curItem.childItems) {

			// 	if (curNearestObjectsTop.dependentItemsIndexes.indexOf(k) == -1) {
			// 		curNearestObjectsTop.itemsInitedSize[k].top -= verticalBorders;
			// 	}
			// }

			var bordersMax = initedParams.containerTop - otherItemsHeight;

			curNearestObjectsTop.curActiveChild = curActiveChild;
			curNearestObjectsTop.initedContainerTop = initedParams.containerTop;
			curNearestObjectsTop.initedCurIntemInContainerHeight = initedParams.childInContainerHeight
			curNearestObjectsTop.otherItemsHeight = otherItemsHeight;

			return {
				bordersMax: bordersMax,
				verticalBorders: verticalBorders,
			}
		}

		function initChildBordersBottom(initedParams, curActiveChild) {
			curNearestObjectsBottom.dependentItemsIndexes = new Array();
			curNearestObjectsBottom.itemsInitedSize = new Array();

			var otherItemsHeight = 0;
			if (curNearestObjectsBottom.itemsArr.length != 0)
				otherItemsHeight = parseFloat(curNearestObjectsBottom.itemsBottom) - parseFloat(curNearestObjectsBottom.nearestCoord);

			//Сумма top и height у ближайшего элемента сверху
			var curChildHierarchy = $scope.curItem.curActiveChildItem.hierarchy.split('_');
			var nearestLine = Infinity;
			var verticalBorders;
			for (var k in $scope.curItem.childItems) {
				var curNearestItem = $scope.curItem.childItems[k];
				var nearestChildTop = parseFloat(curNearestItem.itemRef.top) * initedParams.containerHeight / 100;
				var nearestChildHeight = parseFloat(curNearestItem.itemRef.height) * initedParams.containerHeight / 100;
				curNearestObjectsBottom.itemsInitedSize[k] = new Object();
				curNearestObjectsBottom.itemsInitedSize[k].top = nearestChildTop;
				curNearestObjectsBottom.itemsInitedSize[k].height = nearestChildHeight;

				var tmpHierarchy = $scope.curItem.childItems[k].hierarchy.split('_');
				if ((tmpHierarchy[0] > curChildHierarchy[0]) && (tmpHierarchy[1] == curChildHierarchy[1])) {
					curNearestObjectsBottom.dependentItemsIndexes.push(k);
					if (nearestLine > tmpHierarchy[0]) {
						nearestLine = tmpHierarchy[0];
						verticalBorders = nearestChildTop - initedParams.childInContainerBottom;
					}
				}
			}

			var bordersMax = presentationObject.curHeight - (initedParams.containerTop + initedParams.containerHeight) - otherItemsHeight;


			curNearestObjectsBottom.curActiveChild = curActiveChild;
			curNearestObjectsBottom.otherItemsHeight = otherItemsHeight;

			return {
				bordersMax: bordersMax,
				verticalBorders: verticalBorders,
			}
		}

		$scope.$watch('layoutShow.horizontalBorder', function(newVal) {
			newVal = parseFloat(newVal);
			if (!newVal)
				return;
			switch ($scope.curHorizontalBordersSlider) {
				case 'left':
					if (curNearestObjectsLeft.itemsArr.length == 0) {
						changeContainerLeftBordersFromSlide(newVal)
					} else {
						changeLeftBorders(newVal);
					}
					break;

				case 'right':
					if (curNearestObjectsRight.itemsArr.length == 0) {
						changeContainerRightBordersFromSlide(newVal)
					} else {
						changeRightBorders(newVal);
					}

					break;

				case 'both':
					changeHorizontalBothBorders(newVal);
					break;
			}
			if ($scope.curItem)
				moveTextEtitPopup();
		});

		function changeLeftBorders(newVal) {
			if ($scope.curPossibleHorizontalChild.indexOf('left') != -1) {
				changeChildLeftBorders(newVal);
			} else {
				changeContainerLeftBorders(newVal);
			}
		}

		function changeRightBorders(newVal) {
			if ($scope.curPossibleHorizontalChild.indexOf('right') != -1) {
				changeChildRightBorders(newVal);
			} else {
				changeContainerRightBorders(newVal);
			}
		}

		function changeHorizontalBothBorders(newVal) {
			if (curNearestObjectsLeft.itemsArr.length != 0 && curNearestObjectsRight.itemsArr.length != 0) {
				if ($scope.curPossibleHorizontalChild.indexOf('both') != -1) {
					changeChildHorizontalBothBorders(newVal);
				} else {
					changeContainerHorizontalBothBorders(newVal);
				}
			} else {
				changeContainerHorizontalBothBordersFromSlide(newVal)
			}
		}

		function changeContainerLeftBorders(newVal) {
			var containerLeft = curNearestObjectsLeft.initedContainerLeft - newVal;


			for (var k in curNearestObjectsLeft.itemsArr) {
				var curTmpItem = curNearestObjectsLeft.itemsArr[k];
				var curLeftPercent = containerLeft / presentationObject.curWidth * 100;
				var diffPercent = curLeftPercent - parseFloat(curNearestObjectsLeft.itemsRight) / presentationObject.curWidth * 100;
				curTmpItem.itemRef.left = parseFloat(curNearestObjectsLeft.initedItemsLeft[k]) + diffPercent + '%';

			}
		}

		function changeContainerRightBorders(newVal) {

			var containerRightPercent = (parseFloat(curNearestObjectsRight.initedContainerRight) + newVal) / presentationObject.curWidth * 100;


			for (var k in curNearestObjectsRight.itemsArr) {
				var curTmpItem = curNearestObjectsRight.itemsArr[k];
				var diffPercent = containerRightPercent - parseFloat(curNearestObjectsRight.nearestCoord) / presentationObject.curWidth * 100;
				curTmpItem.itemRef.left = parseFloat(curNearestObjectsRight.initedItemsLeft[k]) + diffPercent + '%';

			}
		}

		function changeContainerLeftBordersFromSlide(newVal) {
			var containerLeft = curNearestObjectsLeft.initedContainerLeft + newVal;
			$scope.curItem.itemRef.left = containerLeft / presentationObject.curWidth * 100 + '%';
			var containerWidthPx = $scope.curItem.sizeInPx('width');
			var containerRight = containerLeft + containerWidthPx;

			for (var k in curNearestObjectsLeft.forRightBorders.itemsArr) {
				var otherContainer = curNearestObjectsLeft.forRightBorders.itemsArr[k];
				var otherItemLeftPx = curNearestObjectsLeft.forRightBorders.initedItemsLeft[k] * presentationObject.curWidth / 100;

				//Элемент справа
				if (containerRight > otherItemLeftPx) {
					var diff = containerRight - otherItemLeftPx;
					otherContainer.itemRef.left = (otherItemLeftPx + diff) / presentationObject.curWidth * 100 + '%';
				}
			}
		}

		function changeContainerRightBordersFromSlide(newVal) {
			var containerLeft = curNearestObjectsRight.initedContainerLeft - newVal;
			$scope.curItem.itemRef.left = containerLeft / presentationObject.curWidth * 100 + '%';

			for (var k in curNearestObjectsRight.forLeftBorders.itemsArr) {
				var otherContainer = curNearestObjectsRight.forLeftBorders.itemsArr[k];
				var otherItemLeftPx = curNearestObjectsRight.forLeftBorders.initedItemsLeft[k] * presentationObject.curWidth / 100;
				var otherItemWidthPx = otherContainer.sizeInPx('width');
				var otherItemRightPx = otherItemLeftPx + otherItemWidthPx

				//Элемент слева
				if (otherItemRightPx > containerLeft) {
					var diff = otherItemRightPx - containerLeft;
					otherContainer.itemRef.left = (otherItemLeftPx + diff) / presentationObject.curWidth * 100 + '%';
				}
			}
		}

		function changeContainerHorizontalBothBordersFromSlide(newVal) {
			var containerLeft;
			if (curNearestObjectsLeft.itemsArr.length == 0) {
				if (curNearestObjectsLeft.centerLeftForContainer < curNearestObjectsLeft.initedContainerLeft) {
					containerLeft = curNearestObjectsLeft.initedContainerLeft - newVal;
				} else {
					containerLeft = curNearestObjectsLeft.initedContainerLeft + newVal;
				}

			} else if (curNearestObjectsRight.itemsArr.length == 0) {
				if (curNearestObjectsLeft.centerLeftForContainer < curNearestObjectsLeft.initedContainerLeft) {
					containerLeft = curNearestObjectsLeft.initedContainerLeft + newVal;
				} else {
					containerLeft = curNearestObjectsLeft.initedContainerLeft - newVal;
				}
			}

			$scope.curItem.itemRef.left = containerLeft / presentationObject.curWidth * 100 + '%';
		}

		function changeContainerHorizontalBothBorders(newVal) {
			var diffValLeft = curNearestObjectsLeft.initedBorders;
			var diffValRight = curNearestObjectsRight.initedBorders;

			var newValPercent = newVal / presentationObject.curWidth * 100;
			var containerLeft = curNearestObjectsLeft.initedContainerLeft - newVal;
			var containerRightPercent = parseFloat($scope.curItem.itemRef.left) + parseFloat($scope.curItem.itemRef.width) + newValPercent;
			var containerNewRight = curNearestObjectsRight.initedContainerRight + newVal;

			var changeLeft = changeRight = true;

			if (containerLeft <= curNearestObjectsLeft.otherItemsWidth) {
				changeLeft = false;
				var leftDiff = curNearestObjectsLeft.otherItemsWidth - containerLeft;
				if (leftDiff > 1) {
					$scope.curItem.itemRef.left = (curNearestObjectsLeft.initedContainerLeft + leftDiff) / presentationObject.curWidth * 100 + '%';
				}
			}

			var rightMax = presentationObject.curWidth - curNearestObjectsRight.otherItemsWidth;
			if (containerNewRight >= rightMax) {
				changeRight = false;
				var rightDiff = containerNewRight - rightMax;
				$scope.curItem.itemRef.left = (curNearestObjectsLeft.initedContainerLeft - rightDiff) / presentationObject.curWidth * 100 + '%';
			}

			//TOP
			if (changeLeft)
				for (var k in curNearestObjectsLeft.itemsArr) {
					var curTmpItem = curNearestObjectsLeft.itemsArr[k];
					var curLeftPercent = containerLeft / presentationObject.curWidth * 100;
					var diffPercent = curLeftPercent - parseFloat(curNearestObjectsLeft.itemsRight) / presentationObject.curWidth * 100;
					curTmpItem.itemRef.left = parseFloat(curNearestObjectsLeft.initedItemsLeft[k]) + diffPercent + '%';
				}

			//BOTTOM
			if (changeRight)
				for (var k in curNearestObjectsRight.itemsArr) {
					var curTmpItem = curNearestObjectsRight.itemsArr[k];
					var diffPercent = containerRightPercent - parseFloat(curNearestObjectsRight.nearestCoord) / presentationObject.curWidth * 100;
					curTmpItem.itemRef.left = parseFloat(curNearestObjectsRight.initedItemsLeft[k]) + diffPercent + '%';
				}
		}

		$scope.$watch('layoutShow.verticalBorder', function(newVal) {
			newVal = parseFloat(newVal);
			if (!newVal) {
				return;
			}
			switch ($scope.curVerticalBordersSlider) {
				case 'top':
					changeTopBorders(newVal);
					break;

				case 'bottom':
					changeBottomBorders(newVal);
					break;

				case 'both':
					changeVerticalBothBorders(newVal);
					break;
			}
			if ($scope.curItem) {
				moveTextEtitPopup();
				// resizeItemContainer($scope.curItem, false);
			}
		});

		function changeTopBorders(newVal) {
			if ($scope.curPossibleVerticalChild.indexOf('top') != -1) {
				changeChildTopBorders(newVal);
			} else {
				if (curNearestObjectsTop.itemsArr.length == 0) {
					changeContainerTopBordersFromSlide(newVal);
				} else {
					changeContainerTopBorders(newVal);
				}
			}
		}

		function changeBottomBorders(newVal) {
			if ($scope.curPossibleVerticalChild.indexOf('bottom') != -1) {
				changeChildBottomBorders(newVal);
			} else {
				if (curNearestObjectsBottom.itemsArr.length == 0) {
					changeContainerBottomBordersFromSlide(newVal);
				} else {
					changeContainerBottomBorders(newVal);
				}

			}
		}

		function changeVerticalBothBorders(newVal) {

			if (curNearestObjectsBottom.itemsArr.length != 0 && curNearestObjectsTop.itemsArr.length != 0) {
				if ($scope.curPossibleVerticalChild.indexOf('both') != -1) {
					changeChildVerticalBothBorders(newVal);
				} else {
					changeContainerVerticalBothBorders(newVal);
				}
			} else {
				changeContainerVerticalBothBordersFromSlide(newVal)
			}
		}

		function changeContainerVerticalBothBordersFromSlide(newVal) {
			var containerTop;
			if (curNearestObjectsTop.itemsArr.length == 0) {
				if (curNearestObjectsTop.centerTopForContainer < curNearestObjectsTop.initedContainerTop) {
					containerTop = curNearestObjectsTop.initedContainerTop - newVal;
				} else {
					containerTop = curNearestObjectsTop.initedContainerTop + newVal;
				}
			} else if (curNearestObjectsBottom.itemsArr.length == 0) {
				if (curNearestObjectsTop.centerTopForContainer < curNearestObjectsTop.initedContainerTop) {
					containerTop = curNearestObjectsTop.initedContainerTop + newVal;
				} else {
					containerTop = curNearestObjectsTop.initedContainerTop - newVal;
				}
			}
			$scope.curItem.itemRef.top = containerTop / presentationObject.curHeight * 100 + '%';
		}

		function changeContainerTopBordersFromSlide(newVal) {
			var containerTop = curNearestObjectsTop.initedContainerTop + newVal;
			$scope.curItem.itemRef.top = containerTop / presentationObject.curHeight * 100 + '%';

			var curContainerBottom = containerTop + $scope.curItem.sizeInPx('height');

			for (var k in curNearestObjectsTop.forBottomBorders.itemsArr) {
				var otherContainer = curNearestObjectsTop.forBottomBorders.itemsArr[k];
				var otherItemTopPx = curNearestObjectsTop.forBottomBorders.initedItemsTop[k] * presentationObject.curHeight / 100;
				//Элемент снизу
				if (curContainerBottom > otherItemTopPx) {
					var diff = curContainerBottom - otherItemTopPx;
					otherContainer.itemRef.top = (otherItemTopPx + diff) / presentationObject.curHeight * 100 + '%';
				} else {
					otherContainer.itemRef.top = otherItemTopPx / presentationObject.curHeight * 100 + '%';
				}
			}
		}

		function changeContainerBottomBordersFromSlide(newVal) {

			var containerTop = curNearestObjectsTop.initedContainerTop - newVal;
			$scope.curItem.itemRef.top = containerTop / presentationObject.curHeight * 100 + '%';

			for (var k in curNearestObjectsBottom.forTopBorders.itemsArr) {
				var otherContainer = curNearestObjectsBottom.forTopBorders.itemsArr[k];
				var otherItemTopPx = curNearestObjectsBottom.forTopBorders.initedItemsTop[k] * presentationObject.curHeight / 100;
				var otherItemBottomPx = (otherItemTopPx + otherContainer.sizeInPx('height'));
				//Элемент снизу
				if (containerTop < otherItemBottomPx) {
					var diff = containerTop - otherItemBottomPx;
					otherContainer.itemRef.top = (otherItemTopPx + diff) / presentationObject.curHeight * 100 + '%';
				} else {
					otherContainer.itemRef.top = otherItemTopPx / presentationObject.curHeight * 100 + '%';
				}
			}
		}

		function changeContainerTopBorders(newVal) {
			var containerTop = curNearestObjectsTop.initedContainerTop - newVal;

			for (var k in curNearestObjectsTop.itemsArr) {
				var curTmpItem = curNearestObjectsTop.itemsArr[k];
				var curTopPercent = containerTop / presentationObject.curHeight * 100;
				var diffPercent = curTopPercent - parseFloat(curNearestObjectsTop.itemsBottom) / presentationObject.curHeight * 100;
				curTmpItem.itemRef.top = parseFloat(curNearestObjectsTop.initedItemsTop[k]) + diffPercent + '%';

			}
		}

		function changeContainerBottomBorders(newVal) {
			var newValPercent = newVal / presentationObject.curHeight * 100;
			var containerBottomPercent = parseFloat($scope.curItem.itemRef.top) + parseFloat($scope.curItem.itemRef.height) + newValPercent;

			for (var k in curNearestObjectsBottom.itemsArr) {
				var curTmpItem = curNearestObjectsBottom.itemsArr[k];
				var diffPercent = containerBottomPercent - parseFloat(curNearestObjectsBottom.nearestCoord) / presentationObject.curHeight * 100;
				curTmpItem.itemRef.top = parseFloat(curNearestObjectsBottom.initedItemsTop[k]) + diffPercent + '%';

			}
		}

		function changeContainerVerticalBothBorders(newVal) {
			var diffValTop = curNearestObjectsTop.initedBorders;
			var diffValBottom = curNearestObjectsBottom.initedBorders;

			//curNearestObjectsTop.minSide = 'bottom';

			var newValPercent = newVal / presentationObject.curHeight * 100;
			var containerTop = curNearestObjectsTop.initedContainerTop - newVal;
			var containerBottomPercent = parseFloat($scope.curItem.itemRef.top) + parseFloat($scope.curItem.itemRef.height) + newValPercent;
			var containerNewBottom = curNearestObjectsBottom.containerBottom + newVal;

			var changeTop = changeBottom = true;

			if (containerTop <= curNearestObjectsTop.otherItemsHeight) {
				changeTop = false;
				var topDiff = curNearestObjectsTop.otherItemsHeight - containerTop;
				if (topDiff > 1) {
					$scope.curItem.itemRef.top = (curNearestObjectsTop.initedContainerTop + topDiff) / presentationObject.curHeight * 100 + '%';
				}
			}

			var bottomMax = presentationObject.curHeight - curNearestObjectsBottom.otherItemsHeight;
			if (containerNewBottom >= bottomMax) {
				changeBottom = false;
				var bottomDiff = containerNewBottom - bottomMax;
				$scope.curItem.itemRef.top = (curNearestObjectsTop.initedContainerTop - bottomDiff) / presentationObject.curHeight * 100 + '%';
			}

			//TOP
			if (changeTop)
				for (var k in curNearestObjectsTop.itemsArr) {
					var curTmpItem = curNearestObjectsTop.itemsArr[k];
					var curTopPercent = containerTop / presentationObject.curHeight * 100;
					var diffPercent = curTopPercent - parseFloat(curNearestObjectsTop.itemsBottom) / presentationObject.curHeight * 100;
					curTmpItem.itemRef.top = parseFloat(curNearestObjectsTop.initedItemsTop[k]) + diffPercent + '%';
				}

			//BOTTOM
			if (changeBottom)
				for (var k in curNearestObjectsBottom.itemsArr) {
					var curTmpItem = curNearestObjectsBottom.itemsArr[k];
					var diffPercent = containerBottomPercent - parseFloat(curNearestObjectsBottom.nearestCoord) / presentationObject.curHeight * 100;
					curTmpItem.itemRef.top = parseFloat(curNearestObjectsBottom.initedItemsTop[k]) + diffPercent + '%';
				}
		}

		function changeChildTopBorders(newVal) {
			//$scope.layoutShow.initedVerticalParams

			var containerTop = $scope.layoutShow.initedVerticalParams.containerTop - newVal;
			var containerHeight = $scope.layoutShow.initedVerticalParams.containerHeight + newVal;
			var childInContainerTop = $scope.layoutShow.initedVerticalParams.childInContainerTop + newVal;

			$scope.curItem.itemRef.top = containerTop / presentationObject.curHeight * 100 + '%';
			$scope.curItem.itemRef.height = containerHeight / presentationObject.curHeight * 100 + '%';
			$scope.curItem.curActiveChildItem.itemRef.top = childInContainerTop / containerHeight * 100 + '%';
			$scope.curItem.curActiveChildItem.itemRef.height = curNearestObjectsTop.initedCurIntemInContainerHeight / containerHeight * 100 + '%';

			for (var k in $scope.curItem.childItems) {
				if (k == curNearestObjectsTop.curActiveChild)
					continue;

				if (curNearestObjectsTop.dependentItemsIndexes.indexOf(k) == -1) {
					var newTopPx = parseFloat(curNearestObjectsTop.itemsInitedSize[k].top) + newVal;
					$scope.curItem.childItems[k].itemRef.top = newTopPx / containerHeight * 100 + '%';
				} else {
					$scope.curItem.childItems[k].itemRef.top = curNearestObjectsTop.itemsInitedSize[k].top / containerHeight * 100 + '%';
				}

				$scope.curItem.childItems[k].itemRef.height = curNearestObjectsTop.itemsInitedSize[k].height / containerHeight * 100 + '%';
			}


			if (containerTop <= parseFloat(curNearestObjectsTop.itemsBottom)) {
				//Двигаем контейнеры сверху
				for (var k in curNearestObjectsTop.itemsArr) {
					var curTmpItem = curNearestObjectsTop.itemsArr[k];
					var curTopPercent = containerTop / presentationObject.curHeight * 100;
					var diffPercent = curTopPercent - parseFloat(curNearestObjectsTop.itemsBottom) / presentationObject.curHeight * 100;
					curTmpItem.itemRef.top = parseFloat(curNearestObjectsTop.initedItemsTop[k]) + diffPercent + '%';
				}
			} else {
				for (var k in curNearestObjectsTop.itemsArr) {
					curNearestObjectsTop.itemsArr[k].itemRef.top = curNearestObjectsTop.initedItemsTop[k] + '%';
				}
			}
		}

		function changeChildBottomBorders(newVal) {
			var containerTop = $scope.curItem.sizeInPx('top');
			var containerHeight = $scope.curItem.sizeInPx('height');
			var containerBottom = containerHeight + containerTop;
			var containerBottomPercent = parseFloat($scope.curItem.itemRef.top) + parseFloat($scope.curItem.itemRef.height);

			var containerNewHeight = $scope.layoutShow.initedVerticalParams.containerHeight + newVal;
			$scope.curItem.itemRef.height = containerNewHeight / presentationObject.curHeight * 100 + '%';

			//Изменить высоту контейнера, у остальных пересчитать top и height
			for (var k in $scope.curItem.childItems) {
				if (curNearestObjectsBottom.dependentItemsIndexes.indexOf(k) != -1) {
					var newTopPx = parseFloat(curNearestObjectsBottom.itemsInitedSize[k].top) + newVal;
					$scope.curItem.childItems[k].itemRef.top = newTopPx / containerNewHeight * 100 + '%';
				} else {
					$scope.curItem.childItems[k].itemRef.top = curNearestObjectsBottom.itemsInitedSize[k].top / containerNewHeight * 100 + '%';
				}

				$scope.curItem.childItems[k].itemRef.height = curNearestObjectsBottom.itemsInitedSize[k].height / containerNewHeight * 100 + '%';
			}


			if (containerBottom >= parseFloat(curNearestObjectsBottom.nearestCoord)) {
				// Двигаем контейнеры вниз
				for (var k in curNearestObjectsBottom.itemsArr) {
					var curTmpItem = curNearestObjectsBottom.itemsArr[k];
					var diffPercent = containerBottomPercent - parseFloat(curNearestObjectsBottom.nearestCoord) / presentationObject.curHeight * 100;
					curTmpItem.itemRef.top = parseFloat(curNearestObjectsBottom.initedItemsTop[k]) + diffPercent + '%';
				}

			} else {
				for (var k in curNearestObjectsBottom.itemsArr) {
					curNearestObjectsBottom.itemsArr[k].itemRef.top = curNearestObjectsBottom.initedItemsTop[k] + '%';
				}
			}
		}

		function changeChildVerticalBothBorders(newVal) {
			var containerTop = $scope.curItem.sizeInPx('top', presentationObject.curHeight);
			var containerHeight = $scope.curItem.sizeInPx('height', presentationObject.curHeight);
			var containerBottom = containerHeight + containerTop;
			var containerBottomPercent = parseFloat($scope.curItem.itemRef.top) + parseFloat($scope.curItem.itemRef.height);
			var containerNewHeight = $scope.layoutShow.initedVerticalParams.containerHeight + newVal;
			var containerNewTop = $scope.layoutShow.initedVerticalParams.containerTop - newVal / 2;
			var containerNewBottom = containerNewHeight + containerNewTop;

			if (containerNewTop > curNearestObjectsTop.otherItemsHeight)
				$scope.curItem.itemRef.top = containerNewTop / presentationObject.curHeight * 100 + '%';

			if (containerNewBottom >= presentationObject.curHeight) {
				var diff = containerNewBottom - presentationObject.curHeight;
				$scope.curItem.itemRef.top = (containerNewTop - diff) / presentationObject.curHeight * 100 + '%';
			}

			$scope.curItem.itemRef.height = containerNewHeight / presentationObject.curHeight * 100 + '%';

			for (var k in $scope.curItem.childItems) {
				$scope.curItem.childItems[k].itemRef.height = curNearestObjectsBottom.itemsInitedSize[k].height / containerNewHeight * 100 + '%';

				if (k == curNearestObjectsTop.curActiveChild) {
					var newTopPx = parseFloat(curNearestObjectsTop.itemsInitedSize[k].top) + newVal / 2;
					$scope.curItem.childItems[k].itemRef.top = newTopPx / containerNewHeight * 100 + '%';
					continue;
				}

				//Bottom
				if (curNearestObjectsBottom.dependentItemsIndexes.indexOf(k) != -1) {
					var newTopPx = parseFloat(curNearestObjectsBottom.itemsInitedSize[k].top) + newVal;
					$scope.curItem.childItems[k].itemRef.top = newTopPx / containerHeight * 100 + '%';
				} else {
					$scope.curItem.childItems[k].itemRef.top = curNearestObjectsBottom.itemsInitedSize[k].top / containerNewHeight * 100 + '%';
				}

				//top
				if (curNearestObjectsTop.dependentItemsIndexes.indexOf(k) == -1) {
					var newTopPx = parseFloat(curNearestObjectsTop.itemsInitedSize[k].top) + newVal;
					$scope.curItem.childItems[k].itemRef.top = newTopPx / containerNewHeight * 100 + '%';
				} else {
					$scope.curItem.childItems[k].itemRef.top = curNearestObjectsTop.itemsInitedSize[k].top / containerNewHeight * 100 + '%';
				}

			}

			if (containerTop <= parseFloat(curNearestObjectsTop.itemsBottom)) {
				//Двигаем контейнеры сверху
				for (var k in curNearestObjectsTop.itemsArr) {
					var curTmpItem = curNearestObjectsTop.itemsArr[k];
					var curTopPercent = containerTop / presentationObject.curHeight * 100;
					var diffPercent = curTopPercent - parseFloat(curNearestObjectsTop.itemsBottom) / presentationObject.curHeight * 100;
					curTmpItem.itemRef.top = parseFloat(curNearestObjectsTop.initedItemsTop[k]) + diffPercent + '%';
				}
			} else {
				for (var k in curNearestObjectsTop.itemsArr) {
					curNearestObjectsTop.itemsArr[k].itemRef.top = curNearestObjectsTop.initedItemsTop[k] + '%';
				}
			}

			if (containerBottom >= parseFloat(curNearestObjectsBottom.nearestCoord)) {
				// Двигаем контейнеры вниз
				for (var k in curNearestObjectsBottom.itemsArr) {
					var curTmpItem = curNearestObjectsBottom.itemsArr[k];
					var diffPercent = containerBottomPercent - parseFloat(curNearestObjectsBottom.nearestCoord) / presentationObject.curHeight * 100;
					curTmpItem.itemRef.top = parseFloat(curNearestObjectsBottom.initedItemsTop[k]) + diffPercent + '%';
				}

			} else {
				for (var k in curNearestObjectsBottom.itemsArr) {
					curNearestObjectsBottom.itemsArr[k].itemRef.top = curNearestObjectsBottom.initedItemsTop[k] + '%';
				}
			}
		}

		function findForTopNearest(container) {
			//Поиск элементов над текщим
			var itemsArray = new Array();
			var curRight = parseFloat(container.itemRef.left) + parseFloat(container.itemRef.width);
			//var curBottom = parseFloat(container.itemRef.top) + parseFloat(container.itemRef.height);
			var nearestTop = 100;
			var nearestBottom = 0;
			var topArr = new Array();
			var bottomArr = new Array();
			for (var k in $scope.curslide.items) {
				if (k == curActiveItem)
					continue;
				var tmpItem = $scope.curslide.items[k];
				var tmpRight = parseFloat(tmpItem.itemRef.left) + parseFloat(tmpItem.itemRef.width);
				var tmpBottom = parseFloat(tmpItem.itemRef.top) + parseFloat(tmpItem.itemRef.height);
				if ((parseFloat(container.itemRef.top) >= tmpBottom) && (tmpRight >= parseFloat(container.itemRef.left)) && (parseFloat(tmpItem.itemRef.left) <= curRight)) {
					if (parseFloat(tmpItem.itemRef.top) < nearestTop)
						nearestTop = parseFloat(tmpItem.itemRef.top);
					var tmpBottom = parseFloat(tmpItem.itemRef.top) + parseFloat(tmpItem.itemRef.height)
					if (nearestBottom < tmpBottom)
						nearestBottom = tmpBottom;
					itemsArray.push(tmpItem);
					topArr.push(parseFloat(tmpItem.itemRef.top));
					bottomArr.push(tmpBottom);
				}
			}
			nearestTopPx = parseFloat(nearestTop) * presentationObject.curHeight / 100;
			nearestBottom = parseFloat(nearestBottom) * presentationObject.curHeight / 100;

			return {
				nearestCoord: nearestTopPx,
				nearestCoordPercent: nearestTop,
				itemsBottom: nearestBottom,
				initedItemsTop: topArr,
				initedItemsBottom: bottomArr,
				itemsArr: itemsArray,
			}
		}

		function findForBottomNearest(container) {
			//поиск элементов под текущим
			var itemsArray = new Array();
			var curRight = parseFloat(container.itemRef.left) + parseFloat(container.itemRef.width);
			var curBottom = parseFloat(container.itemRef.top) + parseFloat(container.itemRef.height);
			var nearestTop = 100;
			var nearestBottom = 0;
			var topArr = new Array();
			for (var k in $scope.curslide.items) {
				if (k == curActiveItem)
					continue;
				var tmpItem = $scope.curslide.items[k];
				var tmpRight = parseFloat(tmpItem.itemRef.left) + parseFloat(tmpItem.itemRef.width);
				if ((parseFloat(tmpItem.itemRef.top) >= curBottom) && (tmpRight >= parseFloat(container.itemRef.left)) && (parseFloat(tmpItem.itemRef.left) <= curRight)) {
					if (parseFloat(tmpItem.itemRef.top) < nearestTop)
						nearestTop = parseFloat(tmpItem.itemRef.top);
					var tmpBottom = parseFloat(tmpItem.itemRef.top) + parseFloat(tmpItem.itemRef.height)
					if (nearestBottom < tmpBottom)
						nearestBottom = tmpBottom;
					itemsArray.push(tmpItem);
					topArr.push(parseFloat(tmpItem.itemRef.top));
				}
			}
			nearestTopPx = parseFloat(nearestTop) * presentationObject.curHeight / 100;
			nearestBottom = parseFloat(nearestBottom) * presentationObject.curHeight / 100;
			return {
				nearestCoord: nearestTopPx,
				nearestCoordPercent: nearestTop,
				itemsBottom: nearestBottom,
				initedItemsTop: topArr,
				itemsArr: itemsArray,
			}
		}

		function findForRightNearest(container) {
			//поиск элементов под текущим
			var itemsArray = new Array();
			var curRight = parseFloat(container.itemRef.left) + parseFloat(container.itemRef.width);
			var curBottom = parseFloat(container.itemRef.top) + parseFloat(container.itemRef.height);
			var nearestLeft = 100;
			var nearestRight = 0;
			var leftArr = new Array();
			for (var k in $scope.curslide.items) {
				if (k == curActiveItem)
					continue;
				var tmpItem = $scope.curslide.items[k];
				var tmpRight = parseFloat(tmpItem.itemRef.left) + parseFloat(tmpItem.itemRef.width);
				var tmpBottom = parseFloat(tmpItem.itemRef.top) + parseFloat(tmpItem.itemRef.height);
				if ((parseFloat(tmpItem.itemRef.left) >= curRight) && (parseFloat(tmpItem.itemRef.top) <= curBottom) && (tmpBottom >= parseFloat(container.itemRef.top))) {
					if (tmpRight > nearestRight)
						nearestRight = tmpRight;

					if (parseFloat(tmpItem.itemRef.left) < nearestLeft)
						nearestLeft = parseFloat(tmpItem.itemRef.left);

					itemsArray.push(tmpItem);
					leftArr.push(parseFloat(tmpItem.itemRef.left));
				}
			}
			nearestLeftPx = parseFloat(nearestLeft) * presentationObject.curWidth / 100;
			nearestRight = parseFloat(nearestRight) * presentationObject.curWidth / 100;
			return {
				nearestCoord: nearestLeftPx,
				nearestCoordPercent: nearestLeft,
				itemsRight: nearestRight,
				initedItemsLeft: leftArr,
				itemsArr: itemsArray,
			}
		}

		function findForLeftNearest(container) {
			//поиск элементов под текущим
			var itemsArray = new Array();
			var curRight = parseFloat(container.itemRef.left) + parseFloat(container.itemRef.width);
			var curBottom = parseFloat(container.itemRef.top) + parseFloat(container.itemRef.height);
			var nearestLeft = 100;
			var nearestRight = 0;
			var leftArr = new Array();
			for (var k in $scope.curslide.items) {
				if (k == curActiveItem)
					continue;
				var tmpItem = $scope.curslide.items[k];
				var tmpRight = parseFloat(tmpItem.itemRef.left) + parseFloat(tmpItem.itemRef.width);
				var tmpBottom = parseFloat(tmpItem.itemRef.top) + parseFloat(tmpItem.itemRef.height);
				if ((parseFloat(container.itemRef.left) >= tmpRight) && (parseFloat(tmpItem.itemRef.top) <= curBottom) && (tmpBottom >= parseFloat(container.itemRef.top))) {

					if (tmpRight > nearestRight)
						nearestRight = tmpRight;

					if (parseFloat(tmpItem.itemRef.left) < nearestLeft)
						nearestLeft = parseFloat(tmpItem.itemRef.left);

					itemsArray.push(tmpItem);
					leftArr.push(parseFloat(tmpItem.itemRef.left));
				}
			}
			nearestLeftPx = parseFloat(nearestLeft) * presentationObject.curWidth / 100;
			nearestRight = parseFloat(nearestRight) * presentationObject.curWidth / 100;
			return {
				nearestCoord: nearestLeftPx,
				nearestCoordPercent: nearestLeft,
				itemsRight: nearestRight,
				initedItemsLeft: leftArr,
				itemsArr: itemsArray,
			}
		}

		$scope.detachElement = function() {
			var newZIndex = parseInt($scope.curItemContainer.css('z-index')) + 100;

			var detachedItemIndex;
			switch ($scope.curItem.curActiveChildItem.key) {
				case 'textItem':
					detachedItemIndex = tmpTextItemNumber;
					break;
				case 'objectItem':
					detachedItemIndex = tmpImageItemNumber;
					break;
			}
			var detachedItem = clone($scope.curItem.curActiveChildItem);

			var prevContainerTop = $scope.curItem.itemRef.top;
			var prevContainerLeft = $scope.curItem.itemRef.left;

			var prevContainerHeight = $scope.curItem.itemRef.height;
			var prevContainerWidth = $scope.curItem.itemRef.width;

			var itemTop = $scope.curItem.curActiveChildItem.itemRef.top;
			var itemLeft = $scope.curItem.curActiveChildItem.itemRef.left;

			//Удалить из предыдущего массива
			deleteChildItem($scope.curItem, detachedItemIndex);

			addNewItem(detachedItem);

			//Позиуионирование нового элемента
			// detachedItem.itemRef.top  = '100px';


			if (typeof prevContainerTop == "string")
				if ((prevContainerTop.indexOf("%") != -1)) {
					prevContainerTop = parseFloat(prevContainerTop) * presentationObject.curHeight / 100;
				}

			if (typeof prevContainerLeft == "string")
				if (prevContainerLeft.indexOf("%") != -1) {
					prevContainerLeft = parseFloat(prevContainerLeft) * presentationObject.curWidth / 100;
				}


			if (typeof prevContainerHeight == "string")
				if ((prevContainerHeight.indexOf("%") != -1)) {
					prevContainerHeight = parseFloat(prevContainerHeight) * presentationObject.curHeight / 100;
				}

			if (typeof prevContainerWidth == "string")
				if (prevContainerWidth.indexOf("%") != -1) {
					prevContainerWidth = parseFloat(prevContainerWidth) * presentationObject.curWidth / 100;
				}

			if (typeof itemTop == "string") {
				if ((itemTop.indexOf("%") != -1)) {
					itemTop = parseFloat(itemTop) * prevContainerHeight / 100 + prevContainerTop;
				}
			} else {
				itemTop = itemTop + prevContainerTop;
			}

			if (typeof itemLeft == "string") {
				if (itemLeft.indexOf("%") != -1) {
					itemLeft = parseFloat(itemLeft) * prevContainerWidth / 100 + prevContainerLeft;
				}
			} else {
				itemLeft = itemLeft + prevContainerLeft;
			}

			if (itemLeft > 10)
				itemLeft -= 10;
			else
				itemLeft += 10;

			if (itemTop + 20 < presentationObject.curHeight)
				itemTop += 10;
			else
				itemTop -= 10;

			$scope.curItem.itemRef.top = itemTop / presentationObject.curHeight * 100 + '%';
			$scope.curItem.itemRef.left = itemLeft / presentationObject.curWidth * 100 + '%';

			moveTextEtitPopup();
			$scope.curItemContainer.css('z-index', newZIndex);
		}

		//***********************ОКНО РЕДАКТОРА ВЕРСТКИ И КОМПОНОВКИ***************

		$scope.$watch('layoutShow.slidePosition', function(newVal) {
			if ($scope.curItem) {
				var newVal = parseInt(newVal)
				$scope.curItemContainer.css('z-index', newVal);
				if ($scope.curslide.maxZIndex < newVal)
					$scope.curslide.maxZIndex = newVal
			}
		});

		$scope.oneLayoutUp = function() {
			if ($scope.curItem) {
				var newLayoutPosition = parseInt($scope.layoutShow.slidePosition) + 1;
				$scope.layoutShow.slidePosition = newLayoutPosition;
				$scope.curItemContainer.css('z-index', newLayoutPosition);
				if ($scope.curslide.maxZIndex < newLayoutPosition)
					$scope.curslide.maxZIndex = newLayoutPosition
			}
		}

		$scope.oneLayoutDown = function() {
			if ($scope.curItem) {
				var layoutPosition = parseInt($scope.layoutShow.slidePosition);
				// if (layoutPosition == $scope.curslide.maxZIndex)
				// 	$scope.curslide.maxZIndex --;
				layoutPosition--;
				if (layoutPosition > 0) {
					$scope.layoutShow.slidePosition = layoutPosition;
					$scope.curItemContainer.css('z-index', layoutPosition);
				}
			}
		}

		$scope.allLayoutUp = function() {
			if ($scope.curItem) {
				$scope.curslide.maxZIndex++;
				$scope.layoutShow.slidePosition = $scope.curslide.maxZIndex;
				$scope.curItemContainer.css('z-index', $scope.curslide.maxZIndex);
			}
		}

		$scope.allLayoutDown = function() {
				if ($scope.curItem) {
					var newLayoutPosition = 1;
					$scope.layoutShow.slidePosition = newLayoutPosition;
					$scope.curItemContainer.css('z-index', newLayoutPosition);
				}
			}
			//***********************Окно редактора стилей*****************************

		$scope.fonts = [{
			value: 'PT Sans',
			fontFamily: 'PT Sans'
		}, {
			value: 'Open Sans Condensed',
			fontFamily: 'Open Sans Cond'
		}, {
			value: 'PT Sans Caption',
			fontFamily: 'PT Sans Cap'
		}, {
			value: 'Roboto Slab',
			fontFamily: 'Roboto Slab'
		}, {
			value: 'Lobster',
			fontFamily: 'Lobster'
		}];

		var font_color = presentationObject.template.font.font_color;

		$scope.colors = [{
			background: font_color.firstCode
		}, {
			background: font_color.secondCode
		}, {
			background: font_color.thirdCode
		}, {
			background: font_color.fourthCode
		}];


		$scope.$watch('stylesShow.detail.letterSpacing', function(newVal, oldVal) {
			if ($scope.curItem) {
				var newSpacing = parseFloat(newVal);
				if (newSpacing >= 0 && newSpacing <= 30) {
					$scope.curItem.curActiveChildItem.css['letter-spacing'] = newSpacing + 'px';
					resizeItemContainer($scope.curItem, true);
				} else if (newSpacing > 30) {
					$scope.stylesShow.detail.letterSpacing = 30;
					$scope.curItem.curActiveChildItem.css['letter-spacing'] = '30px';
					resizeItemContainer($scope.curItem, true);
				} else if (newSpacing < 0) {
					$scope.stylesShow.detail.letterSpacing = 0;
					$scope.curItem.curActiveChildItem.css['letter-spacing'] = '0px';
					resizeItemContainer($scope.curItem, true);
				}
			}

		});

		$scope.$watch('stylesShow.detail.opacity', function(newVal, oldVal) {
			if ($scope.curItem) {

				newVal = 1 - parseFloat(newVal) / 100;

				if (newVal > 0 && newVal <= 100) {
					$scope.curItem.curActiveChildItem.css['opacity'] = newVal;
				} else if (newVal > 100) {
					$scope.stylesShow.detail.opacity = 100;
					$scope.curItem.curActiveChildItem.css['opacity'] = '100';
				} else if (newVal < 0) {
					$scope.stylesShow.detail.opacity = 0;
					$scope.curItem.curActiveChildItem.css['opacity'] = '0';
				}


			}
		});

		$scope.initImageShow = function() {}

		$scope.initStyleShow = function() { //Инициализация левого ассистента подбора стилей
			if (!$scope.curItem.curActiveChildItem) {
				switch ($scope.curItem.childItems[0].key) {
					case 'textItem':
						$scope.textClick(0);
						break;
					case 'objectItem':
						$scope.imageItemClick(0);
						break;
				}
				itemClick(curActiveItem);
			}

			$scope.stylesShow.possibleTextTypes = new Array();
			var i = 0;
			for (var k in textBlocksText) {
				if (k == $scope.curItem.curActiveChildItem.textType)
					$scope.stylesShow.curTextName = textBlocksText[k];
				else {
					$scope.stylesShow.possibleTextTypes[i] = new Object();
					$scope.stylesShow.possibleTextTypes[i].type = k;
					$scope.stylesShow.possibleTextTypes[i].name = textBlocksText[k];
					i++;
				}
			}

			$scope.stylesShow.detail.possibleFontSizes = new Array();
			$scope.stylesShow.detail.possibleLineHeight = new Array();

			var fontSizeForPossble = 8;
			for (i = 0; i < 12; i++) {
				$scope.stylesShow.detail.possibleFontSizes[i] = fontSizeForPossble;
				fontSizeForPossble += 2;
			}
			$scope.stylesShow.detail.possibleFontSizes[12] = 36;
			$scope.stylesShow.detail.possibleFontSizes[13] = 48;
			$scope.stylesShow.detail.possibleFontSizes[14] = 72;


			var lineHeightForPossble = 0.5;
			for (i = 0; i <= 6; i++) {
				$scope.stylesShow.detail.possibleLineHeight[i] = lineHeightForPossble;
				lineHeightForPossble += 0.5;
			}

			$scope.stylesShow.detail.choosedFamily = $scope.curItem.curActiveChildItem.css['font-family'];
			//$scope.stylesShow.detail.fontSize = parseFloat($scope.curItem.curActiveChildItem.css['font-size']);
			//Ини
			$scope.stylesShow.detail.curTextFontSize = convertFontSize(parseFloat($scope.curItem.curActiveChildItem.css['font-size']), 'em', 'pt');
			// for (var k in $scope.stylesShow.detail.possibleFontSizes) {
			// 	if ($scope.stylesShow.detail.curTextFontSize <= $scope.stylesShow.detail.possibleFontSizes[k]) {
			// 		$scope.stylesShow.detail.curTextFontSize = $scope.stylesShow.detail.possibleFontSizes[k];
			// 		break;
			// 	}
			// }
			$scope.stylesShow.detail.letterSpacing = ($scope.curItem.curActiveChildItem.css['letter-spacing']) ? $scope.curItem.curActiveChildItem.css['letter-spacing'] : parseFloat(DOMElement.css('letter-spacing'));

			var lineHeight;
			if ($scope.curItem.curActiveChildItem.css['line-height']) {
				lineHeight = $scope.curItem.curActiveChildItem.css['line-height'];
			} else {
				var elementLineHeight = DOMElement.css('line-height');
				if ((DOMElement.css('line-height') == 'normal') || (DOMElement.css('line-height') == 0)) {
					lineHeight = '1.5';
				} else {
					lineHeight = parseFloat(DOMElement.css('line-height'));
					lineHeight = (lineHeight / $scope.stylesShow.detail.fontSize).toFixed(2);
				}
			}
			$scope.stylesShow.detail.lineHeight = lineHeight;

			$scope.stylesShow.detail.opacity = ($scope.curItem.curActiveChildItem.css['opacity']) ? (100 - 100 * $scope.curItem.curActiveChildItem.css['opacity']) : 0;


			try {
				var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
				var editor = CKEDITOR.instances[instanceId];

				// var element = editor.getSelection().getSelectedElement();
				var selection = editor.getSelection();
				var element = editor.getSelection().getStartElement();
				editor.getStylesSet(function(stylesDefinitions) {});


			} catch (e) {}

			resizeItemContainer($scope.curItem, false);
		}

		$scope.setTextLineHeight = function(lineHeight) {
			$scope.stylesShow.detail.lineHeight = lineHeight;
			$scope.curItem.curActiveChildItem.css['line-height'] = lineHeight + '';
			resizeItemContainer($scope.curItem, false);
		}

		$scope.$watch('stylesShow.detail.lineHeight', function(newVal, oldVal) {
			if ($scope.curItem) {
				if (newVal >= 0.5 && newVal <= 3) {
					$scope.setTextLineHeight(newVal)
				} else if (newVal > 3) {
					$scope.setTextLineHeight(3);
				} else if (newVal < 0.5) {
					$scope.setTextLineHeight(0.5);
				}
			}
		});

		$scope.textStyleChange = function(command) {
			if ($scope.curItem) {
				if (!$scope.curItem.curActiveChildItem)
					return
				var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
				// var instanceId = 'textEditor' + $scope.curActiveSlide + '' + curActiveItem + '' + tmpTextItemNumber;
				ExecuteCommand(command, instanceId)
				resizeItemContainer($scope.curItem, true)
			}

		}

		$scope.textStyleClass = function(thisStyleType) {
			//Не сделано потому что надо получить выделенный контент и узнать, какой стиль к нему применен
			//fourButtonsInOneLine_active
			if ($scope.curItem) {
				if (!$scope.curItem.curActiveChildItem)
					return;
				if ($scope.curItem.curActiveChildItem.key != 'textItem')
					return;
				var instanceId = $scope.curItem.curActiveChildItem.textEditorId;
				var editor = CKEDITOR.instances[instanceId];
				var element = editor.getSelection().getStartElement();
				if (!element)
					return '';
				var needStyle;
				switch (thisStyleType) {
					case 'bold':
						needStyle = 'font-weight';
						break;
					case 'italic':
						needStyle = 'font-style';
						break;
					case 'underline':
						needStyle = 'text-decoration';
						break;
					case 'line-through':
						needStyle = 'text-decoration';
						break;
				}

				var style = element.getComputedStyle(needStyle);
				if (style == thisStyleType) {
					return 'fourButtonsInOneLine_active';
				} else {
					var parent = element.getParent();
					if (parent) {
						var parentId = parent.getId();
						if (parentId) {
							if (parentId.indexOf('textEditor') == -1) {
								return checkForParentStyle(parent, thisStyleType, needStyle);
							} else {
								return '';
							}
						} else {
							return checkForParentStyle(parent, thisStyleType, needStyle);
						}
					}
				}
			}
		}

		function checkForParentStyle(element, thisStyleType, needStyle) {
			var style = element.getComputedStyle(needStyle);
			if (style == thisStyleType) {
				return 'fourButtonsInOneLine_active';
			} else {
				var parent = element.getParent();
				if (parent) {
					var parentId = parent.getId();
					if (parentId) {
						if (parentId.indexOf('textEditor') == -1) {
							return checkForParentStyle(parent, thisStyleType, needStyle);
						} else {
							return '';
						}
					} else {
						return checkForParentStyle(parent, thisStyleType, needStyle);
					}
				}
			}
		}

		$scope.setTextFontSize = function(fontSize) {
			$scope.curItem.curActiveChildItem.css['font-size'] = convertFontSize(fontSize, 'pt', 'em') + 'em';

			var prevWidth = $scope.curItem.itemRef.width;
			resizeItemContainer($scope.curItem, true);
			var right = parseFloat($scope.curItem.itemRef.width) + parseFloat($scope.curItem.itemRef.left);
			if (right > 99) {
				$scope.curItem.itemRef.width = parseFloat(prevWidth) + '%';
				resizeItemContainer($scope.curItem, false);
			}
			var bordersPercentWidth = parseFloat(bordersSize) / presentationObject.curWidth * 100;
			$scope.curItem.itemRef.width = parseFloat($scope.curItem.itemRef.width) + bordersPercentWidth + '%';

			$scope.stylesShow.detail.curTextFontSize = fontSize;
		}

		$scope.$watch('stylesShow.detail.curTextFontSize', function(newVal, oldVal) {
			if ($scope.curItem) {
				$scope.setTextFontSize(newVal);
			}
		});



		$scope.changeTextFontFamily = function(fontFamily) {
			$scope.curItem.curActiveChildItem.css['font-family'] = fontFamily;
			$scope.stylesShow.detail.choosedFamily = fontFamily;
			resizeItemContainer($scope.curItem, true);
		}

		$scope.textAlignClass = function(alignType) {

			if (($scope.curItem) && ($scope.curItem.curActiveChildItem)) {
				if ($scope.curItem.curActiveChildItem.css['text-align']) {
					if ($scope.curItem.curActiveChildItem.css['text-align'] == alignType)
						return 'fourButtonsInOneLine_active';
				} else if (alignType == 'left') {
					return 'fourButtonsInOneLine_active';
				}
			}
		}

		//Выключка текста
		$scope.changeTextAlign = function(align) {
			$scope.curItem.curActiveChildItem.css['text-align'] = align;
			if (align == 'left') {
				$scope.curItem.curActiveChildItem.css.width = '150%';
			} else {
				$scope.curItem.curActiveChildItem.css.width = '100%';
			}

		}

		$scope.changeTextType = function(newType) {
			var fontStyle = $scope.template.font.fontStyles[$scope.curslide.slideType][newType];
			for (var k in fontStyle)
				$scope.curItem.curActiveChildItem.css[k] = fontStyle[k]
			$scope.curItem.curActiveChildItem.textType = newType;
			$scope.curItem.cleanBestAreas();
			// if ($scope.curItem.showAreas) {
			// 	var curSlideType = $scope.curslide.slideType
			// 	for (var area in $scope.bestAreas[curSlideType].text[newType])
			// 		$scope.curItem.addBestArea($scope.bestAreas[curSlideType].text[newType][area]);
			// }
			resizeItemContainer($scope.curItem, true);
			// hideAreas()
			// showBestAreas(curActiveItem)
			$scope.stylesShow.curTextName = textBlocksText[newType];
			// checkForArea();
			moveTextEtitPopup(curActiveItem);

		}

		$scope.plusStyles = function(name) {
			$scope.stylesShow.detail[name] = parseFloat($scope.stylesShow.detail[name]) + 1;
		}

		$scope.reColorActiveText = function(newColor) {
			$scope.curItem.curActiveChildItem.css.color = newColor;
		}

		$scope.itemPosTop = function() {
			$scope.curItem.curActiveChildItem.css['position'] = 'absolute';
			$scope.curItem.curActiveChildItem.css['top'] = '0px';
			$scope.curItem.curActiveChildItem.css['bottom'] = '';
		}

		$scope.itemPosVerticalCenter = function() {
			$scope.curItem.curActiveChildItem.css['position'] = 'absolute';
			$scope.curItem.curActiveChildItem.css['top'] = '30%';
			$scope.curItem.curActiveChildItem.css['bottom'] = '';
		}

		$scope.itemPosDown = function() {
			$scope.curItem.curActiveChildItem.css['position'] = 'absolute';
			$scope.curItem.curActiveChildItem.css['bottom'] = '0px';
			$scope.curItem.curActiveChildItem.css['top'] = '';
		}

		/************************СОЗДАНИЕ МОДУЛЬНОЙ СЕТКИ МИКРО УРОВНЯ*********************************/

		$scope.colNum = 10; // стандартное количество столбцов

		$(window).resize(function() {
			slide_popup_on($scope.curActiveSlide, $scope.slides.length + 1);
			// setTimeout(function() {
			// 	$scope.initGrid($scope.colNum);
			// }, 1);
		});

		//-------------------------------------------ИНИЦИАЛИЗАЦИЯ МИКРОУРОВНЕВОЙ СЕТКИ

		$scope.initGrid = function(colNum) {
			baseLineSize = 30 * presentationObject.curWidth / 1920;
			rowAndSquareHeight = baseLineSize * 4 + 2; //высота row и square
			squareWidth = (presentationObject.curWidth - baseLineSize * $scope.colNum) / $scope.colNum;

			$scope.rowCss = {
				"height": rowAndSquareHeight,
				"padding-top": baseLineSize
			}
			$scope.squareCss = {
				"width": squareWidth, // ширина square
				"margin-left": baseLineSize
			}
			$scope.lineCss = {
				"height": baseLineSize
			}

			generateMicroGrid();

			$scope.rowClass = function(item, index) {
				if (index == 0) {
					$('.row:first-child').css({
						"padding-top": baseLineSize / 1.5
					});
				}
				return '';
			}

			setTextToBaseLine();
		}

		//-------------------------------------------------ГЕНЕРАЦИЯ МИКРОУРОВНЕВОЙ СЕТКИ

		function generateMicroGrid() {
			baseLineSize = 30 * presentationObject.curWidth / 1920;
			$scope.gridObj = new Array();

			var rowNum = Math.floor((presentationObject.curHeight + baseLineSize) / (5 * baseLineSize));
			squareWidth = (presentationObject.curWidth - baseLineSize * $scope.colNum) / $scope.colNum;
			rowAndSquareHeight = baseLineSize * 4 + 2;
			var top_row_0 = baseLineSize / 1.5;
			var left_square_0 = baseLineSize;
			var top_line_0 = baseLineSize / 1.5;
			var tmp = baseLineSize / 1.5;
			var tmpTmp = 0;

			if ($scope.macroGridObj == null) {
				generateMacroGrid();
			}

			var macroRowNum = 1;
			var macroSquareNum = 1;

			var zoneIterator = 0;

			var deltaZone = 0;

			for (i = 0; i < rowNum; i++) {
				$scope.gridObj[i] = new Object();
				$scope.gridObj[i].square = new Array();
				var sqIterator = 0;
				for (j = 0; j < $scope.colNum; j++) {
					var tmpSquare = new Object();
					var tmpLines = new Array();
					top_line_0 = tmp;

					//deltaZone - строки в макро зоне (по 5)
					if (i == 2) {
						deltaZone = 5;
					} else if (i == 4) {
						deltaZone = 10;
					}
					zoneIterator = Math.floor(sqIterator / ($scope.colNum / 5)) + deltaZone;

					for (k = 0; k < 4; k++) {
						var tmpObjLines = new Object();
						tmpObjLines.top = top_line_0;
						tmpObjLines.free = "true";

						if (i == 2 && k == 0) {
							tmpObjLines.zone = zoneIterator - 5;
						} else if (i == 4 && k < 3) {
							tmpObjLines.zone = zoneIterator - 5;
						} else {
							tmpObjLines.zone = zoneIterator;
						}

						tmpLines.push(tmpObjLines);
						top_line_0 = top_line_0 + baseLineSize + 1;
					}

					tmpSquare.line = tmpLines;
					tmpSquare.left = left_square_0;
					tmpSquare.free = "true";

					left_square_0 = left_square_0 + squareWidth + baseLineSize - 2;
					$scope.gridObj[i].square.push(tmpSquare);

					sqIterator++;
				}
				left_square_0 = baseLineSize;
				$scope.gridObj[i].top = top_row_0;
				top_row_0 = top_row_0 + 5 * baseLineSize + 2;
				tmp = top_row_0;
			}

		}

		/************************ВЫРАВНИВАНИЕ ТЕКСТА ПО БЕЙСЛАЙНУ*********************************/

		function setTextToBaseLine() {
			//НЕ РАБОТАЕТ ДЛЯ КОНТЕЙНЕРА!!! TOP В ПРОЦЕНТАХ НАДО. ИНАЧЕ ВСЕ ПЛЫВЕТ
			baseLineSize = 30 * presentationObject.curWidth / 1920;
			// var ourCoordinates = new Array();
			// ourCoordinates = $scope.gridObj;
			// var settingTextItemId = $('#textEditor' + $scope.curActiveSlide + '' + curActiveItem + '' + tmpTextItemNumber);
			// var settingDivId = $('#item' + curActiveItem);
			// if (settingDivId.css("line-height") == 'normal') {
			// 	lineHeight = "32px";
			// } else {
			// 	lineHeight = settingDivId.css("line-height");
			// }
			// var linesCount = parseInt(parseInt(settingDivId.css("height")) / parseInt(lineHeight));
			// var contObj = $('.containerObject');
			// var textFontSize = $('.texteditor').css("font-size");
			// var pTop = parseInt(textFontSize) * 0.44 + 'px';
			var pTop = new Array();

			$(".texteditor").each(function() {
				var textFontSize = parseInt($(this).css("font-size"));
				var k;
				if (textFontSize >= 78) {
					k = 0.095;
				} else if (textFontSize >= 66 && textFontSize < 78) {
					k = 0.21;
				} else if (textFontSize > 38 && textFontSize < 66) {
					k = 0.44;
				} else if (textFontSize > 28 && textFontSize <= 38) {
					k = 0.19157;
				} else if (textFontSize <= 28) {
					k = -0.17157;
				}
				pTop.push(textFontSize * k);
				$(this).css("top", textFontSize * k);
			});

			var getClosestCoordsInfo = new Object();
			getClosestCoordsInfo = findClosestElementsToMicroGrid();

			for (w = 0; w < $scope.curslide.items.length; w++) {

				//-------------------------------------------------подводка к бейслайну

				$scope.curslide.items[w].itemRef.top = getClosestCoordsInfo.closest_top_line[w] / presentationObject.curHeight * 100 + '%';
				$scope.curslide.items[w].itemRef.left = getClosestCoordsInfo.closest_left[w] / presentationObject.curWidth * 100 + '%';

				//*************************************************FOR LEFT POINT****************************************************
				var closest_right = baseLineSize;

				//----------------------------------Ищем ближайшую точку к правой границе изображения
				for (i = 0; i < $scope.colNum; i++) {
					if (i == 0 || Math.abs($scope.gridObj[0].square[i].left - getClosestCoordsInfo.theRightestPointOfObject[w]) < Math.abs(tmp_closest_right - getClosestCoordsInfo.theRightestPointOfObject[w])) {
						var tmp_closest_right = $scope.gridObj[0].square[i].left;
						closest_right = $scope.gridObj[0].square[i].left;
					}
				}
				//----------------------------------Изменение ширины изображения под модульную сетку, в зависимости от ее размера

				var newWidth = getClosestCoordsInfo.objectWidthHeight[w].width - (getClosestCoordsInfo.theRightestPointOfObject[w] - closest_right);

				if (closest_right > getClosestCoordsInfo.theRightestPointOfObject[w]) {
					newWidth = newWidth - baseLineSize;
				} else {
					newWidth = newWidth + squareWidth;
				}

				$scope.curslide.items[w].itemRef.width = newWidth / presentationObject.curWidth * 100 + '%';

				//----------------------------------Проверка занятости блоков

				checkForOccupation(getClosestCoordsInfo.bottomOfObject[w], getClosestCoordsInfo.theRightestPointOfObject[w], getClosestCoordsInfo.closest_top_row[w], getClosestCoordsInfo.closest_left[w], getClosestCoordsInfo.closest_top_line[w], getClosestCoordsInfo.rowIndex[w], getClosestCoordsInfo.squareIndex[w], getClosestCoordsInfo.lineIndex[w]);

			}

		}

		//**************************************************УЗНАЕМ БЛИЖАЙШИЕ ЭЛЕМЕНТЫ МИКРОСЕТКИ К ОБЪЕКТУ********************************

		function findClosestElementsToMicroGrid() {

			baseLineSize = 30 * presentationObject.curWidth / 1920;
			var rowNum = Math.floor((presentationObject.curHeight + baseLineSize) / (5 * baseLineSize));

			var closestCoordsInfo = new Object(),
				pBottomCoord = new Array(),
				pLeftCoord = new Array(),

				closest_top_row = new Array(),
				closest_left = new Array(),
				closest_top_line = new Array(),

				//-------индексы занятых элементов
				lineIndex = new Array(),
				squareIndex = new Array(),
				rowIndex = new Array(),

				objectWidthHeight = new Array(),
				theRightestPointOfObject = new Array(),
				bottomOfObject = new Array();

			//----инициализация отступов
			closest_top_row[0] = baseLineSize / 1.5;
			closest_left[0] = baseLineSize;
			closest_top_line[0] = baseLineSize / 1.5;
			lineIndex[0] = 0;
			squareIndex[0] = 0;
			rowIndex[0] = 0;

			$('.containerObject').each(function() {
				pBottomCoord.push(parseInt($(this).css("top")));
				pLeftCoord.push(parseInt($(this).css("left")));
				var tmpObj = new Object();
				var objectHeight = parseInt($("object", $(this)).css("height"));
				var gotHeight = 0;
				if (!objectHeight) {
					gotHeight = parseInt($(this).css("height"));
				} else {
					gotHeight = objectHeight;
				}
				tmpObj = {
					"width": parseInt($(this).css("width")),
					"height": gotHeight
				}
				objectWidthHeight.push(tmpObj);
			});

			closestCoordsInfo.objectWidthHeight = objectWidthHeight;

			//--------------------------------------------------------Ищем ближайшие точки

			for (w = 0; w < $scope.curslide.items.length; w++) {
				for (i = 0; i < rowNum; i++) {
					if (i == 0 || Math.abs($scope.gridObj[i].top - pBottomCoord[w]) < Math.abs(closest_top_row[w] - pBottomCoord[w])) {
						closest_top_row[w] = $scope.gridObj[i].top;
						var tmp_closest_left = baseLineSize;
						for (j = 0; j < $scope.colNum; j++) {
							if (j == 0 || Math.abs($scope.gridObj[i].square[j].left - pLeftCoord[w]) < Math.abs(tmp_closest_left - pLeftCoord[w])) {
								tmp_closest_left = $scope.gridObj[i].square[j].left;
								closest_left[w] = $scope.gridObj[i].square[j].left;
								var tmp_closest_top_line = baseLineSize / 1.5;
								for (k = 0; k < 4; k++) {
									if (Math.abs($scope.gridObj[i].square[j].line[k].top - pBottomCoord[w]) < Math.abs(tmp_closest_top_line - pBottomCoord[w])) {
										// if (k > 0) {
										// 	$scope.gridObj[i].square[j].line[k].free = 'true'; // отмена флажка занятости у просмотренной области
										// }
										tmp_closest_top_line = $scope.gridObj[i].square[j].line[k].top;
										closest_top_line[w] = $scope.gridObj[i].square[j].line[k].top;
										lineIndex[w] = k;
										squareIndex[w] = j;
										rowIndex[w] = i;
										// $scope.gridObj[i].square[j].line[k].free = 'false';
									}
								}
							}
						}
					}
				}

				theRightestPointOfObject[w] = closest_left[w] + closestCoordsInfo.objectWidthHeight[w].width;
				bottomOfObject[w] = closest_top_line[w] + closestCoordsInfo.objectWidthHeight[w].height;
			}

			closestCoordsInfo.closest_top_row = closest_top_row;
			closestCoordsInfo.closest_left = closest_left;
			closestCoordsInfo.closest_top_line = closest_top_line;
			closestCoordsInfo.lineIndex = lineIndex;
			closestCoordsInfo.rowIndex = rowIndex;
			closestCoordsInfo.squareIndex = squareIndex;
			closestCoordsInfo.bottomOfObject = bottomOfObject;
			closestCoordsInfo.theRightestPointOfObject = theRightestPointOfObject;


			return closestCoordsInfo;

		}

		//**************************************************ЗАНЯТОСТЬ БЛОКОВ********************************

		function checkForOccupation(bottomOfObject, theRightestPointOfObject, closest_top_row, closest_left, closest_top_line, rowIndex, squareIndex, lineIndex) {

			var countOfSquares = 0,
				countOfRows = 0;
			var sumRowTop = closest_top_row;
			var flagJump = false;
			squareWidth = (presentationObject.curWidth - baseLineSize * $scope.colNum) / $scope.colNum;

			var busyArray = new Array();
			var tmp = 0;

			while (bottomOfObject > sumRowTop) {
				sumRowTop += 5 * baseLineSize + 2;
				var sumLeft = closest_left;
				var tmpSquareIndex = squareIndex;
				while (theRightestPointOfObject > sumLeft) {
					var tmpLineIndex = lineIndex;
					var sumTop = closest_top_line;
					sumLeft += squareWidth + baseLineSize;

					var tmpObj = new Object();

					tmpObj.busyLinesCount = 0;

					while (bottomOfObject > sumTop) {
						if (tmpLineIndex < 4) {
							sumTop += baseLineSize;
							$scope.gridObj[rowIndex].square[tmpSquareIndex].line[tmpLineIndex].free = 'false';
							// tmpObj.zone = $scope.gridObj[rowIndex].square[tmpSquareIndex].line[tmpLineIndex].zone;
							tmp = parseInt($scope.gridObj[rowIndex].square[tmpSquareIndex].line[tmpLineIndex].zone);
							tmpLineIndex++;
						} else {
							flagJump = true;
							break;
						}
					}
					busyArray[tmp] = 0;
					// tmpObj.busyLinesCount += tmpLineIndex;
					busyArray[tmp] += parseInt(tmpLineIndex);
					// busyArray.push(tmpObj);

					$scope.gridObj[rowIndex].square[tmpSquareIndex].free = 'false';
					tmpSquareIndex++;
					countOfSquares++;
				}
				rowIndex++;
				countOfRows++;
			}

			return busyArray;

		}

		/************************ИНИЦИАЛИЗАЦИЯ МОДУЛЬНОЙ СЕТКИ МАКРО УРОВНЯ*********************************/

		$scope.initMacroGrid = function() {

			$scope.macroRowCss = {
				"height": (presentationObject.curHeight) / 3
			}
			$scope.macroSquareCss = {
				"width": presentationObject.curWidth / 5
			}

			generateMacroGrid();

			makeAutoLayoutBegin();
		}

		/************************ГЕНЕРАЦИЯ МОДУЛЬНОЙ СЕТКИ МАКРО УРОВНЯ*********************************/

		function generateMacroGrid() {

			baseLineSize = 30 * presentationObject.curWidth / 1920;
			var macroSquareWidth = presentationObject.curWidth / 5;
			var macroSquareRowHeight = (presentationObject.curHeight) / 3;

			var zoneNum = 0;

			$scope.macroGridObj = new Array();

			var top_row = 0;
			var left = 0;

			generateMicroGrid();

			var getBusyArray = new Array();

			if ($scope.curslide.items.length > 0) {

				var getClosestCoordsInfo = new Object();
				getClosestCoordsInfo = findClosestElementsToMicroGrid();

				for (w = 0; w < $scope.curslide.items.length; w++) {
					getBusyArray[w] = checkForOccupation(getClosestCoordsInfo.bottomOfObject[w], getClosestCoordsInfo.theRightestPointOfObject[w], getClosestCoordsInfo.closest_top_row[w], getClosestCoordsInfo.closest_left[w], getClosestCoordsInfo.closest_top_line[w], getClosestCoordsInfo.rowIndex[w], getClosestCoordsInfo.squareIndex[w], getClosestCoordsInfo.lineIndex[w]);
				}
			}


			for (row = 0; row < 3; row++) {
				$scope.macroGridObj[row] = new Object();
				$scope.macroGridObj[row].top = top_row;
				$scope.macroGridObj[row].square = new Array();
				var linesCount = (row == 1) ? 20 : 18; //----посчитано из сетки микроуровня, т.к. количество линий в квадрате макроуровня на втором ряду не совпадает с 1 и 3

				for (square = 0; square < 5; square++) {
					var tmpSquare = new Object();
					tmpSquare.left = left;
					//-----------------------------------------------------занятость в процентах
					tmpSquare.occupationInPercent = 0;
					for (elements = 0; elements < $scope.curslide.items.length; elements++) {
						if (getBusyArray[elements][zoneNum] != null) {
							var tmpPercent = getBusyArray[elements][zoneNum] * 100 / linesCount;
							tmpSquare.occupationInPercent += tmpPercent;
						}
					}
					left += macroSquareWidth;
					$scope.macroGridObj[row].square.push(tmpSquare);
					zoneNum++;
				}
				left = 0;
				top_row += macroSquareRowHeight;
			}


		}


		/******************************************************************************************************/
		/******************************************************************************************************/
		/************************************************АВТОВЕРСТКA******************************************************/
		/******************************************************************************************************/
		/******************************************************************************************************/

		//-------Объект ряда элементов
		Composition = function() {
			return {
				widthHeightObj: new Array(),
				rowNumber: 0,
				elementsInRow: 0,
				allWidth: 0,
				allHeight: 0
			}
		}

		//------Объект кирпичиков
		BlocksInit = function() {
			return {
				width: 0,
				height: 0,
				elements: new Array(),
				free: true,
				topOfBlock: 0,
				leftOfBlock: 0,
				topCurrent: 0,
			}
		}

		//-------ОСНОВНЫЕ ПЕРЕМЕННЫЕ, ОТВЕЧАЮЩИЕ ЗА РАСПОЛОЖЕНИЕ КОНТЕНТА НА СЛАЙДЕ
		$scope.objectsHorizontalAlignment = "left";
		$scope.objectsAlignment = "inHeight";
		$scope.objectsVerticalAlignment = "top";

		$scope.turnOnTop = false;

		//-------главный объект поиска! ПАХАН ОБЪЕКТОВ АВТОВЕРСТКИ!

		var activeBlock = 0;

		topsOfObjects = {
			gTopText: 0,
			gTopImage: 0,
			minimumTopTextWasFound: false,
			minimumTopImageWasFound: false
		}

		var addedElement = '';
		var secondCallOfAlignInit = false; //----избежание повторного вызова alignInitialization

		var arrayOfSlidesOfToppedElements = new Array(); //---запоминаем на каком слайде второй элемент ушел от первого на 2.7%
		var checkedBlocks = new Array(); //-----запоминаем какой блок был проверен на совмещение с другими

		var topForUsual = 0;
		var topForNextElement = 0;

		//----------функция, отвечающая за автоверстку
		$scope.newAutoLayout = function() {

			//--------применение выстраивания
			// objectsAlignment();
			alignByVertical();
			alignByHorizontal();
		}

		//----------включение и выключение автоверстки
		$("#autoPositionElementOnSLides").change(function() {
			if ($(this).attr("checked")) {
				$(this).attr('checked', false);
				presentationObject.autoLayoutTurnOn = false;
			} else {
				$(this).attr('checked', true);
				presentationObject.autoLayoutTurnOn = true;
			}
		});


		//****************************************************************************************
		//****************************************************************************************

		//*************** ПЕРЕНОС ЭЛЕМЕНТА НА ДРУГОЙ СЛАЙД, ЕСЛИ ОН НЕ ПОМЕЩАЕТСЯ ***************

		//-------размещение элемента на другом слайде
		function putAddedElementToNextSlide() {
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
		function checkForAccommodating() {
			if ($scope.objectsAlignment == "inHeight") {
				//------условие переноса
				// var checkedSum = searchObject[$scope.curActiveSlide].checkedSum + parseFloat($scope.curslide.items[$scope.curslide.items.length - 1].itemRef.width);
				if (searchObject[$scope.curActiveSlide].checkedSum > 100) {
					putAddedElementToNextSlide();
				}
			}
		}

		//****************************************************************************************
		//****************************************************************************************

		//********************************************************** РАСПРЕДЕЛЕНИЕ *******************************************************************

		//----распределение по вертикали
		function alignByVertical() {

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
		function alignByHorizontal() {

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
		function checkOtherBlocksInLeftZone() {
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
		function createNewBlock(indexElement) {
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
		function checkElementForBlockTypeAndKey() {
			var savedHeight = Blocks[$scope.curActiveSlide][activeBlock].height;
			Blocks[$scope.curActiveSlide][activeBlock].height = Blocks[$scope.curActiveSlide][activeBlock].height - searchObject[$scope.curActiveSlide].baseLineSizeInPercent - parseFloat($scope.curItem.itemRef.height);
			if (Blocks[$scope.curActiveSlide][activeBlock].height < parseFloat($scope.curItem.itemRef.height)) {
				//-----не помещается	
				Blocks[$scope.curActiveSlide][activeBlock].free = false;
				Blocks[$scope.curActiveSlide][activeBlock].height = savedHeight;
				createNewBlock(curActiveItem);
			} else {
				//----помещается
				Blocks[$scope.curActiveSlide][activeBlock].elements.push(curActiveItem);
			}
		}

		//-----------функция строит блоки из элементов
		function createTheWallFromBlocks(indexElement) {
			if (!secondCallOfAlignInit) {

				if ($scope.curItem.childItems[0].textType == 'usual') {
					addedElement = 'usual';
				} else if ($scope.curItem.childItems[0].key == 'objectItem') {
					addedElement = 'objectItem';
				}

				var indexMainItemTypeOfActiveBlock = (Blocks[$scope.curActiveSlide][activeBlock] == null) ? curActiveItem : Blocks[$scope.curActiveSlide][activeBlock].elements[0];
				//-----------находим правильный top для элемента следующей колонки
				if (addedElement == 'usual' && addedElement == $scope.curslide.items[indexMainItemTypeOfActiveBlock].childItems[0].textType && Blocks[$scope.curActiveSlide][activeBlock] != null) {

					checkElementForBlockTypeAndKey();

				} else if (addedElement == 'objectItem' && addedElement == $scope.curslide.items[indexMainItemTypeOfActiveBlock].childItems[0].key && Blocks[$scope.curActiveSlide][activeBlock] != null) {

					checkElementForBlockTypeAndKey();

				} else {
					createNewBlock(indexElement);
				}
			}
		}

		//********************************************************************************************************************************

		//********************************************************* СТАНДАРТИЗАЦИЯ ******************************************************************

		//------установка заголовка наверх слайда-----
		function setHeaderToTop() {
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
		function setHeaderToTopEvenHavingImage() {
			$scope.curItem.itemRef.top = searchObject[$scope.curActiveSlide].baseLineSizeInPercent;
			$scope.curItem.itemRef.left = searchObject[$scope.curActiveSlide].baseLineSizeInPercent;
		}

		//--------устанавливаем картинки по центру при наличии заголовка
		function setImageOnMiddleEvenHavingHeader() {
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
				setInline($scope.curslide.items[imageIndex].childItems[0].key, imageIndex, presentationObject.curHeight / 3, containerWidth, 0, containerWidth, 0, 0, 0);
			}
		}

		//--------установка изображений посередине
		function setImagesToTheMiddle() {
			//*********** В ВЫСОТУ *********** НЕ ТРОГАТЬ **********************
			// if($scope.objectsAlignment == "inHeight") {
			// 	setInheight($scope.curslide.items[0].childItems[0].key, 0, presentationObject.curHeight / 3, containerWidth, 0, presentationObject.curHeight / 3);
			// } else {
			// 	setInline($scope.curslide.items[0].childItems[0].key, 0, presentationObject.curHeight / 3, containerWidth, 0, containerWidth, 0, 0, 0);
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

							var parentTop = setInline($scope.curslide.items[i].childItems[0].key, compositions[row].widthHeightObj[t].indexElement, compositions[row].widthHeightObj[t].height, compositions[row].widthHeightObj[t].width, tmpWidth, compositions[row].allWidth, childPos, nextHeight, nextWidth);

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
					// 	setInheight(i, widthHeightObj[row][i].height, widthHeightObj[row][i].width, tmpHeight, allHeight);
					// 	tmpHeight += widthHeightObj[row][i].height + baseLineSize;
					// }
				}
			}
		}

		//------проверка на использование функции setMiddleImages
		function checkForUsualTextForImages() {
			var usualCount = 0;
			for (var indexElement in $scope.curslide.items) {
				if ($scope.curslide.items[indexElement].childItems[0].textType == "usual") {
					usualCount++;
				}
			}
			if (usualCount == 0) {
				setImagesToTheMiddle(); //проверка и установка для изображений > 1
				setImageOnMiddleEvenHavingHeader(); //проверка и установка для изображений = 1
			}
			return usualCount;
		}

		//-------функция стандартизации
		function standartization() {
			if ($scope.curslide.items.length > 1 && $scope.curslide.items[0].childItems[0].key == 'objectItem' && $scope.curItem.childItems[0].textType == 'header') {
				setHeaderToTopEvenHavingImage();
			} else {
				setHeaderToTop();
			}
			checkForUsualTextForImages();
		}

		//***************************************************************************************************
		//****************************************************************************************************************************

		//---------инициализация необходимых начальных условий для расположения
		//--------пересчитывание общих высот и ширин, нахождение элементов мин и мах расположений по горизонтали и вертикали
		function alignInitialization() {

			if (!secondCallOfAlignInit) {
				checkForAccommodating();
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

			createTheWallFromBlocks(indexElement);

			var wholeWidth = ($scope.curslide.items.length > 1) ? parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.left) + parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxLeftIndex].itemRef.width) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minLeftIndex].itemRef.left) : parseFloat($scope.curslide.items[0].itemRef.width);
			var wholeHeight = ($scope.curslide.items.length > 1) ? parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.top) + parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].maxTopIndex].itemRef.height) - parseFloat($scope.curslide.items[searchObject[$scope.curActiveSlide].minTopIndex].itemRef.top) : parseFloat($scope.curslide.items[0].itemRef.height);

			searchObject[$scope.curActiveSlide].wholeWidth = wholeWidth;
			searchObject[$scope.curActiveSlide].wholeHeight = wholeHeight;
			searchObject[$scope.curActiveSlide].topObject.element = new Array();
			searchObject[$scope.curActiveSlide].leftObject.element = new Array();
		}

		//---------устанавливает координаты для добавленного элемента в зависимости от расположенного контента
		function setNewCoords() {

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
		// function setMaxWidthOfBlockElementToBlock() {
		// 	//ширина блока становится равна мах контейнеру по ширине
		// 	if(parseFloat(Blocks[$scope.curActiveSlide][activeBlock].width) < parseFloat($scope.curItem.itemRef.width)) {
		// 		Blocks[$scope.curActiveSlide][activeBlock].width = $scope.curItem.itemRef.width;
		// 	}
		// }

		//-----запись координат для блоков
		function savingCoordsForBlocks() {
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
		function objectsAlignment() {

			//---проврка на включенность автоверстки
			if (presentationObject.autoLayoutTurnOn) {
				if (!aligmentCalledFromFunctionAddNewItem) {
					closeItem();
				}

				if (aligmentCalledFromFunctionAddNewItem && $scope.curItem != null) {
					//----если нужно не двигать контент при его распредлении к определенной границе, а оставлять его на месте, но двигать элементы, нужно закомментить условие
					// if(searchObject[$scope.curActiveSlide].wholeHeight == null || searchObject[$scope.curActiveSlide].wholeWidth == null) {
					alignInitialization(); //-----обновление мин и мах, общих ширин, высот 
					secondCallOfAlignInit = true;
					// }
					setNewCoords();
				}

				alignInitialization();
				alignByVertical();
				alignByHorizontal();

				standartization();

				//------запись координат для блоков
				savingCoordsForBlocks();

				checkOtherBlocksInLeftZone();

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
		function setInline(type, index, height, width, tmpWidth, allWidth, childPos, nextHeight, nextWidth) {
			var elementsTop = ((presentationObject.curHeight) - height - nextHeight - 2 * baseLineSize) / 2;
			if (type == 'objectItem') {
				$scope.curslide.items[index].itemRef.top = (((childPos == 0) ? elementsTop : childPos) * 100) / (presentationObject.curHeight) + '%';
				$scope.curslide.items[index].itemRef.left = 50 - allWidth * 100 / presentationObject.curWidth + tmpWidth * 100 / presentationObject.curWidth + '%';
			}
			return elementsTop;
		}

		//------расположение в колонну
		function setInheight(type, index, height, width, tmpHeight, allHeight) {
			var elementsTop = ((presentationObject.curHeight) - allHeight) / 2;
			if (type == 'objectItem') {
				$scope.curslide.items[index].itemRef.top = (elementsTop * 100) / (presentationObject.curHeight) + (tmpHeight * 100) / (presentationObject.curHeight) + '%';
				$scope.curslide.items[index].itemRef.left = 50 - allHeight * 100 / presentationObject.curWidth + tmpHeight * 100 / presentationObject.curWidth + '%';
			} else {

			}
		}

		$scope.$on("init", function(ev, data) {
			// $scope.foobar = data + " " + $scope.foobar;
		});

	} // конец контроллера

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


/************************ДИРЕКТИВА ДЛЯ ПЕРЕТАСКИВАНИЯ*************************/

editorApp.directive('ngDraggable', ['$document', '$parse',
	function($document, $parse) {
		return {
			restrict: 'A', // only activate on element attribute
			require: '?ngModel', // get a hold of NgModelController
			scope: {
				ngDraggable: '=',
				dndRect: '=',
				dndDragstart: '&',
				dndDrag: '&',
				dndDragend: '&',
			},
			link: function(scope, element, attr) {

				var callDragStart = true;
				var callDragEnd = false;
				var startX = 0,
					startY = 0,
					x = 0,
					y = 0;

				var dndRect = new Object();
				var dragCallback = scope.dndDrag();

				scope.$watch('ngDraggable', function(preventDrag) {
					if (preventDrag != undefined)
						if (preventDrag) {
							$document.off('mousemove', mousemove);
							$document.off('mouseup', mouseup);
							element.off('mousedown', mousedown);
							callDragStart = false;
						} else {
							element.on('mousedown', mousedown)
						}
						//element.on('mousedown', mousedown)
				});

				scope.$watch('dndRect', function(rectObj) {
					dndRect = rectObj;
				});


				function mousedown(event) {
					if (scope.ngDraggable)
						return;

					//Получаем в процентах и конвертируем в пиксели для перетаскивания
					//Не знаю, почему и когда, но возникает момент, при котором после ресайза исчезают проценты
					if (dndRect.left.indexOf("%") != -1) {
						x = (parseFloat(dndRect.left) / 100 * presentationObject.curWidth).toFixed(2);
						y = (parseFloat(dndRect.top) / 100 * presentationObject.curHeight).toFixed(2);
					} else {
						x = (parseFloat(dndRect.left));
						y = (parseFloat(dndRect.top));
					}


					event.preventDefault();
					event.stopPropagation();

					callDragStart = true;
					startX = event.pageX - x;
					startY = event.pageY - y;
					$document.on('mousemove', mousemove);
					$document.on('mouseup', mouseup);

				}

				function mousemove(event) {
					if (callDragStart) {
						// var dragstartCallback = $parse(attr.dndDragstart); // Охуенная штука, используется в старой библиотеке, раньше не знал ее
						// dragstartCallback();
						scope.dndDragstart();
						callDragStart = false;
						callDragEnd = true;
						scope.showTextFormatPopup = false;
						scope.$apply();
					}

					//Перетаскиваем
					y = event.pageY - startY;
					x = event.pageX - startX;
					var deltaX = parseFloat(dndRect.left) * presentationObject.curWidth / 100 - parseFloat(x);
					var deltaY = parseFloat(dndRect.top) * presentationObject.curHeight / 100 - parseFloat(y);

					try {
						dragCallback(deltaX, deltaY);
					} catch (e) {

					}

					dndRect.top = parseFloat(y) / presentationObject.curHeight * 100 + '%';
					dndRect.left = parseFloat(x) / presentationObject.curWidth * 100 + '%';
					scope.$apply();
				}

				function mouseup(event) {
					//Пересчитываем обратно в проценты
					var oldTop = dndRect.top;
					// var dragendCallback = $parse(attr.dndDragend); // Охуенная штука, используется в старой библиотеке, раньше не знал ее
					// dragendCallback(scope);
					if (callDragEnd) {
						scope.dndDragend();
						callDragEnd = false;
					}
					$document.off('mousemove', mousemove);
					$document.off('mouseup', mouseup);
					event.stopPropagation();
				}
			}
		}
	}
]);

/*******************ПЕРЕТАСКИВАНИЕ СЛАЙДОВ***************************/

editorApp.directive('dndList', function() {

	return function($scope, element, attrs) {

		// variables used for dnd
		var toUpdate;
		var startIndex = -1;

		// watch the model, so we always know what element
		// is at a specific position
		$scope.$watch(attrs.dndList, function(value) {
			toUpdate = value;
		}, true);

		// use jquery to make the element sortable (dnd). This is called
		// when the element is rendered
		$(element[0]).sortable({
			items: 'li',
			start: function(event, ui) {
				// on start we define where the item is dragged from
				startIndex = ($(ui.item).index());
			},
			stop: function(event, ui) {
				// on stop we determine the new index of the
				// item and store it there
				var newIndex = ($(ui.item).index());
				var toMove = toUpdate[startIndex];
				toUpdate.splice(startIndex, 1);
				toUpdate.splice(newIndex, 0, toMove);

				// we move items in the array, if we want
				// to trigger an update in angular use $apply()
				// since we're outside angulars lifecycle
				$scope.$apply(toUpdate);
			},
			axis: 'x'
		})
	}
});


/****************************ДИРЕКТИВА СЛАЙДА************************************/
editorApp.directive('mainSlide', function() {

	return function($scope, element, attrs) {

		element.on('mouseup', function(event) {
			// event.stopPropagation();

			// var txt = '';
			//  if (window.getSelection)
			// {
			//     txt = window.getSelection();
			//          }
			// else if (document.getSelection)
			// {
			//     txt = document.getSelection();
			//         }
			// else if (document.selection)
			// {
			//     txt = document.selection.createRange().text;
			//       }
			// else return;

			// if(txt.toString().length != 0) {
			// // }
		})
	}
});

/****************************CONTENTEDITABLE DIRECTIVE****************************/
editorApp.directive('contenteditable', ['$parse',
	function($parse) {
		return {
			restrict: 'A', // only activate on element attribute
			require: '?ngModel', // get a hold of NgModelController
			scope: {
				dragContainer: '=dragContainer',
				item: '=',
				lasso: '=',
				bodyClick: '=',
			},
			link: function(scope, element, attrs, ngModel) {

				setTimeout(function() {
					//CKEditor
					initTextEditor(attrs.id);
					if (scope.item)
						scope.item.textEditorId = attrs.id;

				}, 100);

				if (!ngModel) return; // do nothing if no ng-model

				// Specify how UI should be updated
				ngModel.$render = function() {
					element.html(ngModel.$viewValue || '');
				};

				// Listen for change events to enable binding
				element.on('blur keyup change', function() {
					//scope.$apply(read);
					read();
				});

				element.on('mousedown', mousedown);
				element.on('mouseup', function(event) {
					scope.dragContainer.preventDrag = false;
					// event.preventDefault()
					scope.bodyClick.id = '';
					avoidBodyClick = true;
					// $("#main_slide").css({
					// 	'-moz-user-select': 'none',
					// 	'-khtml-user-select': 'none',
					// 	'-webkit-user-select': 'none'
					// })
				})


				function mousedown(event) {
					scope.lasso.enable = false;
					if (scope.dragContainer.active || scope.dragContainer.selected) {
						scope.dragContainer.preventDrag = true;
					} else {
						scope.dragContainer.preventDrag = false;
					}
					scope.bodyClick.id = attrs.id;
					scope.$apply();

					// $("#main_slide").css({
					// 	'-moz-user-select': 'auto',
					// 	'-khtml-user-select': 'auto',
					// 	'-webkit-user-select': 'auto'
					// })
				}

				// Write data to the model
				function read() {
					var html = element.html();
					// When we clear the content editable the browser leaves a <br> behind
					// If strip-br attribute is provided then we strip this out
					if (attrs.stripBr && html == '<br>') {
						html = '';
					}
					ngModel.$setViewValue(html);
				}
			}
		};
	}
]);

/******************ДИРЕКТИВА ДЛЯ ОТСЛЕЖИВАНИЯ СОБЫТИЯ НАЖАТОЙ КЛАВИШИ***************/
editorApp.directive('keyListener', function() {
	return {
		restrict: 'A',
		replace: true,
		scope: true,
		link: function postLink(scope, iElement, iAttrs) {
			jQuery(document).on('keydown', function(e) {

				var result = scope.keyDown(e); //true - когда продолжить событие, в противном случае false или undefined

				if (!result) {
					if ((e.which === 8) || (e.which == 46)) {
						e.preventDefault();
						e.stopPropagation();
					}
				}
				// if ((e.which === 8) || (e.which == 46)) {
				// 	return false;
				// }
			});

			jQuery(document).on('keyup', function(e) {

				var result = scope.keyUp(e); //true - когда продолжить событие, в противном случае false или undefined

				// if (!result) {
				// 	e.preventDefault();
				// 	e.stopPropagation();
				// }
				// if ((e.which === 8) || (e.which == 46)) {
				// 	return false;
				// }
			});

		}
	};
});


/***********************ДИРЕКТИВА ДЛЯ ЭЛЕМЕНТОВ НА ПРЕВЬЮ СЛАЙДА*******************/
editorApp.directive('previewContainer', function() {
	return {
		restrict: 'A', // only activate on element attribute
		scope: {
			previewContainer: "=",
		},
		link: function(scope, element, attrs) {
			var containerItem = new Object();

			// scope.$watch(attrs.previewContainer, function(item) {
			// 	containerItem = clone(item);
			// 	resizeItem(containerItem)
			// }, true);

			scope.$watch('previewContainer', function(item) {
				containerItem = clone(item);
				//resizeItem(containerItem)
			}, true);
		}
	};
});
//preview-text - значит тут текст лежит. содержимое по ngModel
editorApp.directive('previewText', function() {
	return {
		restrict: 'A', // only activate on element attribute
		link: function(scope, element, attrs) {

			// 		ngModel.$render = function() {
			// 	// resizeCurContainer(); //Ресайз элемента дял отображение в превью 
			// 	element.html(ngModel.$viewValue);
			// };

			var childItem = new Object();

			scope.$watch(attrs.previewText, function(item) {
				childItem = clone(item);
				element.html(childItem.value)
					//resizeItem(childItem)
			}, true);

			function resizeItem(item) {
				var previewWidth = $(".slide").width();
				var resizeKoef = (previewWidth / presentationObject.curWidth) * 0.8;
				var fontSize = convertFontSize(parseFloat(childItem.css['font-size']), 'em', 'px') * resizeKoef.toFixed(2);
				var letterSpacing = parseFloat(childItem.css['letter-spacing']) * resizeKoef.toFixed(2);
				element.css('font-size', Math.ceil(fontSize));
				element.css('letter-spacing', Math.ceil(letterSpacing));
			}

		}
	};
});

var firstResize = true;

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


function mergeTheme() { //Слияние темы из визарда и размеров шрифтов
		//ЗАГОЛОВОК
		for (var slideT in fontsPatternStyles) { //first, middle, last
			var curSlideType = fontsPatternStyles[slideT];
			for (var fontType in curSlideType) { //header, innerHeader, usual
				var curFontType = curSlideType[fontType];
				for (var wizardFontStyle in presentationObject.template.font.fontStyles[fontType]) { //По стилю текста
					curFontType[wizardFontStyle] = presentationObject.template.font.fontStyles[fontType][wizardFontStyle]
				}
				switch (fontType) {
					case 'header':
						curFontType['color'] = presentationObject.template.font.font_color.firstCode;
						break;
					case 'innerHeader':
						curFontType['color'] = presentationObject.template.font.font_color.secondCode;
						break;
					case 'title':
						curFontType['color'] = presentationObject.template.font.font_color.secondCode;
						break;
					case 'usual':
						curFontType['color'] = presentationObject.template.font.font_color.thirdCode;
						break;
				}
			}

		}
		presentationObject.template.font.fontStyles = fontsPatternStyles;
	}
	/*
	 Конвертирует px в em и наоборот.
	source - px, em, pt - текущая единица измерения
	target - px, em, pt - требуемая единица измерения

	Размер шрифта базовый получаем из middleDesk.css('font-size')
	*/

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

function colorSlide() {
	var intervalID = setInterval(function() {
		color_pattern(slidesColorArr, 'slide_background', intervalID);
	}, 2);
}

function colorSlideAddingPreview() {
	var intervalID = setInterval(function() {
		color_pattern(slidesColorArr, 'add_slide_preview', intervalID);
	}, 2);
}

function colorItem(item) {
	var colors = $(item).attr('colors').split(',');
	var curClass = $(item).attr('class-for-color');
	var intervalID = setInterval(function() {
		color_pattern(colors, curClass, intervalID);
	}, 2);
}