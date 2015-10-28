/************************ДИРЕКТИВА ДЛЯ ПЕРЕТАСКИВАНИЯ НА СЛАЙДЕ*************************/

angular.module('presEditor').directive('ngDraggable', ['$document', '$parse',
	function($document, $parse) {
		return {
			restrict: 'A',
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

angular.module('presEditor').directive('dndList', function() {

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