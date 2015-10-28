var curDemonstrationType = 1;
$(document).ready(function() {
	$(function() {
		$(window).resize(function() {
			 // positionPopupShare();
			 // positionPopupRename();
		});
	});

	$('#name_pres').click(function(){
		$('#presabout').css('border','1px solid #c8c9c9');
		$('#name_pres').css('border','1px solid #5b5a5a');
		$('#name_pres').select();
	});
	$('#presabout').click(function(){
		$('#name_pres').css('border','1px solid #c8c9c9');
		$('#presabout').css('border','1px solid #5b5a5a');
		$('#presabout').select();
	});

	var closeWindow = true;
	$('body').click(function(){
		if (closeWindow) {
			closeAllPopup();
		}
		else{
			closeWindow = true;
		}
	});
	$('.renamePresentation').click(function(){
		closeWindow = false;
	});
	$('#popup_people_share').click(function(){
		closeWindow = false;
	})
	$('#popup_rename').click(function(){
		closeWindow = false;
	})
	$('.nameOfPresentation').click(function(){
		closeWindow = false;
	})
	$('.sharePresentation').click(function(){
		closeWindow = false;
	})
	$('#popup_share_gate').click(function(){
		closeWindow = false;
	})
	$('#share').click(function(){
		closeWindow = false;
	})
	$('.close_popup_share_gate').click(function(){
		closeAllPopup();
	})

	// $('#send').click(function(){
	// 	if($("#name_pres").val()) {
	// 		$.ajax({
	// 			type: 'POST',
	// 			url: '/php/wizard.php?ref=rename',
	// 			data: {
	// 				id: presq_id,
	// 				name: $("#name_pres").val(),
	// 				about: $("#presabout").val()
	// 			},
	// 			success: function(res) {
	// 				closeAllPopup();
	// 				$('.nameOfPresentation').html($("#name_pres").val());
	// 				$("#name_pres").attr("value", $("#name_pres").val());
	// 				$('#aboutpres').html($("#presabout").val());
	// 				$("#presabout").attr("value", $("#presabout").val());
	// 			}
	// 		});
	// 	} else {
	// 		alert("Поле названия должно быть заполнено!");
	// 	}
	// })

	$('#popup_rename_close').click(function(){
		closeAllPopup();
	})
	$('#popup_people_share_close').click(function(){
		closeAllPopup();
	})
	$('#popup_people_share_close_apply').click(function(){
		closeAllPopup();
	})
	$('.renamePresentation').click(positionPopupShare);
	$('.nameOfPresentation').click(positionPopupRename);
	$('.leftMenuLogout a').click(positionPopupShareGate);

	function positionPopupShare(){
		closeAllPopup();
		var marginLeftForPopupShare = ($('body').width() - 485)/2;
		var marginTopForPopupShare = ($('body').height() - 495)/2;
		$('#popup_people_share').css({'display':'block','margin-left':marginLeftForPopupShare,'margin-top':marginTopForPopupShare});
	}
	function positionPopupRename(){
		closeAllPopup();
		var marginLeftForPopupRename = ($('body').width() - 330)/2;
		var marginTopForPopupRename = ($('body').height() - 240)/2;
		$('.popup_overlay').css('visibility','visible');
		$('#name_pres').css('border','1px solid #5b5a5a');
		$('#popup_rename').css({'display':'block','margin-left':marginLeftForPopupRename,'margin-top':marginTopForPopupRename});
		$('#name_pres').select();
	}
	function positionPopupShareGate(){
		closeAllPopup();
		var marginLeftForShareGate = ($('body').width() - 545)/2;
		var marginTopForShareGate = ($('body').height() - 400)/2;
		$('.popup_overlay').css('visibility','visible');
		$('#popup_share_gate').css({'display':'block','margin-left':marginLeftForShareGate,'margin-top':marginTopForShareGate});
	}

	$('.nameOfPresentation').mouseover(function(){
		$(this).append("<span id='iconRenamePresentation'></span>");
		$(this).addClass('active');
	})
	$('.nameOfPresentation').mouseout(function(){
		$('#iconRenamePresentation').remove();
		$(this).removeClass('active');
	})


/*Start StepOfShareGate*/
lastActiveCombination = 'PcPlusPhone';
$('.typeDevice').click(function(){
	if (!$(this).hasClass('active')) {
		$(this).addClass('active');
		$('#'+lastActiveCombination).removeClass('active');
		lastActiveCombination = $(this).attr('id');
		if ($(this).attr('id') == 'PhonePlusPc') {
			curDemonstrationType = 2;
			$('#changeTextForOtherStep').html('Использовать это устройство как пульт управления и добавить внешнее устройство для демонстрации презентации');
			$('#PhonePlusPc').find('a').css('background','url("../images/newDesign/shareGate/phonePlusPcWhite.png") no-repeat left top');
			$('#PcPlusPhone').find('a').css('background','url("../images/newDesign/shareGate/PcPlusMacBlack.png") no-repeat left top');
			$('.triangleTextAboutChooseVariant').css('left','290px');
			$('#content_of_step_3_1').css('display','none');
			$('#content_of_step_4_1').css('display','none');
			$('#content_of_step_3_2').css('display','block');
			$('#content_of_step_4_2').css('display','block');
		}
		else{
			curDemonstrationType = 1;
			$('#changeTextForOtherStep').html('Демонстрировать презентацию на этом устройстве и подключить смартфон или планшет в качестве пульта управления');
			$('#PhonePlusPc').find('a').css('background','url("../images/newDesign/shareGate/phonePlusPcBlack.png") no-repeat left top');
			$('#PcPlusPhone').find('a').css('background','url("../images/newDesign/shareGate/PcPlusMacWhite.png") no-repeat left top');
			$('.triangleTextAboutChooseVariant').css('left','123px');	
			$('#content_of_step_3_1').css('display','block');
			$('#content_of_step_4_1').css('display','block');
			$('#content_of_step_3_2').css('display','none');
			$('#content_of_step_4_2').css('display','none');
		}
	}
})
/*END DOCUMENT READY*/
});


