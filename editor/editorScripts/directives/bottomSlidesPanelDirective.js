
angular.module('presEditor').directive( "addBookButton", [ 'bottomSlidesPanelService', function( bottomSlidesPanelService ) {

    return {

        restrict: 'E',
        replace: true,
        controller: function($scope) {

            $scope.openSlide = function(index) {
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
            
        },
        template:
		'<li class="slide" ng-repeat="slide in presentationObject.slides track by $index" ng-class="slide.curClass">' +
			'<div class="hoverActive"></div>' +
			'<div class="number_mini_slide">@{{$index+1}}</div>' +
			'<a class="OverflowHiddenPreview" ng-click="openSlide($index)">' +
				'<object onload="colorSlide()" data="@{{slide.background}}" ng-style="slide.bkgshow" class="img_slide slide_background presentationObject.slides_min@{{$index}}"></object>' +
				'<div class="item-preview" ng-repeat="item in slide.items" ng-style="item.itemRef" preview-container="item">
            					<div ng-repeat="child in item.childItems | filter: {key: \'textItem\' } track by $index" preview-text="child" ng-style="child.css">
            					</div>

            					<div ng-repeat="child in item.childItems | filter: {key: \'objectItem\', subKey: \'objectItem\'} track by $index" typeObj="image" class="imageBlock" ng-click="imageItemClick($index)" ng-style="child.itemRef">
            			        	<object data="@{{child.value}}" id="imageEditor@{{curActiveSlide}}@{{$parent.$index}}@{{$index}}" ng-class="child.activeClass" class="objectImage"></object>
            			        </div>	

            			        <div ng-repeat="child in item.childItems | filter: {key: \'objectItem\', subKey: \'imageItem\' } track by $index" typeObj="image" class="imageBlock" ng-click="imageItemClick($index)" ng-style="child.itemRef">
            			        	<img ng-src="@{{child.value}}" id="imageEditor@{{curActiveSlide}}@{{$parent.$index}}@{{$index}}" ng-class="child.activeClass" class="objectImage"/>
            			        </div>	
            				</div>'+
			'</a>' +
		'</li>'

    };

}]);