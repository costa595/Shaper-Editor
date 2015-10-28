angular.module('presEditor').controller("presentationEditor", ["$scope", '$http', 'FileUploader', 'lineHelper', 'autoLayoutService', 'bottomSlidesPanelService', 'stickingElementsService',  presentationEditor]);

var bordersSize = 0; //Ширина рамок
	baseLineSize = 0, //Размер базовой линии
	firstResize = true;
 
function presentationEditor($scope, $http, FileUploader, lineHelper, autoLayoutService, bottomSlidesPanelService, stickingElementsService) { //Контроллер

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
				stickingElementsObj.appendChildItem(newImageItem);
			} else {
				addNewItem(newImageItem);
			}
		};
		uploader.onCompleteAll = function() {
			console.info('onCompleteAll');
		};

		/*********************ГЛОБАЛЬНЫЕ ОБЪЕКТЫ ДЛЯ SCOPE**********************************/

		var initNewSlides = false;
		//************на время****************
		eval('presentationObject='+$('#presObj').attr('value'));
		//************************************
		if (!presentationObject) {
			presentationObject = new presentation();
			// console.log(presentationObject)
			mergeTheme();
			resize_window_editor();
			initNewSlides = true;
		} else {
			presentationObject.lineHelpersTurnOn = true;
			presentationObject.autoLayoutTurnOn = true;
			presentationObject.autoBringTurnOn = true;

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
		$scope.curItem = null; //Активный элемент
		//$scope.curItem.curActiveChildItem = new Object(); //Текущее активное поле с текстом
		$scope.textBlocksText = textBlocksText;
		$scope.textEditPopup = angular.element('.editTextPopupCircle');
		$scope.openNewSlidePopup = false; //Открытие окна создания слайда
		$scope.mouseDownElement = new Object(); //Элемент, на котором был mouseDown. 
		$scope.avoidItemDelete = true;
		var DOMElement = angular.element('#tmpTextPlace'); //Объект id="tmpTextPlace"
		DOMElement.html('tmpTextPlace');
		$scope.curTmpText = { //Временный объект объекта id="tmpTextPlace" для анализа характеристик теста
			value: '',
			css: '',
		}
		//ВЫнесено в глобальный объект из-за того что тормозит, когда происходит добавление указателей в объект $scope.curItem
		$scope.curItemContainer = new Object(); //Объект контенера элемента
		$scope.textP = 0;
		$scope.coord = 22;

		var aligmentCalledFromFunctionAddNewItem = false,
			curActiveItem = -1,
			activeChildIndex = -1,
			//При первом клике туда записывается номер элемента, в itemClick инициализация объекта
			tmpTextItemNumber = -1, 
			tmpImageItemNumber = -1,
		    avoidBodyClick = true, //Работать ли клику по body
		    leftMenuClick = false,
		    curPressedKeys = new Array(), //Текущие зажатые клавиши. Массив создан для того, чтобы отслеживать комбинации клавиш
		    firstItemClick = true, //true - на текущий элемент только переключились (требуется для отслеживания textStylePopup.textType, чтобы не сбрасывались стили)
		    selectionRanges,
		    rowAndSquareHeight, squareWidth, //Для модульной сетки
		    possibleAreaDif = 10, //Пограшность при наведении на наилучшие области
		    resizeHandler = new Object(), //Объект за который идет перетаскивание
		    mainSlide = angular.element('#main_slide'),
		    //Цвета рамки
		    borderColors = {
				red: '#4b8fff',
				green: '#00ff12'
			},
			baseLineSize = 30 * presentationObject.curWidth / 1920,
			curItemPrevState = new Object();

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

		/***************************POPUP НАД ЭЛЕМЕНТОМ*****************************/

		$scope.textFormatStyle = true;
		$scope.imageFormatStyle = true;
		$scope.graphFormatStyle = true;
		$scope.formatGraphInfo = true;
		$scope.textFormatLayout = true;
		$scope.textFormatAdd = true;
		// $scope.textFormatMagic = true; //инфографика
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

		//открываем попап для форматирования
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

		var stickingElementsObj = new stickingElementsService($scope, avoidBodyClick, closeItem, moveTextEtitPopup, deleteChildItem, tmpTextItemNumber, tmpImageItemNumber);
		$scope.textStylePopup.addedTextType = new Array(); 

		/***************************ДОБАВЛЕНИЕ ЭЛЕМЕНТОВ**************************/

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
				stickingElementsObj.appendChildItem(newImageItem);
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

		//-------для инфографики
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

		var slidesPanelObj = new bottomSlidesPanelService($scope, initNewSlides, avoidBodyClick, closeItem);

		slidesPanelObj.init();

		$scope.curslide = presentationObject.slides[0];
		$scope.curslide.active = true;
		$scope.curslide.showDopMenuButton = true;
		$scope.slidePopup = false;
		$scope.curslide.curClass = 'active-slide'; //Стиль активного слайда
		angular.element('.slide_background').attr('data', $scope.curslide.background)

		colorSlide(); //Перекраска слайда

		//Перекраска всех превью слайдов
		// var intervalIDSmallSlides = setInterval(function() {
		// 	color_pattern(slidesColorArr, 'img_slide', intervalIDSmallSlides);
		// }, 50);

		$scope.openSlidePopup = function(index) {
			$scope.slidePopup = true;
			avoidBodyClick = false;
			slide_popup_on(index, $scope.slides.length + 1);
		}

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

			//**************************************   АВТООВЕРСТКА / AUTOLAYOUT ***********************************
			autoLayoutObj = new autoLayoutService($scope, aligmentCalledFromFunctionAddNewItem, closeItem, curActiveItem, textWasChanged, moveTextEtitPopup, itemClick);
			autoLayoutObj.objectsAlignment();
			
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



		//перемещение popup редактирования текста
		function moveTextEtitPopup(index) {
			console.log('move')
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

//**************************************   НАПРАВЛЯЮЩИЕ ***********************************

	var lineHelpersObj = new lineHelper($scope, curActiveItem, presentationObject.lineHelpersTurnOn, presentationObject.autoBringTurnOn);

	$scope.lineHelpersArray = new Array();
	$scope.squareArray = new Array();
	$scope.lineEqualHelpersArray = new Array();
	$scope.bigCoords = new Object();

//*****************************************************************************************

//**************************************   ПЕРЕМЕЩЕНИЕ / DRAG *****************************

	dragEvents($scope, curActiveItem, itemClick, moveTextEtitPopup, lineHelpersObj);

//*****************************************************************************************

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


		//**********************ИНИЦИАЛИЗАЦИЯ ГРАНИЦ ПРИ ПЕРЕМЕЩЕНИИ СЛАЙДЕРОМ**************


		// var bordersServiceObj = new initBordersService($scope, curActiveItem, curNearestObjectsTop, curNearestObjectsBottom, curNearestObjectsLeft, curNearestObjectsRight);

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
				console.log(curNearestObjectsLeft)
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


	// //**************************************   АВТООВЕРСТКА / AUTOLAYOUT ***********************************

		//-------ОСНОВНЫЕ ПЕРЕМЕННЫЕ, ОТВЕЧАЮЩИЕ ЗА РАСПОЛОЖЕНИЕ КОНТЕНТА НА СЛАЙДЕ
		$scope.objectsHorizontalAlignment = "left";
		$scope.objectsAlignment = "inHeight";
		$scope.objectsVerticalAlignment = "top"; 

		$scope.turnOnTop = false;

		var autoLayoutObj = new autoLayoutService($scope, aligmentCalledFromFunctionAddNewItem, closeItem, curActiveItem, textWasChanged, moveTextEtitPopup, itemClick);

		//----------функция, отвечающая за автоверстку
		$scope.newAutoLayout = function() {

			//--------применение выстраивания
			// objectsAlignment();
			autoLayoutObj.alignByVertical();
			autoLayoutObj.alignByHorizontal();
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


		$scope.$on("init", function(ev, data) {
			// $scope.foobar = data + " " + $scope.foobar;
		});

	} // конец контроллера
