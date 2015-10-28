var textBlocksText = {
	header: 'Заголовок слайда',
	innerHeader: 'Заголовок',
	title: 'Подзаголовок',
	usual: 'Обычный текст',
}

	var verticalBorders = 4;
	var horizontalBorders = 4;

presentationMethods = {
	//Возвращает индекс добавленного элемента
	addPattern: function(slideType, template, newItem) {
		var itemsTypes = new Array();

		var elArr = new Array();
		for (var k in template.text) {
			elArr.push(template.text[k].textType)
		}

		for (var k in template.icons) {
			elArr.push('objectItem');
		}

		//newItem.fromPatternPosition = newItem.tmpPosition;

		//В поиск паттернов в этом случае вставить поиск по позициям. Иначе приисходит дублирование паттернов (2-го и далее)

		// var tmpPattern = this.findPattern(slideType, elArr);
		var possiblePatterns = this.findAllPatterns(slideType, elArr);
		var newItemKey = newItem.key;
		var fromPatternTmpPosition;
		var patternIndex = false;
		var tmpPattern;
		for (var k in possiblePatterns) {
			var curPattern = possiblePatterns[k].pattern;
			switch(newItemKey) {
				case 'textItem': 
					var newItemTextType = newItem.textType;
					for (var i in curPattern.text) {
						if (curPattern.text[i].textType == newItemTextType)
							if (curPattern.text[i].tmpPosition != undefined) {
								fromPatternTmpPosition = curPattern.text[i].tmpPosition;
								break;
							}
					}
				break;
				case 'objectItem': 
					for (var i in curPattern.icons) {
						if (curPattern.icons[i].tmpPosition != undefined)
							fromPatternTmpPosition = curPattern.icons[i].tmpPosition;
					}
				break;
				case 'imageItem': 

				break;
			}
			if (fromPatternTmpPosition == newItem.tmpPosition) {
				patternIndex = k;
				tmpPattern = curPattern;
				break;
			}
		}
		if (patternIndex === false) {
			this.usedPatterns[slideType].push(clone(template));
			return this.usedPatterns[slideType].length - 1;
		} else {
			tmpPattern.usedTimes++;
			return patternIndex;
		}
	},

	changePattern: function(slideType, index, template) {
		if (index != -1)
			this.usedPatterns[slideType][index] = template;
	},

	findPattern: function(slideType, elTypes) { //Поиск паттерна, elTypes - массив типов используемых элементов. Длинна массива - сколько элементов используется
		var possiblePatterns = this.findAllPatterns(slideType, elTypes);
		var tmpPattern;
		var patternIndex = false;
		for (var k in possiblePatterns) {
			var curPattern = possiblePatterns[k].pattern;
			if (tmpPattern) {
				if (curPattern.usedTimes > tmpPattern.usedTimes)
					tmpPattern = curPattern;
			} else {
				tmpPattern = curPattern;
			}
			patternIndex = possiblePatterns[k].patternIndex;
		}

		return {
			pattern: tmpPattern,
			patternIndex: patternIndex,
		};
	},

	findAllPatterns: function(slideType, elTypes){
		var possiblePatterns = new Array();
		var oneReturnedPattern = function(pattern, patternIndex) {
			this.pattern = pattern;
			this.patternIndex = patternIndex;
		}
		var elCount = elTypes.length;
		var iconCount = 0;
		var itemTextCount = new Object();
		itemTextCount.header = 0;
		itemTextCount.innerHeader = 0;
		itemTextCount.title = 0;
		itemTextCount.usual = 0;

		for (var k in elTypes) {
			if (elTypes[k] == 'objectItem') {
				iconCount++;
			} else {
				itemTextCount[elTypes[k]]++;
			}
		}

		for (var k in this.usedPatterns[slideType]) {
			//Поиск по числе эл-тов
			if (this.usedPatterns[slideType][k].elCount == elCount) {
				//Поиск по соответствию числа типов эл-тов числу имеющихся
				var patternTextCount = new Object();
				patternTextCount.header = 0;
				patternTextCount.innerHeader = 0;
				patternTextCount.title = 0;
				patternTextCount.usual = 0;
				for (var i in this.usedPatterns[slideType][k].text) {
					var textType = this.usedPatterns[slideType][k].text[i].textType;
					patternTextCount[textType]++;
				}
				//Нашли
				if ((this.usedPatterns[slideType][k].icons.length == iconCount) && (patternTextCount.header == itemTextCount.header) && (patternTextCount.innerHeader == itemTextCount.innerHeader) && (patternTextCount.usual == itemTextCount.usual) && (patternTextCount.title == itemTextCount.title)) {
					possiblePatterns.push(new oneReturnedPattern(this.usedPatterns[slideType][k], k));
				}
			}
		}
		return possiblePatterns;
	},

	findPattentAtIndex: function(slideType, index) {
		return this.usedPatterns[slideType][index];
	},

	addLog: function(logObj) {
		if (statusAutoSave) {
			save_pres();
		}
		this.logs[this.curLogPos] = logObj;
		this.curLogPos++;
		//Удалить старные логи, если остались
		this.logs.splice(this.curLogPos, (this.logs.length - this.curLogPos))

	},

	getLog: function() {
		this.curLogPos--;
		return this.logs[this.curLogPos];
	},

	reverseLogs: function() { //Откатить на 1 изменение назад

		if (this.curLogPos == 0)
			return false;
		this.curLogPos--;
		return this.applyLogs();
		// $(".angular-dnd-resizable-handle").remove();
	},

	forwardLogs: function() { //Откат на 1 изменение вперед
		if (this.curLogPos == this.logs.length)
			return false;
		var type = this.applyLogs();
		this.curLogPos++;
		return type;
	},

	applyLogs: function() {
		var idStr = this.logs[this.curLogPos].id;
		var ids = new Array();
		try {
			ids = idStr.split('_');
		} catch (e) {
			ids[0] = idStr;
		}
		var slideId = ids[0];
		var itemId = ids[1];
		var childId = ids[2];
		switch (ids.length) {
			case 1:
				// this.slides[slideId] = clone(this.logs[this.curLogPos].prevState);
				switch (this.logs[this.curLogPos].type) {
					case 'addItem':
						this.slides[slideId].items = clone(this.logs[this.curLogPos].prevState.items);
						break;
					case 'dublicateSlide':
					case 'createSlide':
					case 'deleteSlide':
						// this.slides = clone(this.logs[this.curLogPos].prevState);
						this.slides = clone(this.logs[this.curLogPos].prevState);
						// for (var k in this.logs[this.curLogPos].prevState) {
						// 	var slide = this.logs[this.curLogPos].prevState[k];
						// 	this.slides[k] = clone(slide);
						// }
						//background, css, items, slideType
						break;
					default:
						this.slides[slideId] = clone(this.logs[this.curLogPos].prevState);
						break;
				}

				break;
			case 2:
				this.slides[slideId].items[itemId] = clone(this.logs[this.curLogPos].prevState);
				break;
			case 3:
				this.slides[slideId].items[itemId].childItems[childId] = clone(this.logs[this.curLogPos].prevState);
				break;
		}

		return this.logs[this.curLogPos].type;
	},

	preparePresentationForSave: function() {
		var presentation_object_for_save = clone(this);
		//обрезать все active в объекте
		//console.log(presentation_object_for_save);
		for (var k in presentation_object_for_save.slides) {
			var curSlide = presentation_object_for_save.slides[k];
			curSlide.active = false;
			curSlide.curClass = '';
			curSlide.showDopMenuButton = false;
			for (var i in curSlide.items) {
				var curContainer = curSlide.items[i];
				curContainer.active = false;
				curContainer.cssContainer["border"] = '';
				for (var t in curContainer.childItems) {
					curContainer.childItems[t].active = false;
					curContainer.childItems[t].css["border"] = '';
				}
			}

		}
		return JSON.stringify(presentation_object_for_save);
	}
}

