$(document).ready(function() {

	//------анимация #desk------
	$("#desk").animate({
		"top": "0px"
	});
		//--------анимация треугольника-------
	var last_active_class = 'addContent';
	$('.circles li.circle').click(function() {
		$('#' + last_active_class).removeClass("activeMenuLeft");
		$(this).addClass("activeMenuLeft")
		last_active_class = $(this).attr('id');
	});

	var addContentBlock = $('#addElementWrapIconInAccord');
	var toolsContentBlock = $('#toolsWrapIconInAccord');
	var lastActiveMenuInBlock = 'toolsWrapIconInAccord';

// $('#addContent').click(function(){
// 	if (!$(this).hasClass('openBlock')) {
// 			// addContentBlock.slideDown();
// 			toolsContentBlock.slideUp();
// 			$('#' + lastActiveMenuInBlock).removeClass('openBlock');
// 			$(this).addClass('openBlock');
// 			lastActiveMenuInBlock = $(this).attr('id');
// 	}
// });

$('#tools').click(function(){
	if (!$(this).hasClass('openBlock')) {
			toolsContentBlock.slideDown();
			// addContentBlock.slideUp();
			$('#' + lastActiveMenuInBlock).removeClass('openBlock');
			$(this).addClass('openBlock');
			lastActiveMenuInBlock = $(this).attr('id');
	}
})

$('#information').click(function(){
	if (!$(this).hasClass('openBlock')) {
			toolsContentBlock.slideUp();
			// addContentBlock.slideUp();
			$('#' + lastActiveMenuInBlock).removeClass('openBlock');
			$(this).addClass('openBlock');
			lastActiveMenuInBlock = $(this).attr('id');
	}
})


	//--------------сохранение пропорциональности главного слайда--------------
/*
	var ratio = 1 / 2; // высота равна половине ширины
	var slide_div = $('#main_slide'); // кэшируем результат вызова функции
	var height = slide_div.width() * ratio;
	var slide_height = slide_div.height(height);
	$("#arrow_and_text").css({
		"top": height - 100
	});
*/
	var image_was_clicked = 0;
	var buttons_are_shown = false;

	//--------------вывод и удаление popup`a--------------

	var open_popup_was_clicked = 0;
	var index_small_slide;
	var slide_popup_added = false;



	//**********************************************************

		/*if(!$target.is(".slide_popup") && !$target.parents().is(".slide_popup")) {

			        $(".slide_popup").remove();

			        slide_popup_added = false;

			        if(image_was_clicked == 0) {
			        	$(".small_slides li.slide .open_popup").css({"opacity":"0.5"});
						$(".small_slides li.slide").css({"background":"#F5F5F5", "box-shadow":"0px 0px 0px 0px #696969"});
			        }
			    }*/

		/*if(!$target.is(".popup_add") && !$target.parents().is(".popup_add")) { //Сокрытие окна дублирования слайда
			        $(".popup_add").remove();
			    }*/

		/*if(!$target.is("#add_text_popup") && !$target.is("#add_text") && !$target.parents().is("#add_text_popup")) {
			        $("#add_text_popup").fadeOut();
			    }*/

		// if (!$target.is("#assistent") && !$target.is("#open_assistent") && !$target.parents().is("#assistent")) {
		// 	$("#assistent").fadeOut();
		// }


	

//******************ВРЕМЕННО**********************

	$('#edits').css({"cursor":"pointer"});


	//**********************************************************
	
});