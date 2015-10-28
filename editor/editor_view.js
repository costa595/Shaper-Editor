$("document").ready(function() {
	resize_window_editor();
	firstInicialization();
	lockStyleText();
	$(window).resize(function() {
		resize_window_editor();
	});

	/*Треугольник в боковом меню*/
	$('.colorBlocks li').click(function() {
		
		  current_color_index = $(this).index() + 1;
	      var height = (current_color_index - 1) * 34;
	      if (current_color_index == 0) {
	        $("#triangle_colorShem").animate({"margin-left":'0px'});
	      }
	      else {
	        $("#triangle_colorShem").animate({"margin-left":height});
	          
	      }
	});

	$('#autoStyleTextEditorAuto').click(function(){
		lockStyleText();
	})
	


	/*AutoSave*/
	// $('body').click(function(){
	// 	$('#wrapStatusSave').removeClass('openWrapStatusSave');
	// 	$('#statusAutoSave').removeClass('openStatusSaveSimple');
	// 	$('#statusAutoSave').css('display','none');

		
	// 	if ((!$('#wrapStatusSave').hasClass('openWrapStatusSave'))&&(!statusAutoSave)) {
	// 		$('#wrapStatusSaveChangeContent').html(
	// 			'<div class="wrapStatusSaveSimple">'+
	// 			'<div class="simpleSaveRedButton">'+
	// 						'<div id="buttonSaveSimpleButton" class="buttonSaveSimpleButton" onclick="simpleSaveButton(event)">'+
	// 							'<a class="textSaveButton">Сохранить</a>'+
	// 						'</div>'+
	// 						'<div id="buttonShowPopup" class="buttonShowPopup" onclick="simpleSaveOpenPopup();">'+
	// 							'<a class="showPopup"></a>'+
	// 						'</div>'+
	// 					'</div>'+
	// 			'<div id="statusAutoSave" onclick="statusAutoSaveStopEvent(event);" class="popupWithTextEditor">'+
	// 						'<div class="wrapAutoSaveSwitch">'+
	// 							'<div class="textAutoSave">Автосохранение</div>'+
	// 							'<div id="autoSaveSwitch" class="OnOffButton inheritOnOffButton" onclick="changeStatusAutoSave()">'+
	// 								'<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="myonoffswitch_auto_save">'+
	// 								'<label class="onoffswitch-label" for="myonoffswitch_auto_save">'+
	// 									'<span class="onoffswitch-inner"></span>'+
	// 									'<span class="onoffswitch-switch"></span>'+
	// 								'</label>'+
	// 							'</div>'+
	// 						'</div>'+
	// 						'<div class="dataLastAutoSave">Последнее сохранение: 21 мин. назад</div>'+
	// 					'</div></div></div>');
	// 	}
	// 	if ((!$('#statusAutoSave').hasClass('openWrapStatusSave'))&&(!$('#wrapStatusSave').hasClass('openWrapStatusSave'))&&(statusAutoSave)){
	// 			$('#wrapStatusSaveChangeContent').html(
	// 						'<div id="wrapStatusSave" class="wrapStatusSave" onclick="clickOnWrapStatusSave();">'+
	// 							'<div id="statusSave">'+
	// 								'<a></a>'+
	// 							'</div>'+
	// 								'<span id="textstatusSave">Сохранено</span>'+
	// 							'<div id="statusAutoSave" class="popupWithTextEditor" onclick="statusAutoSaveStopEvent(event);">'+
	// 								'<div class="wrapAutoSaveSwitch">'+
	// 									'<div class="textAutoSave">Автосохранение</div>'+
	// 									'<div id="autoSaveSwitch" class="OnOffButton inheritOnOffButton" onclick="changeStatusAutoSave();">'+
	// 										'<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="myonoffswitch_auto_save" checked="checked">'+
	// 										'<label class="onoffswitch-label" for="myonoffswitch_auto_save">'+
	// 											'<span class="onoffswitch-inner"></span>'+
	// 											'<span class="onoffswitch-switch"></span>'+
	// 										'</label>'+
	// 									'</div>'+
	// 								'</div>'+
	// 								'<div class="dataLastAutoSave">Последнее сохранение: 21 мин. назад</div>'+
	// 							'</div>'+
	// 						'</div>');
	// 	}
	// });
});