presentationProt = {
	template: null, //Template Ref
	curWidth: 1000, //Текущий размер слайда презентации (в пикселях)
	curFontSize: 50,
	slides: null,
	logs: null,
	curLogPos: 0,
	usedPatterns: null, //Массив шаблонов по типам слайдов
	autoLayoutTurnOn: false, //Включена ли автоверстка
	lineHelpersTurnOn: true, //---направляющие включены
	autoBringTurnOn: true //----автоподводка включена
}

logProt = {
	id: '', //По шаблону "slideId_containerId_ChildId"
	prevState: null, //clone предыдущего объекта
	eventType: '', //Тип событяи
}

newThemeWizard = { //Новый Костин
	ratio: '16:9',
	color: {
		firstCode: '#884DFF',
		secondCode: '#BB99FF',
		thirdCode: '#DDCCFF',
		fourthCode: '#ffffff'
	}, //коды цветов
	imgSrc: {
		firstPattern: '/images/patterns/1_1.svg',
		middlePattern: '/images/patterns/1_2.svg',
		lastPattern: '/images/patterns/1_3.svg'
	}, //пути к background
	font: {
		font_color: {
			firstCode: '#ffffff',
			secondCode: '#ffffff',
			thirdCode: '#ffffff',
			fourthCode: '#BB99FF'
		},
		fontStyles: {
			header: {
				'font-family': "Open Sans Condensed",
				'font-weight': 300,
			},
			innerHeader: {
				'font-family': "Open Sans Condensed",
				'font-weight': 300,
			},
			title: {
				'font-family': "Open Sans Condensed",
				'font-weight': 300,
			},
			usual: { /////
				'font-family': "Open Sans Condensed",
				'font-weight': 300,
			}
		}
	},
	graphic: {
		color: {
			firstCode: '#5500FF',
			secondCode: '#CCFF66',
			thirdCode: '#BBFF33',
			fourthCode: '#7733FF'
		},
		background: '/images/wizard_icons/background/1.svg',
		imgSrc: {
			firstIcon: '/images/wizard_icons/icons/1_1.svg',
			middleIcon: '/images/wizard_icons/icons/1_2.svg',
			lastIcon: '/images/wizard_icons/icons/1_3.svg'
		}
	}
}

