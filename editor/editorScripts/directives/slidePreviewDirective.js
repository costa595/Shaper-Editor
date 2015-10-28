/***********************ДИРЕКТИВА ДЛЯ ЭЛЕМЕНТОВ НА ПРЕВЬЮ СЛАЙДА*******************/
angular.module('presEditor').directive('previewContainer', function() {
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
angular.module('presEditor').directive('previewText', function() {
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