function simpleSaveButton(event){
	event.stopPropagation();
}
function statusAutoSaveStopEvent(event){
	event.stopPropagation();
}
//statusAutoSave = true;
function changeStatusAutoSave(){
	if ($('#myonoffswitch_auto_save').prop( "checked" )) {
		statusAutoSave = true;
		$.ajax({
			type: 'POST',
			url: '/php/wizard.php?ref=autos',
			data: {
				act: 'true'
			},
			success: function(res) {
			}
		});
	}
	else{
		statusAutoSave = false;
		$.ajax({
			type: 'POST',
			url: '/php/wizard.php?ref=autos',
			data: {
				act: 'false'
			},
			success: function(res) {
			}
		});
	}
}
function lockStyleText(){
	if ($('#autoStyleTextEditorAuto').prop('checked')) {
		$('#lockIconTextStyle').css('display','block');
	}
	else{
		$('#lockIconTextStyle').css('display','none');	
	}
}
function simpleSaveOpenPopup(){
	event.stopPropagation();
	if ($('#statusAutoSave').hasClass('openStatusSaveSimple')) {
		$('#statusAutoSave').removeClass('openStatusSaveSimple');
		$('#statusAutoSave').css('display','none');
		console.log(1)
	}
	else{
		console.log(2)
		$('#statusAutoSave').addClass('openStatusSaveSimple');
		$('#statusAutoSave').css('display','block');
	}
}
function clickOnWrapStatusSave(){
	event.stopPropagation();
	if ($('#wrapStatusSave').hasClass('openWrapStatusSave')) {
		$('#wrapStatusSave').removeClass('openWrapStatusSave');
		$('#statusAutoSave').css('display','none');
		console.log(1)
	}
	else{
		console.log(2)
		$('#wrapStatusSave').addClass('openWrapStatusSave');
		$('#statusAutoSave').css('display','block');
	}
}
/*End AutoSave*/

/*Функция */
function firstInicialization(){
	var count_of_slide = presentationObject.slides.length;
	var new_width_scroll = ((count_of_slide) * 167);
	$('.scroller ul').width(new_width_scroll);
}
function scroll_left_position(click_number, count_of_slide) {
	var width_scroll = (((click_number) * 167) + 12);
	var width_scroll_ul = $('.scroller ul');
	width_scroll_ul.width(width_scroll_ul.width() + 2000);
	$('.scroller').scrollLeft(width_scroll);
	$('.scroller').css("overflow", "hidden");
	$('.scroller__bar.scroller__bar_h').css('display', 'none');
}
/*Функция дублирования*/
function resize_scroll_width_duble(click_number, count_of_slide) {
	var new_width_scroll = (count_of_slide) * 167 + 135 + 40;
	var width_scroll = (((count_of_slide) * 167) + 180);
	$('.scroller ul').width(new_width_scroll);
	if (($('#main_slide').width() - width_scroll) < 0) {
		$('.scroller__bar.scroller__bar_h').css('display', 'block');
	}
}
/*Функция выбора одного из 3х патернов*/
function scroll_left_position_end(count_of_slide) {
	var width_scroll = (((count_of_slide - 1) * 167) + 175);
	$('.scroller').css("overflow", "auto");
	if (($('#main_slide').width() - width_scroll) < 0) {
		$('.scroller__bar.scroller__bar_h').css('display', 'block');
		alert('1')
	}
	alert('2')
	$('.scroller ul').width(width_scroll);
	$('.scroller').scrollLeft(width_scroll - $('#main_slide').width());

}

/*Функция выбора создания дублирования или удаления*/
function slide_popup_on(click_number, count_of_slide) {

	var currentClickLi = $('.small_slides.ui-sortable li').eq(click_number);
	var currentClickLiTop = currentClickLi.offset().top;
	var currentClickLiLeft = currentClickLi.offset().left;
	$('.popup_add').css({top:currentClickLiTop - 74, left:currentClickLiLeft + 3});
	// if (count_of_slide - (click_number + 1) <= 2) {
	// 	var width_scroll = (((count_of_slide) * 167) + 165);
	// 	$('.scroller ul').width(width_scroll);
	// 	$('.scroller').scrollLeft(width_scroll - $('#main_slide').width())
	// }
}