templateProt = {
	ratio: '', //16:9 or 4:3
	colorScheme: 0, //number or Object
	patternFirst: '', //url-background
	patternMiddle: '', //url-background
	patternLast: '', //url-background
	font: [{
		fontFamily: '',
		fontSize: 0,
		fontWeight: 0
	}],
	illColour: '', //Цвет Иллюстрации
	illStyle: 0,
}

slideMethods = {
	initSlide: function(type, presTemplate) { //Инициализация вновь созданного слайда
		this.slideType = type;
		// str = '';
		// for (var k in presTemplate.imgSrc)
		// 	str += k+' '+presTemplate.imgSrc[k]+'\n'
		// alert(str)
		switch (type) {
			case 'first':
				this.background = presTemplate.imgSrc.firstPattern;
				break;
			case 'middle':
				this.background = presTemplate.imgSrc.middlePattern;
				break;
			case 'last':
				this.background = presTemplate.imgSrc.lastPattern;
				break;
		}
		//this.css["background-image"] = "url(" + this.background + ")";
	}
}

slideProt = {
	//number: 0, //Номер слайда
	css: null, //Стили
	background: '', //src background DEPRECATED
	bkgShow: true,
	items: null, //массив содержимого
	slideType: '', //first, middle, last
	active: false, //Активен ли слайд (отображение плюса для дублирования и создания слайда)
	maxZIndex: 0, //Максимальный z-index элементов
}

