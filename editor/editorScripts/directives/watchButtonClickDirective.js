/******************ДИРЕКТИВА ДЛЯ ОТСЛЕЖИВАНИЯ СОБЫТИЯ НАЖАТОЙ КЛАВИШИ***************/
angular.module('presEditor').directive('keyListener', function() {
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