//changeStep
//545px - width block; before change width =  $('.content_of_step').width(); because js don't considered padding (left and right)
step = 0;
function startStepShareGateFunction(){
	$('#wrapForButtonUnderCirlce').html('<div class="wrap_button_popup_popup">'+
				'<button id="nextStepShareGate" class="popup_button red_popup_button_share_gate" onclick="nextStepShareGateFunction();">Далее</button>'+
				'<button id="prevStepShareGate" class="popup_button share_gate_button" onclick="prevStepShareGateFunction();">Назад</button></div>')
	if (step < 3) {
		step++;
		$('.circleStepsOfShareGate').find('a').eq(step - 1).removeClass('active');
		$('.circleStepsOfShareGate').find('a').eq(step).addClass('active');

		$('#TableOfStep').animate({marginLeft: step * 545 * -1}, 400);
		return false;
		$(window).resize(function(){
		    $('#TableOfStep').css({marginLeft: (step - 1) * 545 * -1});
		});  
	};
}
function nextStepShareGateFunction(){
	if (step < 3) {
	step++;
		if (step == 3) {
			var readyHref = '';
			switch(curDemonstrationType){
				case 1: 
					readyHref = "/play?id="+presq_id; 
					nextStepEnd(readyHref)
				break;
				case 2:
					readyHref = "/remote?code="+code;
					nextStepEnd(readyHref)
				break;
			}
			
		}
		//href="screen2.php?id="
		$('.circleStepsOfShareGate').find('a').eq(step - 1).removeClass('active');
		$('.circleStepsOfShareGate').find('a').eq(step).addClass('active');

		$('#TableOfStep').animate({marginLeft: step * 545 * -1}, 400);
		return false;
		$(window).resize(function(){
		    $('#TableOfStep').css({marginLeft: (step - 1) * 545 * -1});
		});  
	}
}
//presq_id
function nextStepEnd(readyHref) {
	$('#wrapForButtonUnderCirlce').html('<div class="wrap_button_popup_popup">'+
		'<a href="'+readyHref+'"><button id="nextStepShareGate" class="popup_button red_popup_button_share_gate" onclick="nextStepShareGateFunction();">Готово</button></a>'+
		'<button id="prevStepShareGate" class="popup_button share_gate_button" onclick="prevStepShareGateFunction();">Назад</button></div>')
}
function prevStepShareGateFunction(){
	if (step > 0) {
		step--;
		if (step == 0){
			$('#wrapForButtonUnderCirlce').html('<div class="startConnectShareGate" onclick="startStepShareGateFunction();"><a>Начать подключение</a></div>')
		}
		if (step == 2) {
			$('#wrapForButtonUnderCirlce').html('<div class="wrap_button_popup_popup">'+
				'<button id="nextStepShareGate" class="popup_button red_popup_button_share_gate" onclick="nextStepShareGateFunction();">Далее</button>'+
				'<button id="prevStepShareGate" class="popup_button share_gate_button" onclick="prevStepShareGateFunction();">Назад</button></div>')
		}
			$('.circleStepsOfShareGate').find('a').eq(step + 1).removeClass('active');
			$('.circleStepsOfShareGate').find('a').eq(step).addClass('active');

			$('#TableOfStep').animate({marginLeft: step * 545 * -1}, 400);
			return false;
			$(window).resize(function(){
			    $('#TableOfStep').css({marginLeft: (step + 1) * 545 * -1});
			});  
	}
}
function share(presId) {
	$.ajax({
		type : 'POST',
		url:'/prespopup/getcode',
		data: "id=" + presId,
		success: function(returned_object) {
			var contact = JSON.parse(returned_object);
			code = contact.code;
			$('#code_share').html(contact.code);
			$('#code_share1').html(contact.code);
			$('#qr_code_share').html(contact.QR);
		}
	});
}
/*End StepOfShareGate*/

function renamePresentation() {
	// if ($("#name_pres").val()) {
		$.ajax({
			type: 'POST',
			url: '/api/rename',
			data: {
				id: presq_id,
				name: $("#name_pres").val(),
				about: $("#presabout").val()
			},
			success: function(res) {
				closeAllPopup();
				$('.nameOfPresentation').html($("#name_pres").val());
				$("#name_pres").attr("value", $("#name_pres").val());
				$('#aboutpres').html($("#presabout").val());
				$("#presabout").attr("value", $("#presabout").val());
			}
		});
	// } else {
	// 	//Нельзя так. При виде алерта пользак охуевает и идет на slides.com или в power point
	// 	alert("Поле названия должно быть заполнено!");
	// }
	return false;
}

function closeAllPopup(){
		$('.popup_overlay').css('visibility','hidden');
		$('#popup_people_share').css('display','none');
		$('#popup_rename').css('display','none');
		$('#popup_share_gate').css('display','none');
		$('#name_pres').css('border','1px solid #c8c9c9');
		$('#presabout').css('border','1px solid #c8c9c9');
	}