itemHTMLProt = {
	//Параметры нельзя инициализировать здесь, при отображенни они сами определяться какие должня быть
	//Использовать параметры только при сохранении объекта
	top: 0 + '%',
	left: 0 + '%',
	width: 100 + '%',
	height: 0 + '%',
}

itemContainerMethods = {
	addChild: function(childObject) {
		this.childItems.push(childObject);
	},

	addChildAtIndex: function(childObject, index) {
		this.childItems.splice(index, 0, childObject);
		//this.childItems.push(childObject);
	},

	addBestArea: function(areaObject) { //Добавление одно наилучей области
		var area = new bestArea(areaObject);
		this.bestAreas.push(area);
	},

	cleanBestAreas: function() { //Очистка массива наилучших областей
		this.bestAreas = [];
	},

	convertContainerSizeInPx: function() {
		this.itemRef.width = this.sizeInPx('width');
		this.itemRef.height = this.sizeInPx('height');
		this.itemRef.left = this.sizeInPx('left');
		this.itemRef.top = this.sizeInPx('top');
	},

	convertContainerSizeInPercent: function() {
		this.itemRef.width = parseFloat(this.itemRef.width) / presentationObject.curWidth * 100 + '%';
		this.itemRef.height = parseFloat(this.itemRef.height) / presentationObject.curHeight * 100 + '%';
		this.itemRef.left = parseFloat(this.itemRef.left) / presentationObject.curWidth * 100 + '%';
		this.itemRef.top = parseFloat(this.itemRef.top) / presentationObject.curHeight * 100 + '%';
	},

	convertChildsSizeInPx: function() {
		for (var k in this.childItems) {
			var curChild = this.childItems[k];
			curChild.itemRef.height = curChild.sizeInPx(this, 'height');
			curChild.itemRef.width = curChild.sizeInPx(this, 'width');
			curChild.itemRef.top = curChild.sizeInPx(this, 'top');
			curChild.itemRef.left = curChild.sizeInPx(this, 'left');
		}
	},

	convertChildsSizeInPercent: function() {
		var containerWidth = this.sizeInPx('width');
		var containerHeight = this.sizeInPx('height');
		for (var k in this.childItems) {
			var curChild = this.childItems[k];
			curChild.itemRef.height = curChild.itemRef.height / containerHeight * 100 + '%';
			curChild.itemRef.width = curChild.itemRef.width / containerWidth * 100 + '%';
			curChild.itemRef.top = curChild.itemRef.top / containerHeight * 100 + '%';
			curChild.itemRef.left = curChild.itemRef.left / containerWidth * 100 + '%';
		}

	},

	sizeInPx: function(side) { //containerSide - Размер в пикселях, относительно которого строилось в процентах
		if ((side === 'top') || (side === 'height')) {
			return parseFloat(this.itemRef[side]) * presentationObject.curHeight / 100;
		} else {
			return parseFloat(this.itemRef[side]) * presentationObject.curWidth / 100;
		}

		return false;
	},
}

itemContainerProt = { //Объект контейнера
	active: false, //Активен ли элемент
	selectable: true, //можно ли делать select элемента с помощью лассо
	bestAreas: null, //Массив с наилучшими областями
	showAreas: true, //Показывать ли области
	inArea: false, //Находится элемент в области или нет
	itemRef: null, //Указатель на контейнер HTML
	cssContainer: null, //Указатель на объект стиля контейнера
	childItems: null,
	curPatternIndex: -1,
	domElement: null, //Указатель на элемент в DOM
	externalPosition: null
}

bestAreaProt = {
	top: 0,
	left: 0,
	width: 0,
	height: 0,
}

