function findForTopNearest(container) {
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

		function findForBottomNearest(container) {
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

		function findForRightNearest(container) {
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

		function findForLeftNearest(container) {
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