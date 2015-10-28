/****************************CONTENTEDITABLE DIRECTIVE****************************/
angular.module('presEditor').directive('contenteditable', ['$parse',
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