textProt = {
	//itemRef: null, //Указатель на контейнер HTML
	//itemContainer: null, //Указатель на объект контейнера
	textType: null,
	textContainerCss: null,
	value: '',
	css: null,
	itemRef: null, //Указатель на контейнер HTML
	textEditorId: '', //идентификатор текущего id для СkEditor
	isActive: false,
	preventAutoResize: false,
	resizeHandlers: '',
	hierarchy: '0_0', //Иерархия элемента. По умолчанию он самый первый и единственный
}

imageProt = {
	textContainerCss: null,
	colors: null,
	url: '',
	itemRef: null, //Указатель на контейнер HTML
	hierarchy: '0_0', //Иерархия элемента. По умолчанию он самый первый и единственный
}

infografProt = {
	value: '',
	css: ''
}

//Прототип микрошаблона растснаовки элементов
microPatternProt = {
	elCount: 0, //Число объектов в шаблоне
	usedTimes: 0, //Сколько раз использован
	icons: null,
	text: null
}

//Прототип иконки для микрошаблона
microPatternIconsProt = {
	hierarchy: '', //Иерархия. Строится по номерам вертикальная_горизонтальная позиции, например, 0_0, если это первый элемент и один в строке
	width: '',
	height: '',
	top: '',
	left: '',
	css: null,
}
//Прототип текста для микрошаблона
microPatternTextProt = {
	hierarchy: '', //Иерархия. Строится по номерам вертикальная_горизонтальная позиции, например, 0_0, если это первый элемент и один в строке
	textType: '',
	css: null,
	width: '',
	top: '',
	left: '',
}

function presentation() {
	// newThemeWizardServer = JSON.parse(JSON.stringify({$('#wizardObj').attr('value')})); 
	eval('newThemeWizardServer='+$('#wizardObj').attr('value'));
	// console.log($('#wizardObj').attr('value')); 
	if (newThemeWizardServer) { 
		console.log("newThemeWizardServer");
		this.template = newThemeWizardServer;
	} else { 
		console.log("newThemeWizard: ");// + newThemeWizardServer);
		// console.log(newThemeWizardServer);
		this.template = presentationObject;
		// console.log('ob = ', newThemeWizard);
	}
	this.slides = new Array();
	this.logs = new Array();
	this.curLogPos = 0;
	this.usedPatterns = new Object(); 

	//По типам слайдов first, middle, last
	this.usedPatterns.first = new Array();
	this.usedPatterns.middle = new Array();
	this.usedPatterns.last = new Array();

	for (var k in presentationMethods)
		this[k] = presentationMethods[k];
}
presentation.prototype = presentationProt;

function template() {
	this.prototype = templateProt;
}
template.prototype = templateProt;

function slide(type, presTemplate) {
	this.slideType = type;
	//this.number = number;
	switch (type) {
		case 'first':
			this.background = presTemplate.imgSrc.firstPattern;
			break;
		case 'middle':
			this.background = presTemplate.imgSrc.middlePattern;
			break;
		case 'last':
			this.background = presTemplate.imgSrc.lastPattern;
			break;
	}
	//this.background = background;
	this.items = new Array();
	this.css = new Object();
	//this.css["background-image"] = "url(" + this.background + ")";
	//this.css.width = '43px';

	for (var k in slideMethods)
		this[k] = slideMethods[k];

}
slide.prototype = slideProt;

function slideItem(childObject) {
	this.childItems = new Array();
	this.bestAreas = new Array();
	this.itemRef = new HTMLItem();
	this.cssContainer = new Object();
	// this.cssContainer["z-index"] = 100;
	this.externalPosition = new Object();
	this.externalPosition.top = '0%';
	this.externalPosition.right = '0%';

	for (var k in itemContainerMethods)
		this[k] = itemContainerMethods[k];

	if (childObject)
		this.addChild(childObject);
}

slideItem.prototype = itemContainerProt;

function HTMLItem() {}

HTMLItem.prototype = itemHTMLProt;


