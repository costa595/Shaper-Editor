
//Слияние темы из визарда и размеров шрифтов

function mergeTheme() { 
		//ЗАГОЛОВОК
		for (var slideT in fontsPatternStyles) { //first, middle, last
			var curSlideType = fontsPatternStyles[slideT];
			for (var fontType in curSlideType) { //header, innerHeader, usual
				var curFontType = curSlideType[fontType];
				for (var wizardFontStyle in presentationObject.template.font.fontStyles[fontType]) { //По стилю текста
					curFontType[wizardFontStyle] = presentationObject.template.font.fontStyles[fontType][wizardFontStyle]
				}
				switch (fontType) {
					case 'header':
						curFontType['color'] = presentationObject.template.font.font_color.firstCode;
						break;
					case 'innerHeader':
						curFontType['color'] = presentationObject.template.font.font_color.secondCode;
						break;
					case 'title':
						curFontType['color'] = presentationObject.template.font.font_color.secondCode;
						break;
					case 'usual':
						curFontType['color'] = presentationObject.template.font.font_color.thirdCode;
						break;
				}
			}

		}
		presentationObject.template.font.fontStyles = fontsPatternStyles;
	}
	/*
	 Конвертирует px в em и наоборот.
	source - px, em, pt - текущая единица измерения
	target - px, em, pt - требуемая единица измерения

	Размер шрифта базовый получаем из middleDesk.css('font-size')
	*/

function colorSlide() {
	var intervalID = setInterval(function() {
		color_pattern(slidesColorArr, 'slide_background', intervalID);
	}, 2);
}

function colorSlideAddingPreview() {
	var intervalID = setInterval(function() {
		color_pattern(slidesColorArr, 'add_slide_preview', intervalID);
	}, 2);
}

function colorItem(item) {
	var colors = $(item).attr('colors').split(',');
	var curClass = $(item).attr('class-for-color');
	var intervalID = setInterval(function() {
		color_pattern(colors, curClass, intervalID);
	}, 2);
}