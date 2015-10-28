/*********************НИЖНЯЯ ПАНЕЛЬ СЛАЙДОВ*************************/

angular.module('presEditor').factory("bottomSlidesPanelService", function() {

	var bottomSlidesPanelService = function($scope, initNewSlides, avoidBodyClick, closeItem) { 

		var myService = this,
			addedSlideIndex = 0;

		myService.init = function() {
			if (initNewSlides) { //Если презентация новая, то создать 3 слайда. В противном случае слайды уже созданные есть
				presentationObject.slides.push(new slide('first', $scope.template));
				presentationObject.slides.push(new slide('middle', $scope.template));
				presentationObject.slides.push(new slide('last', $scope.template));
				for (var k = 0; k < 3; k++) {
					Blocks[k] = new Array();
					searchObject[k] = new Search();
				} 

				var presentation_object = presentationObject.preparePresentationForSave();
				createPres(presentation_object);
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

				colorSlide();
			}
		}

		myService.openSlide = function(index) {
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

		$scope.openSlide = function(index) {
			myService.openSlide(index);
		}

		$scope.createSlide = function() {
			myService.createNewSlide($scope.curActiveSlide);
			positionPopupChooseTypeOfSlide();
			$scope.showLastPlusSlide = false;
			colorSlide();
		}

		$scope.createNewLastSlide = function() {
			$scope.showLastPlusSlide = false;
			myService.createNewSlide($scope.slides.length - 1);
			positionPopupChooseTypeOfSlide();
			colorSlide();
		}

		$scope.initSlide = function(type) {
			myService.openSlide(addedSlideIndex)
			scroll_left_position_end($scope.slides.length + 1);
			$scope.curslide.initSlide(type, presentationObject.template);
			$scope.openNewSlidePopup = false;
			$scope.curslide.newSlide = false;
			$scope.curslide.showDopMenuButton = true;
			$scope.curslide.curClass = '';
			colorSlide();
			myService.openSlide($scope.curActiveSlide);
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
			myService.openSlide($scope.curActiveSlide)
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
					myService.openSlide($scope.curActiveSlide - 1);
				} else {
					myService.openSlide(0);
				}
			} else {
				//Пустой
				//Дофиксить - положить подложку
				$scope.curslide = new slide('no-slides', $scope.template);
				$scope.curslide.background = '/images/patterns/2_1.svg'

			}
			if ($scope.slides.length == 0) {
				myService.createNewSlide(-1);
				positionPopupChooseTypeOfSlide(1);
			}
			delete_slide($scope.slides.length + 1);

		}

		myService.createNewSlide = function(index) {
			var tmpLogObj = new logObj($scope.curActiveSlide, $scope.slides, 'createSlide');
			presentationObject.addLog(tmpLogObj);
			$scope.slidePopup = false;
			scroll_left_position(index, $scope.slides.length + 1);
			addedSlideIndex = index + 1;
			$scope.slides.splice(addedSlideIndex, 0, new slide('first', $scope.template))
				// myService.openSlide(addedSlideIndex)
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

	}

	return bottomSlidesPanelService;
});