//Наилучшие области для размещения объекта
//Конструктор, испоьзуется для инициализации области. Только css стили для отображения области
function bestArea(areaObject) {
	this.top = areaObject.top;
	this.left = areaObject.left;
	this.width = areaObject.width;
	this.height = areaObject.height;
}

bestArea.prototype = bestAreaProt;


itemsMethods = {
	sizeInPx: function(container, side) {
		if ((side === 'top') || (side === 'height')) {
			var containerHeight = container.sizeInPx('height')
			return parseFloat(this.itemRef[side]) * containerHeight / 100;
		} else {
			var containerWidth = container.sizeInPx('width')
			return parseFloat(this.itemRef[side]) * containerWidth / 100;
		}

		return false;
	}
}

function textItem(type, content, fontStyles) {
	this.textType = type;
	this.value = content;
	this.css = clone(fontStyles[this.textType]);
	this.textContainerCss = new Object();
	this.css["pointer-events"] = 'none';
	this.css["line-height"] = 1.5;
	//this.itemRef = new HTMLItem();
	this.active = false; //Активность элемента
	this.key = "textItem";
	this.itemRef = new HTMLItem();
	for (var k in itemsMethods)
		this[k] = itemsMethods[k];
	//this.itemContainer = new slideItem();
	//var item = this.itemRef; //Переменная для указтеля на объект элемента. Пока для использования для инициализации наилучших областей
	//alert(this.itemRef.bestAreas + ' ' + item.bestAreas)
}
textItem.prototype = textProt;

function iconItem(value) {
	this.value = value;
	this.active = false;
	this.css = new Object();
	this.textContainerCss = new Object();
	// this.css.width = "150px";
	// this.css.height = "150px";
	// this.css.top = 0 + 'px';
	// this.css.left = 0 + 'px';
	this.colors = new Array();
	for (var k in presentationObject.template.graphic.color) {
		this.colors.push(presentationObject.template.graphic.color[k]);
	}
	this.key = "objectItem";
	this.subKey = 'objectItem';
	this.initedsize = new Object();
	this.initedsize.width = 150;
	this.initedsize.height = 150;
	this.itemRef = new HTMLItem();
	this.itemRef.width = '100%';
	this.itemRef.height = '100%';
	for (var k in itemsMethods)
		this[k] = itemsMethods[k];
}
iconItem.prototype = imageProt;

function imageItem(value, width, height) {
	this.value = value;
	this.active = false;
	this.css = new Object();
	this.textContainerCss = new Object();
	// this.css.width = "150px";
	// this.css.height = "150px";
	// this.css.top = 0 + 'px';
	// this.css.left = 0 + 'px';
	this.key = "objectItem";
	this.subKey = 'imageItem';
	this.initedsize = new Object();
	this.initedsize.width = width;
	this.initedsize.height = height;
	this.itemRef = new HTMLItem();
	this.itemRef.width = width + 'px';
	this.itemRef.height = height + 'px';
	for (var k in itemsMethods)
		this[k] = itemsMethods[k];
}
imageItem.prototype = imageProt;

