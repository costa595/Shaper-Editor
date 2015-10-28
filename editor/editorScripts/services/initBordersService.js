angular.module('presEditor').factory("initBordersService", function() {

	var initBordersService = function($scope, curActiveItem, curNearestObjectsTop, curNearestObjectsBottom, curNearestObjectsLeft, curNearestObjectsRight) {

		var myService = this,
			sizesForBothSlider = new Object();

		myService.initPossibleBordersForChild = function(childItem) {
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

		myService.initContainerHorizontalBordersSlider = function(side) {
			var initedParams = {
				containerLeft: $scope.curItem.sizeInPx('left'),
				containerWidth: $scope.curItem.sizeInPx('width'),
			};
			var initedSliderSize = new Object();

			curNearestObjectsLeft = myService.findForLeftNearest($scope.curItem);
			initedSliderSizeLeft = myService.initContainerBordersLeft(initedParams, $scope.curItem);

			curNearestObjectsLeft.initedContainerLeft = initedSliderSizeLeft.initedContainerLeft;
			curNearestObjectsLeft.otherItemsWidth = initedSliderSizeLeft.otherItemsWidth;

			curNearestObjectsRight = myService.findForRightNearest($scope.curItem);
			initedSliderSizeRight = myService.initContainerBordersRight(initedParams, $scope.curItem);

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

					curNearestObjectsRight = myService.findForRightNearest($scope.curItem);
					sizesForBothSlider.sizeForRight = myService.initContainerBordersRight(initedParams, $scope.curItem);

					curNearestObjectsLeft = myService.findForLeftNearest($scope.curItem);
					sizesForBothSlider.sizeForLeft = myService.initContainerBordersLeft(initedParams, $scope.curItem);

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

		myService.initContainerVerticalBordersSlider = function(side) {
			var initedParams = {
				containerTop: $scope.curItem.sizeInPx('top'),
				containerHeight: $scope.curItem.sizeInPx('height'),
			};
			var initedSliderSize = new Object();

			curNearestObjectsBottom = myService.findForBottomNearest($scope.curItem);
			var initedSliderSizeBottom = myService.initContainerBordersBottom(initedParams, $scope.curItem);

			curNearestObjectsBottom.otherItemsHeight = initedSliderSizeBottom.otherItemsHeight;
			curNearestObjectsBottom.containerBottom = initedSliderSizeBottom.containerBottom;

			curNearestObjectsTop = myService.findForTopNearest($scope.curItem);
			var initedSliderSizeTop = myService.initContainerBordersTop(initedParams, $scope.curItem);

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

		//инициализация для контейнера

		myService.initContainerBordersLeft = function(initedParams, containerItem) {

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

		myService.initContainerBordersRight = function(initedParams, containerItem) {

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

	    myService.initContainerBordersTop = function(initedParams, containerItem) {

			var otherItemsHeight = 0, verticalBorders, bordersMax;

			if (curNearestObjectsTop.itemsArr.length != 0)
				otherItemsHeight = parseFloat(curNearestObjectsTop.itemsBottom) - parseFloat(curNearestObjectsTop.nearestCoord);

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

		myService.initContainerBordersBottom = function(initedParams, containerItem) {

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

		//инициализация для детишек

		myService.initChildBordersTop = function(initedParams, curActiveChild) {

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

		myService.initChildBordersBottom = function(initedParams, curActiveChild) {
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

		myService.initChildVerticalBordersSlider = function(side) {
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

			var initedParams = myService.initForChildBordersVerticalParams();
			var initedSliderSize;
			//Двигаем все, что ниже элемента
			if (side == 'bottom') {
				curNearestObjectsBottom = myService.findForBottomNearest($scope.curItem);
				initedSliderSize = myService.initChildBordersBottom(initedParams, curActiveChild);

			} else if (side == 'top') { //Все границы сверху элемента
				curNearestObjectsTop = myService.findForTopNearest($scope.curItem);
				initedSliderSize = myService.initChildBordersTop(initedParams, curActiveChild);

			} else if (side == 'both') {

				initedSliderSize = new Object();

				curNearestObjectsTop = myService.findForTopNearest($scope.curItem);
				sizesForBothSlider.sizeForTop = myService.initChildBordersTop(initedParams, curActiveChild);

				curNearestObjectsBottom = myService.findForBottomNearest($scope.curItem);
				sizesForBothSlider.sizeForBottom = myService.initChildBordersBottom(initedParams, curActiveChild);

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

		myService.initForChildBordersVerticalParams = function() {
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

		//-----поиск ближайших объектов

		myService.findForLeftNearest = function(container) {
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

		myService.findForRightNearest = function(container) {
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

		myService.findForTopNearest = function(container) {
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

		myService.findForBottomNearest = function(container) {
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

	}

	return initBordersService;
});