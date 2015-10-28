/****************************ДИРЕКТИВА СЛАЙДА************************************/
angular.module('presEditor').directive('mainSlide', function() {

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