var standartGraphObject = {
	chart: {
        type: 'line'
    },
    title: {
        text: 'Monthly Average Temperature'
    },
    subtitle: {
        text: 'Source: WorldClimate.com'
    },
    xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    yAxis: {
        title: {
            text: 'Temperature (°C)'
        }
    },
    plotOptions: {
        line: {
            dataLabels: {
                enabled: true
            },
            enableMouseTracking: false
        }
    },
    series: [{
        name: 'Tokyo',
        data: [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
    }, {
        name: 'London',
        data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
    }]
}

function graphItem(type, fontStyles) {
	this.active = false;
	this.value = "graphic";
	this.css = new Object();
	this.textContainerCss = new Object(); 
	this.colors = new Array();
	for (var k in presentationObject.template.graphic.color) {
		this.colors.push(presentationObject.template.graphic.color[k]);
	}
	this.textStyles = clone(fontStyles[this.textType]); 
	this.key = "objectItem";
	this.subKey = 'graphItem';
	this.initedsize = new Object();
	this.initedsize.width = 400;
	this.initedsize.height = 300;
	this.itemRef = new HTMLItem(); 
	this.itemRef.width = 400;
	this.itemRef.height = 300;
	for (var k in itemsMethods)
		this[k] = itemsMethods[k];

	this.graphType = type;
	this.title = new Object();
	this.title.text = '';
	this.subtitle = new Object();
	this.subtitle.text = '';
	xAxis = new Object();
	yAxis = new Object();
	this.plotOptions = new Object();
}
// graphItem.prototype = standartGraphObject;


function infograf(content) {
	this.value = content;
	this.css = new Object;
}
infograf.prototype = infografProt

function logObj(id, objRef, type) {
	this.id = id;
	this.prevState = clone(objRef);
	if (this.prevState.cssContainer)
		this.prevState.cssContainer['border'] = '';
	for (var k in this.prevState.childItems) {
		this.prevState.childItems[k].css['border'] = '';
	}
	this.type = type;

}

logObj.prototype = logProt;

function microPattern(items) { //Массив элементов для создания шаблона (childItems)
	this.icons = new Array();
	this.text = new Array();
	this.elCount = items.length;
	this.usedTimes = 1;
	for (var i in items) {
		switch (items[i].key) {
			case 'objectItem':
				this.icons.push(new microPatternIcons(items[i]));
				break;
			case 'textItem':
				this.text.push(new microPatternText(items[i]));
				break
		}
	}
}

microPattern.prototype = microPatternProt;

function microPatternIcons(item) {
	// this.width = item.itemRef.width;
	// this.height = item.itemRef.height;
	// this.top = item.itemRef.top;
	// this.left = item.itemRef.left;
	this.itemRef = clone(item.itemRef);
	this.css = clone(item.css);
	this.hierarchy = item.hierarchy;
	this.tmpPosition = item.tmpPosition;
	this.type = 'objectItem';
}

microPatternIcons.prototype = microPatternIconsProt;

function microPatternText(item) {
	// this.width = item.itemRef.width;
	// this.top = item.itemRef.top;
	// this.left = item.itemRef.left;
	this.itemRef = clone(item.itemRef);
	this.textType = item.textType;
	this.css = clone(item.css);
	this.hierarchy = item.hierarchy;
	this.tmpPosition = item.tmpPosition;
	this.type = 'textItem';
}

microPatternText.prototype = microPatternTextProt;


//Объект инфографики от Андрея
// {
// 	"data": [{
// 		"img": "1.png",
// 		"text": "1"
// 	}, {
// 		"img": "2.png",
// 		"text": "2"
// 	}]
// }

	//-------Объект ряда элементов
Composition = function() {
	return {
		widthHeightObj: new Array(),
		rowNumber: 0,
		elementsInRow: 0,
		allWidth: 0,
		allHeight: 0
	}
}

//------Объект кирпичиков
BlocksInit = function() {
	return {
		width: 0,
		height:0,
		elements: new Array(),
		free: true,
		topOfBlock: 0,
		leftOfBlock: 0,
		topCurrent: 0, 
	}
}

var Blocks = new Array();
var searchObject = new Array();

//---объект поиска для автоверстки
Search = function() {
	return {
		maxLeftIndex: 0,
		minLeftIndex: 0,
		maxTopIndex: 0,
		minTopIndex: 0,
		baseLineSizeInPercent: 100 * (30 * presentationObject.curWidth / 1920) / presentationObject.curHeight,
		wholeWidth: 0,
		wholeHeight: 0,
		topObject: new Object(),
		leftObject: new Object(),
		sumOfColumnsWidth: 0,
		checkedSum: 0,
		savedHeight: 0,
		savedWidth: 0,
		curActiveStringLength: 0
	}
}