function delete_slide(count_of_slide) {
	var width_scroll = (((count_of_slide - 1) * 167) + 180);
	if (count_of_slide == 0) {
		$('.scroller ul').width(width_scroll + 180);
	} else {
		$('.scroller ul').width(width_scroll);
	}
}

/*Функция переопределния ширины окна шаблона, и отношения сторон*/
function resize_window_editor() {
	var visota = $("html").height();
	$("#menu, #desk").height(visota);
	$('#assistent ,#styles, #layout, #add, #magic, #images, #imageIllustration,#layoutGlobal').height(visota - 60);
	$('#baronImagesCollections').height(visota - 210)
	var ratio = 9 / 16; // высота равна половине ширины
	var slide_div = $('#main_slide'); // кэшируем результат вызова функции
	var height_main_slide = slide_div.width() * ratio;
	var width_main_slide = $('#middle_desk').width();
	var visota_editor = $("html").height();
	var slides_list = $("#slides_list");
	$("#desk,#menu").height(visota_editor);
	var max_height = visota_editor - 240;

	if (max_height >= height_main_slide) {
		if (width_main_slide * 0.8 >= max_height * (1 / ratio)) {
			slide_div.width(max_height * (1 / ratio));
			slide_div.height(max_height);
			slides_list.width(max_height * (1 / ratio));
		} else {
			slide_div.width(width_main_slide * 0.8);
			slide_div.height((width_main_slide * 0.8) * ratio);
			slides_list.width(width_main_slide * 0.8);
		}
		var left_popup = (slide_div.width() - 530) / 2;
		$('.slide_popup').css('left', left_popup)
	} else {
		slide_div.height(max_height);
		slide_div.width(max_height * (1 / ratio));
		slides_list.width(max_height * (1 / ratio));
		var left_popup = (slide_div.width() - 530) / 2;
		$('.slide_popup').css('left', left_popup)

	}
	positionPopupChooseTypeOfSlide();
	resizeContent(slide_div.width());

}

function positionPopupChooseTypeOfSlide(first_slide) {
	/*Определение позиции треугольника и popup в случае, когда треугольник выходит */
	var left_triangle = 223 - (($('#main_slide').width() - 500) / 2);
	if (first_slide == 1) {
		$('#triangle_1').css('left', 55)
		$('#triangle_2').css('left', 55)
		$('.slide_popup').css('left', 10)
		first_slide = undefined;
	} else {
		if (left_triangle > 0) {
			$('#triangle_1').css('left', left_triangle)
			$('#triangle_2').css('left', left_triangle)
		} else {
			var left_popup = ($('#main_slide').width() - 530) / 2;
			var summ = left_popup + left_triangle - 50
			left_triangle = 223 - summ
			$('.slide_popup').css('left', summ)
			$('#triangle_1').css('left', left_triangle)
			$('#triangle_2').css('left', left_triangle)
		}
	}
}

function ShowSliderText() {
	if (document.getElementById('ButtonEditTextPopup_StyleOfText_On').style.visibility == '' || document.getElementById('ButtonEditTextPopup_StyleOfText_On').style.visibility == 'hidden') {

		//$("#ButtonEditTextPopup_StyleOfText_On").css('display','block');
		$("#ButtonEditTextPopup_StyleOfText_On").css('visibility', 'visible');
		$("#ButtonEditTextPopup_StyleOfText_img_left").css('background', '#dcdcdc');

	} else {
		hideSliderText()
	}
}

function hideSliderText() {
	$("#ButtonEditTextPopup_StyleOfText_On").css('visibility', 'hidden');
	$("#ButtonEditTextPopup_StyleOfText_img_left").css('background', '#ffffff');
}


