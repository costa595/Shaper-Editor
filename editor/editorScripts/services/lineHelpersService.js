//**************************************   НАПРАВЛЯЮЩИЕ ***********************************

angular.module('presEditor').factory("lineHelper", function() {

	var lineHelper = function($scope, curActiveItem, lineHelpersTurnOn, autoBringTurnOn) {

		var myService = this;

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

		//----устанавливает ширину для горизонтальных направляющих
		myService.setBordersForHorizontalHelperLines = function(object, leftElement, leftDragged) {
			if(leftDragged >= leftElement) {
				object.left = leftElement + '%';
				object.width =  leftDragged + parseFloat($scope.curItem.itemRef.width) - leftElement + '%';
			} else {
				object.left = leftDragged + '%';
				object.width = leftElement + parseFloat($scope.curItem.itemRef.width) - leftDragged + '%';
			}
		}

		//----устанавливает высоту для вертикальных направляющих
		myService.setBordersForVerticalHelperLines = function(object, topElement, topDragged) {
			if(topDragged >= topElement) {
				object.top = topElement + '%';
				object.height =  topDragged + parseFloat($scope.curItem.itemRef.height) - topElement + '%';
			} else {
				object.top = topDragged + '%';
				object.height = topElement + parseFloat($scope.curItem.itemRef.height) - topDragged + '%';
			}
		}

		//---создаёт направляющие элементов
		myService.setHelperLinesOfElements = function(topsOfDraggedItem, leftsOfDraggedItem) {

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

							myService.setBordersForHorizontalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.left), leftsOfDraggedItem[0]);

							$scope.lineHelpersArray.push(newLine);
							myService.autoBring($scope.curslide.items[indexElement].itemRef.top, null);
						}

						if(bottom + koef >= topsOfDraggedItem[indexDragged] && bottom - koef <= topsOfDraggedItem[indexDragged]) {
							var newLine = new horizontalLine();
							newLine.top = bottom + '%';

							myService.setBordersForHorizontalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.left), leftsOfDraggedItem[0]);

							$scope.lineHelpersArray.push(newLine);
							myService.autoBring(bottom, null);
						}

						if(middleTop + koef >= topsOfDraggedItem[indexDragged] && middleTop - koef <= topsOfDraggedItem[indexDragged]) {
							var newLine = new horizontalLine();
							newLine.top = middleTop + '%';

							myService.setBordersForHorizontalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.left), leftsOfDraggedItem[0]);

							$scope.lineHelpersArray.push(newLine);
							myService.autoBring(middleTop, null);
						}
					}

					for(var indexDragged in leftsOfDraggedItem) {

						if(parseFloat($scope.curslide.items[indexElement].itemRef.left) + koef >= leftsOfDraggedItem[indexDragged] && parseFloat($scope.curslide.items[indexElement].itemRef.left) - koef <= leftsOfDraggedItem[indexDragged]) {
							var newLine = new verticalLine();
							newLine.left = $scope.curslide.items[indexElement].itemRef.left;

							myService.setBordersForVerticalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.top), topsOfDraggedItem[0]);

							$scope.lineHelpersArray.push(newLine);
							myService.autoBring(null, $scope.curslide.items[indexElement].itemRef.left);
						}

						if(right + koef >= leftsOfDraggedItem[indexDragged] && right - koef <= leftsOfDraggedItem[indexDragged]) {
							var newLine = new verticalLine();
							newLine.left = right + '%';

							myService.setBordersForVerticalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.top), topsOfDraggedItem[0]);

							$scope.lineHelpersArray.push(newLine);
							myService.autoBring(null, right);
						}

						if(middleLeft + koef >= leftsOfDraggedItem[indexDragged] && middleLeft - koef <= leftsOfDraggedItem[indexDragged]) {
							var newLine = new verticalLine();
							newLine.left = middleLeft + '%';

							myService.setBordersForVerticalHelperLines(newLine, parseFloat($scope.curslide.items[indexElement].itemRef.top), topsOfDraggedItem[0]);

							$scope.lineHelpersArray.push(newLine);
							myService.autoBring(null, middleLeft);
						}
					}
				}
			}
		}

		//----создаёт срединные линии слайда
		myService.setMiddleHelperLines = function(middleTopOfDraggedElement, middleLeftOfDraggedElement) {

			var koef = 0.5;

			if(50 + koef >= middleTopOfDraggedElement && 50 - koef <= middleTopOfDraggedElement) {
				var newEqualHorizontalLine = new horizontalLine();
				newEqualHorizontalLine.top = middleTopOfDraggedElement + '%';
				$scope.lineEqualHelpersArray.push(newEqualHorizontalLine);

				var newSquare = new squareLine();
				$scope.squareArray.push(newSquare);

				myService.autoBring(middleTopOfDraggedElement, null);
			}

			if(50 + koef >= middleLeftOfDraggedElement && 50 - koef <= middleLeftOfDraggedElement) {
				var newEqualVerticalLine = new verticalLine();
				newEqualVerticalLine.left = middleLeftOfDraggedElement + '%';
				$scope.lineEqualHelpersArray.push(newEqualVerticalLine);

				var newSquare = new squareLine();
				$scope.squareArray.push(newSquare);

				myService.autoBring(null, middleLeftOfDraggedElement);
			}
		}

		//----автодоводка
		myService.autoBring = function(broughtTop, broughtLeft) {
			if(autoBringTurnOn) {
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
		myService.setSquareHelperOnBorders = function(topBottomOfDraggedElement, leftRightOfDraggedElement) {
			
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
		myService.findClosestHorizontal = function() {

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

					myService.createLine(closestIndexFromLeft, closestDisFromLeft, "horizontal");
				}
				//---линия для максимального left
				var disToBorderFromMaxLeft = 100 - parseFloat($scope.curslide.items[indexMaxLeft].itemRef.left) - parseFloat($scope.curslide.items[indexMaxLeft].itemRef.width);
				if(disToBorderFromMaxLeft + koef >= closestDisFromLeft && disToBorderFromMaxLeft - koef <= closestDisFromLeft) {

					myService.createLine(indexMaxLeft, disToBorderFromMaxLeft, "horizontal");

					myService.createLine(closestIndexFromLeft, closestDisFromLeft, "horizontal");
				}
				
				createHorizontalLinesFromLeft(indexMinLeft, closestDisFromLeft, closestIndexFromLeft);

				// createHorizontalLinesFromRight(indexMaxLeft, closestDisFromLeft, closestIndexFromLeft);
			}
		}

		//---нахождение ближ. расстояния до левого элемента для взятого объекта
		myService.createHorizontalLinesFromLeft = function(indexMin, closestDis, closestIndexFromLeftForDragged) {

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
						myService.createLine(closestIndexFromLeftForElement, closestDisFromLeftForElement, "horizontal");
						myService.createLine(closestIndexFromLeftForDragged, closestDis, "horizontal");
					}
				}
			}
		}

		//---нахождение ближ. расстояния до правого элемента для взятого объекта
		myService.createHorizontalLinesFromRight = function(indexMax, closestDis, closestIndexFromLeftForDragged) {

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
						myService.createLine(closestIndexFromRightForElement, closestDisFromRightForElement, "horizontal");
						myService.createLine(closestIndexFromLeftForDragged, closestDis, "horizontal");
					}
				}
			}
		}
		//**************************************************

		//***************ВЕРТИКАЛЬНЫЕ СТРЕЛКИ***************
		//-----создаёт вертикальные стрелки между элементами
		myService.findClosestVertical = function() {

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

					myService.createLine(closestIndexFromTop, closestDisFromTop, "vertical");
				}
				//---линия для максимального top
				var disToBorderFromMaxTop = 100 - parseFloat($scope.curslide.items[indexMaxTop].itemRef.top) - parseFloat($scope.curslide.items[indexMaxTop].itemRef.height);
				if(disToBorderFromMaxTop + koef >= closestDisFromTop && disToBorderFromMaxTop - koef <= closestDisFromTop) {

					myService.createLine(indexMaxTop, disToBorderFromMaxTop, "vertical");

					myService.createLine(closestIndexFromTop, closestDisFromTop, "vertical");
				}
				
				myService.createHorizontalLinesFromTop(closestDisFromTop, closestIndexFromTop);

				// createHorizontalLinesFromRight(indexMaxTop, closestDisFromTop, closestIndexFromTop);
			}
		}

		//---нахождение ближ. расстояния до левого элемента для взятого объекта
		myService.createHorizontalLinesFromTop = function(closestDis, closestIndexFromTopForDragged) {

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
						myService.createLine(closestIndexFromTopForElement, closestDisFromTopForElement, "vertical");
						myService.createLine(closestIndexFromTopForDragged, closestDis, "vertical");
					}
				}
			}
		}

		//**************************************************

		//----создаёт стрелки
		myService.createLine = function(index, distance, type) {
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
		myService.setDistances = function(middleTopOfDraggedElement, leftsOfDraggedItem) {

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
		myService.callAllHelperLinesGuards = function() {
			if(lineHelpersTurnOn) {
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

				myService.setMiddleHelperLines(topsOfDraggedItem[2], leftsOfDraggedItem[2]); //срединные направляющие
				myService.setHelperLinesOfElements(topsOfDraggedItem, leftsOfDraggedItem); // направляющие элементов
				myService.setSquareHelperOnBorders(topsOfDraggedItem, leftsOfDraggedItem); //прямоугольник
				myService.setDistances(topsOfDraggedItem[2], leftsOfDraggedItem);

				myService.findClosestHorizontal();
				myService.findClosestVertical();
			}
		}

	}

	return (lineHelper);

});
	//*********************************************************************************************