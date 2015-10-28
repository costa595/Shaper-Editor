	
function dragEvents($scope, curActiveItem, itemClick, moveTextEtitPopup, lineHelpersObj) {

	var startPositionObj = new Object();

	//http://habrahabr.ru/sandbox/80139/
	//----начало перемещения
	$scope.dragstart = function(index) {
			if (curActiveItem != index)
				itemClick(index);
			$scope.lassoEnable.enable = false;
			$scope.curItem.selectable = false;
			//angular.element('.editTextPopup').css('display', 'none');
			$scope.showTextFormatPopup = false;

			//Сохраняем состояние до перетаскивания
			var tmpLogObj = new logObj($scope.curActiveSlide + '_' + curActiveItem, $scope.curItem, 'move');
			presentationObject.addLog(tmpLogObj);

			//-----запоминаем координаты для прощения ошибок--------
			startPositionObj.topInPX = presentationObject.curHeight * parseFloat($scope.curslide.items[index].itemRef.top) / 100;
			startPositionObj.leftInPX = presentationObject.curWidth * parseFloat($scope.curslide.items[index].itemRef.left) / 100;
			// startPositionObj.top = $scope.curslide.items[index].itemRef.top;
			// startPositionObj.left = $scope.curslide.items[index].itemRef.left;
			//------------------------------------------------------

			$scope.curItem.inArea = false;
			// showBestAreas(index);
			avoidBodyClick = false;
	};


	//---двигаем элемент
	$scope.dragItem = function(index) {
		// moveTextEtitPopup(index);
		// checkForArea();
		lineHelpersObj.callAllHelperLinesGuards();
	}

	//---конец перемещения
	$scope.dragend = function(index) {
			$scope.preventItemClick = true;
			$scope.lassoEnable.enable = true;
			if ($scope.curItem)
				$scope.curItem.selectable = true;
			var itemTmp = new Object();
			var curArea = new Object();
			for (var i in $scope.showedAreas) {
				//Растягиванеи объекта на область, если он в ней
				curArea.top = parseFloat($scope.showedAreas[i].top);
				curArea.left = parseFloat($scope.showedAreas[i].left);
				curArea.right = curArea.left + parseFloat($scope.showedAreas[i].width);
				curArea.bottom = curArea.top + parseFloat($scope.showedAreas[i].height);
				curArea.width = parseFloat($scope.showedAreas[i].width);
				curArea.height = parseFloat($scope.showedAreas[i].height);
				itemTmp.top = parseFloat($scope.curItem.itemRef.top)
				itemTmp.left = parseFloat($scope.curItem.itemRef.left)

				if ((itemTmp.left > curArea.left - possibleAreaDif) && (itemTmp.left < curArea.right + possibleAreaDif) && (itemTmp.top > curArea.top - possibleAreaDif) && (itemTmp.top < curArea.bottom + possibleAreaDif)) {
					//Resize объекта по размерам поля
					$scope.curItem.inArea = true;
					$scope.curItem.itemRef.left = curArea.left + '%';
					$scope.curItem.itemRef.top = curArea.top + '%';
					$scope.curItem.itemRef.width = curArea.width + '%';
					$scope.curItem.itemRef.height = curArea.height + '%';
				}
			}

			//---------------------------------------------ПРОЩЕНИЕ ОШИБОК----------------------------------------------------------

			var endTop = presentationObject.curHeight * parseFloat($scope.curslide.items[index].itemRef.top) / 100;
			var endLeft = presentationObject.curWidth * parseFloat($scope.curslide.items[index].itemRef.left) / 100;

			if ((Math.abs(endTop - startPositionObj.topInPX) <= presentationObject.curHeight / 6) && (Math.abs(endLeft - startPositionObj.leftInPX) <= presentationObject.curWidth / 10)) {
				$scope.curslide.items[index].itemRef.top = startPositionObj.top;
				$scope.curslide.items[index].itemRef.left = startPositionObj.left;
			}

			moveTextEtitPopup(index);
			$scope.showTextFormatPopup = true;
			$scope.lassoEnable.enable = true;

			$scope.lineHelpersArray = []; // удаляем направляющие
			$scope.squareArray = []; // удаляем прямоугольник
			$scope.lineEqualHelpersArray = []; // удаляем схожие линии
	};
}