function resizeContent(slideWidth) {
	var itemIndex = 0;
	var items = $(".containerObject"); //Поиск всех элементов со слайда
	var tmpContainer = $("#tmpTextPlace")
	//alert(presentationObject.curWidth)
	var resizeKoef = slideWidth / presentationObject.curWidth; //Считаем коэффициент изменения размера
	
	// //По всем элементам
	// for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
	// 	var curItem = $(items[itemIndex])
	// 	var textareas = curItem.find('.texteditor');
	// 	// 	//По текстовым элементам
	// 	for (var textareaIndex = 0; textareaIndex < textareas.length; textareaIndex++) {
	// 		var curTextarea = $(textareas[textareaIndex]);
			
	// 		// var fontSize = Math.ceil(parseInt(curTextarea.css('font-size')) * resizeKoef);
	// 		// console.log('fontSize', fontSize, slideWidth)

 //   //          if (fontSize % 2)
	// 		// {
 //   //              ++fontSize;
 //   //          }

			
	// 		// var textareaHeight = parseInt(curTextarea.css('height')) * resizeKoef;
	// 		var letterSpacing = parseInt(curTextarea.css('letter-spacing')) * resizeKoef;
	// 		// curTextarea.css('font-size', fontSize);
			
	// 		curTextarea.css('letter-spacing', letterSpacing)

	// 	}
	// 	var itemTop = parseInt(curItem.css('top')) * resizeKoef.toFixed(8);
	// 	var itemLeft = parseInt(curItem.css('left')) * resizeKoef.toFixed(8);
	// 	var itemWidth = parseInt(curItem.css('width')) * resizeKoef.toFixed(8);
	// 	var itemHeight = parseInt(curItem.css('height')) * resizeKoef.toFixed(8);
	// 	curItem.css('top', itemTop);
	// 	curItem.css('left', itemLeft);
	// 	curItem.css('width', itemWidth);
	// 	curItem.css('height', itemHeight);

	// }
	// for (var slidesIter = 0; slidesIter < presentationObject.slides.length; slidesIter++) {
	// 	var curSlide = presentationObject.slides[slidesIter];
	// 	for (var itemIter = 0; itemIter < curSlide.items.length; itemIter++) {
	// 		var curItem = curSlide.items[itemIter];
	// 		//Контейнер
	// 		curItem.itemRef.width = Math.round(parseInt(curItem.itemRef.width) * resizeKoef);
	// 		curItem.itemRef.height = Math.round(parseInt(curItem.itemRef.height) * resizeKoef);
	// 		curItem.itemRef.top = Math.round(parseInt(curItem.itemRef.top) * resizeKoef);
	// 		curItem.itemRef.left = Math.round(parseInt(curItem.itemRef.left) * resizeKoef);
	// 		//Текст
	// 		for (var chitdIter = 0; chitdIter < curItem.childItems.length; chitdIter++) {
	// 			var childItem = curItem.childItems[chitdIter];
	// 			//childItem.css['font-size'] = Math.round(parseInt(childItem.css['font-size']) * resizeKoef);
			
	// 			childItem.css['letter-spacing'] = Math.round(parseInt(childItem.css['letter-spacing']) * resizeKoef);
	// 			resizeItemContainer(curItem, true);
	// 		}
	// 	}
	// }
	// //Конвентер по шаблонным размерам шрифта
	// //fontsPatternStyles.first.header['font-size']
	// var fontResizeKoef = slideWidth / fontsPatternStyles.sizeForWidth; //Считаем коэффициент изменения размера шрифта. Так как изначально при загрузке темы (не объекта презентации размер шрифта сделан под 1920 пикселей)
	// for (var slideT in fontsPatternStyles) { //first, middle, last
	// 	var curSlideType = fontsPatternStyles[slideT];
	// 	for (var fontType in curSlideType) { //header, innerHeader, usual
	// 		curSlideType[fontType]['font-size'] = Math.round(parseInt(curSlideType[fontType]['font-size']) * fontResizeKoef);
	// 	}

	// }
	var middleDesk = $("#main_slide");
	//alert(middleDesk.css('font-size'))
	var fontSize = presentationObject.curFontSize * resizeKoef;
	middleDesk.css('font-size', fontSize);
	$("#tmpPlaceContainer").css('font-size', (fontSize + 3));
	var slidePreviewFontSize = fontSize * $(".slide").width() / slideWidth;
	$(".slide").css('font-size', slidePreviewFontSize * 0.9);
	presentationObject.curWidth = slideWidth;
	presentationObject.curHeight = slideWidth * 9 / 16;
	presentationObject.curFontSize = fontSize;

}

