var pw = 400;
var childforMagicId = 0;
var secondTime = 1;
$(window).load(function() {
  $("#test_function").click(function() {
    alert('Не стоит')
    maxWidthInfograf(pw, secondTime, 0, childforMagicId);
  });
});
var accuracy = 0.0001;
var nowIterations = 0;
var minFontSizeForMainProritet = 1000000;
//Функция находит минимальный шрифт для максимального приоритета
jQuery.fn.hatchShow = function(countMainPrioritet, pw) {
 //alert('hatchShow')

  var hatchCounter = 0;
  $('#'+childforMagicId+' .hsjs').css('display', 'inner-block').css('white-space', 'pre').each(function() {
    hatchCounter++;

    t = $(this);


    if (t.parent("span")[0].className.charAt(t.parent("span")[0].className.length - 1) == countMainPrioritet) {

      if (t.width() > pw) {
        var curentFontSize = $(this).fontSize();
        while (($(this).width() > pw) && ($(this).fontSize() >= (curentFontSize - curentFontSize * 0.3))) {
          // console.log(curentFontSize);
          // console.log($(this).width());
          // console.log($(this).fontSize());
          $(this).css('font-size', ($(this).fontSize() - 2) + "px");
        };
      
      } 
      else {

        while (t.width() < pw) {
          t.css('font-size', (t.fontSize() + 2) + "px")
        };
        t.css('font-size', (t.fontSize() - 2) + "px");
        //alert(t.fontSize());
        сountLS = 0;
        if (t.fontSize() < minFontSizeForMainProritet) {
          minFontSizeForMainProritet = t.fontSize();

        };
        countSpacing(t, pw, 0.5);
      }
    };

  }).css('visibility', 'visible');
  // console.log(t.fontSize());
  // console.log(minFontSizeForMainProritet);
  // alert(minFontSizeForMainProritet)
  fontSizeForOther(minFontSizeForMainProritet, countMainPrioritet, pw);
};

jQuery.fn.fontSize = function() {
  return parseInt($(this).css('font-size').replace('em', ''));
};

//Межбуквенный интервал (letter-spacing)
function countSpacing(t, pw, step) {
  // alert('countSpacing')
  // console.log('step=', step);
  while (step > accuracy) {
    while (t.width() <= pw) {
      nowIterations++;
      сountLS += step;
      t.css('letter-spacing', сountLS + 'em');
    }
    if ((сountLS - step) > 0) {
      сountLS -= step;
    } else {
      сountLS = 0;
    }
    t.css('letter-spacing', сountLS + 'em');
    step /= 2;
    // console.log('step2=', step, accuracy);
  }
  //console.log('nowIterations', nowIterations)
}

var conuntNumberTest = 0;
var countMainPrioritet = 10;
var MaxWidthInfografElement = 0;
var prioritetMaxWidthInfografElement = 10;
var middleWidthOfAllElement = 0;
var countOfAllElement = 0;
var widthAfterChange = 0;
var widthTextEditor = 0;
//Нахождение наивысшего приоритета
function maxWidthInfograf(pw, secondTime, prioritetForSearch, childId) {
   // alert('maxWidthInfograf')
   childforMagicId = childId;
 
  // console.log('start')
  widthTextEditor = $('#'+childforMagicId+'').width();
  $('#'+childforMagicId+' .hsjs').each(function() {
    $('#'+childforMagicId+'').width(2000);
    conuntNumberTest++;
    newMaxWidthInfografElement = $(this);
    //Нахождение в блоке наивысшего приоритета для определения его как абсолютный
    mainPrioritet = newMaxWidthInfografElement.parent("span")[0].className;
    if (countMainPrioritet > mainPrioritet.charAt(mainPrioritet.length - 1)) {
      countMainPrioritet = mainPrioritet.charAt(mainPrioritet.length - 1);
    };
    middleWidthOfAllElement += newMaxWidthInfografElement.width();
    countOfAllElement += 1;

    if (newMaxWidthInfografElement.width() > MaxWidthInfografElement) {
      MaxWidthInfografElement = newMaxWidthInfografElement.width();
      prioritetMaxWidthInfografElement = mainPrioritet.charAt(mainPrioritet.length - 1);
      objMaxWidthInfografElement = $(this);
    };

    if ((secondTime == 2) && (mainPrioritet.charAt(mainPrioritet.length - 1) == prioritetForSearch) && (newMaxWidthInfografElement.width() > widthAfterChange)) {
      widthAfterChange = newMaxWidthInfografElement.width();
    }
  });

  $('#'+childforMagicId+'').width(widthTextEditor);
  middleWidthOfAllElement = middleWidthOfAllElement / countOfAllElement;

  if (secondTime == 1) {
    transferMainWord(countMainPrioritet, prioritetMaxWidthInfografElement, objMaxWidthInfografElement, middleWidthOfAllElement, pw);
  } 
  else {
    searchTransferOtherWord(countMainPrioritet, prioritetMaxWidthInfografElement, objMaxWidthInfografElement, middleWidthOfAllElement, pw, widthAfterChange);
  }
}

//Задание всем размера шрифтов основываясь на максимально возможном значении
function fontSizeForOther(fontSizeMax, countMainPrioritet, pw) {

  // alert('fontSizeForOther')

  $('#'+childforMagicId+' .hsjs').each(function() {
    classNameOfObj = $(this).parent("span")[0].className;
    countClassNameOfObj = classNameOfObj.charAt(classNameOfObj.length - 1);
    // alert(countClassNameOfObj)

    if (countClassNameOfObj != countMainPrioritet) {
      if ((countClassNameOfObj - countMainPrioritet) == 1) {
        $(this).css('font-size', fontSizeMax * 0.85);
      };
      if ((countClassNameOfObj - countMainPrioritet) == 2) {
        $(this).css('font-size', fontSizeMax * 0.7);

      };
      if ((countClassNameOfObj - countMainPrioritet) == 3) {
        $(this).css('font-size', fontSizeMax * 0.5);
      };
      if ((countClassNameOfObj - countMainPrioritet) == 4) {
        $(this).css('font-size', fontSizeMax * 0.5);
      };
      if (countClassNameOfObj == 5) {
        $(this).css({
          'font-size': fontSizeMax * 1.25,
          'font-weight': 'bold',
          // 'line-height': '0.55em'
        });

      };
      // alert('поменяли')

      if ($(this).width() > pw) {
        console.log('Слово не влезает нужно уменьшать px');
        var curentFontSize = $(this).fontSize();
        console.log('curentFontSize=',curentFontSize);
        console.log('width=', $(this).width());
        console.log(pw)
        while (($(this).width() > pw) && ($(this).fontSize() >= (curentFontSize - curentFontSize * 0.3))) {
          console.log(curentFontSize);
          console.log($(this).width());
          console.log($(this).fontSize());
          $(this).css('font-size', ($(this).fontSize() - 2) + "px");
        };
      };
    } 

    else {
      $(this).css('font-size', fontSizeMax);
    };

    //летерспейсинг в зависимости от ширины
    if ($(this).width() < pw / 2) {
      console.log('больше',$(this))
      console.log('$(this).width()*1.3= ', $(this).width() * 1.3);
      countSpacing($(this), $(this).width() * 1.6, 0.5);
    } 
    else {
      countSpacing($(this), pw, 0.5);
    }
  });
  lineHidht();
}


function transferMainWord(countMainPrioritet, prioritetMaxWidthInfografElement, objMaxWidthInfografElement, middleWidthOfAllElement, pw) {
   //alert('transferMainWord')
 
  if (countMainPrioritet == prioritetMaxWidthInfografElement) {

    var countWordMainPrioritet = objMaxWidthInfografElement.children('.infograf_word').length;
    var miniWidth = objMaxWidthInfografElement.width();
    var leftSummWidth = 0;
    var rightSummWidth = objMaxWidthInfografElement.width();
    var curentNumberWord;

    if (countWordMainPrioritet != 1) {
      for (var i = 0; i < countWordMainPrioritet; i++) {
        leftSummWidth += objMaxWidthInfografElement.children('.infograf_word').eq(i).width();
        rightSummWidth -= objMaxWidthInfografElement.children('.infograf_word').eq(i).width();
        if (Math.abs(leftSummWidth - rightSummWidth) < miniWidth) {
          miniWidth = Math.abs(leftSummWidth - rightSummWidth);
          curentNumberWord = i;
        };
      };

      var firstListNewString = '';
      for (var i = 0; i <= curentNumberWord; i++) {
        var newWordInList = objMaxWidthInfografElement.children('.infograf_word').eq(i).html();
        console.log(curentNumberWord);
        console.log(i);
        if ((curentNumberWord - i) == 0) {
          newWordInList = '<span class="infograf_word">' + newWordInList + '</span>'
        } else {
          //console.log('пробел', newWordInList);
          newWordInList = '<span class="infograf_word">' + newWordInList + ' ' + '</span>'
        }
        firstListNewString += newWordInList;
      };

      var secondListNewString = '';
      for (var i = curentNumberWord + 1; i < countWordMainPrioritet; i++) {
        var newWordInList = objMaxWidthInfografElement.children('.infograf_word').eq(i).html();
        if ((countWordMainPrioritet - i) == 1) {
          newWordInList = '<span class="infograf_word">' + newWordInList + '</span>'
        } else {
          newWordInList = '<span class="infograf_word">' + newWordInList + ' ' + '</span>'
        }
        secondListNewString += newWordInList;
      };


      // console.log('curentNumberWord=', curentNumberWord);
      // console.log("firstListNewString", firstListNewString);
      // console.log("secondListNewString", secondListNewString);



      objMaxWidthInfografElement.html(firstListNewString);
      var newObjSpan = document.createElement('span');
      newObjSpan.innerHTML = '<span class="hsjs">' + secondListNewString + '</span>';
      newObjSpan.className = objMaxWidthInfografElement.parent("span")[0].className;
      $(newObjSpan).css('display', 'block');
      $(objMaxWidthInfografElement.parent("span")[0]).after($(newObjSpan));


    }
  }

  var secondTime = 2;
  maxWidthInfograf(pw, secondTime, countMainPrioritet, childforMagicId);

}

function transferOtherWord(widthAfterChange,searchTransferTheLongestWord,multiplier) {
     //alert('transferOtherWord')


  console.log(prioritetMaxWidthInfografElement)
  console.log('width=', $(searchTransferTheLongestWord).width());
  console.log('косяквввв=',$(searchTransferTheLongestWord).children())

  var countWordMainPrioritet = searchTransferTheLongestWord.children('.infograf_word').length;
  //alert(countWordMainPrioritet)
  var miniWidth = searchTransferTheLongestWord.width();
  var leftSummWidth = 0;
  var rightSummWidth = searchTransferTheLongestWord.width();
  var curentNumberWord;

  if (countWordMainPrioritet != 1) {

  console.log('вся строка=',searchTransferTheLongestWord.children('.infograf_word'))

  for (var i = 0; i < countWordMainPrioritet; i++) {
        leftSummWidth += searchTransferTheLongestWord.children('.infograf_word').eq(i).width();
        rightSummWidth -= searchTransferTheLongestWord.children('.infograf_word').eq(i).width();
        if (Math.abs(leftSummWidth - rightSummWidth) < miniWidth) {
          miniWidth = Math.abs(leftSummWidth - rightSummWidth);
          curentNumberWord = i;
        };
      };

      var firstListNewString = '';
      for (var i = 0; i <= curentNumberWord; i++) {
        var newWordInList = searchTransferTheLongestWord.children('.infograf_word').eq(i).html();
        console.log(curentNumberWord);
        console.log(i);
        if ((curentNumberWord - i) == 0) {
          newWordInList = '<span class="infograf_word">' + newWordInList + '</span>'
        } else {
          //console.log('пробел', newWordInList);
          newWordInList = '<span class="infograf_word">' + newWordInList + ' ' + '</span>'
        }
        firstListNewString += newWordInList;
      };

      var secondListNewString = '';
      for (var i = curentNumberWord + 1; i < countWordMainPrioritet; i++) {
        var newWordInList = searchTransferTheLongestWord.children('.infograf_word').eq(i).html();
        if ((countWordMainPrioritet - i) == 1) {
          newWordInList = '<span class="infograf_word">' + newWordInList + '</span>'
        } else {
          newWordInList = '<span class="infograf_word">' + newWordInList + '</span>' + ' ';
        }
        secondListNewString += newWordInList;
      };


      // console.log('curentNumberWord=', curentNumberWord);
       console.log("firstListNewString", firstListNewString);
       console.log("secondListNewString", secondListNewString);


      searchTransferTheLongestWord.html(firstListNewString);
      var newObjSpan = document.createElement('span');
      newObjSpan.innerHTML = '<span class="hsjs">' + secondListNewString + '</span>';
      newObjSpan.className = searchTransferTheLongestWord.parent("span")[0].className;
      
      $(newObjSpan).css('display', 'block');

      $(searchTransferTheLongestWord.parent("span")[0]).after($(newObjSpan));


      var countWordFirstBlock = searchTransferTheLongestWord.children('.infograf_word').length;
      var countWordSecondBlock = newObjSpan.getElementsByTagName('span').length-1;
      
      
      console.log('ОТладка')
      console.log(countWordFirstBlock)
      console.log(countWordSecondBlock);
      console.log($(searchTransferTheLongestWord).width()*multiplier)
      console.log(widthAfterChange);
      

      //alert(searchTransferTheLongestWord.width()*multiplier);
      // 
      // alert(widthAfterChange);
    }

      console.log('косяк=',$(searchTransferTheLongestWord).children())
      //alert($(searchTransferTheLongestWord).children())

      if ((countWordFirstBlock >= 2)&&($(searchTransferTheLongestWord).width()*multiplier > widthAfterChange)) {
          transferOtherWord(widthAfterChange,$(searchTransferTheLongestWord),multiplier);
          console.log('111')
      };
      if((countWordSecondBlock >= 2)&&($(newObjSpan).width()*multiplier > widthAfterChange)){
        transferOtherWord(widthAfterChange,$(newObjSpan).children(),multiplier)
        console.log('222')
      };

}

function searchTransferOtherWord(countMainPrioritet, prioritetMaxWidthInfografElement, objMaxWidthInfografElement, middleWidthOfAllElement, pw, widthAfterChange) {
  // alert('searchTransferOtherWord')

  console.log('хуууу', widthAfterChange)
  console.log('middleWidthOfAllElement=', middleWidthOfAllElement);
  widthTextEditor = $('#'+childforMagicId+'').width();
  $('#'+childforMagicId+' .hsjs').each(function() {
    $('#'+childforMagicId+'').width(2000);
      searchTransferTheLongestWord = $(this);
      prioritetSearchTransferTheLongestWord = $(this).parent("span")[0].className;

      if (searchTransferTheLongestWord.width() > widthAfterChange) {
        console.log('aaa')
        console.log(prioritetSearchTransferTheLongestWord.charAt(mainPrioritet.length - 1));
        console.log(countMainPrioritet);
        console.log(searchTransferTheLongestWord.width()*0.7);
        console.log(searchTransferTheLongestWord.width());

        if (((prioritetSearchTransferTheLongestWord.charAt(mainPrioritet.length - 1)  - countMainPrioritet) == 1) && (searchTransferTheLongestWord.width()*0.9 > widthAfterChange)) {
            console.log('ПЕРЕНОС!!!');
            transferOtherWord(widthAfterChange,searchTransferTheLongestWord,0.65);

        };
        if (((prioritetSearchTransferTheLongestWord.charAt(mainPrioritet.length - 1)  - countMainPrioritet) == 2) && (searchTransferTheLongestWord.width()*0.8 > widthAfterChange)) {
            console.log('ПЕРЕНОС!!!');
            transferOtherWord(widthAfterChange,searchTransferTheLongestWord,0.65);

        };
        if (((prioritetSearchTransferTheLongestWord.charAt(mainPrioritet.length - 1)  - countMainPrioritet) == 3) && (searchTransferTheLongestWord.width()*0.7 > widthAfterChange)) {
            console.log('ПЕРЕНОС!!!');
            console.log('widthAfterChange=',widthAfterChange);
            console.log('searchTransferTheLongestWord=',searchTransferTheLongestWord)
            transferOtherWord(widthAfterChange,searchTransferTheLongestWord,0.65);

        };
        if (((prioritetSearchTransferTheLongestWord.charAt(mainPrioritet.length - 1)  - countMainPrioritet) == 4) && (searchTransferTheLongestWord.width()*0.6 > widthAfterChange)) {
            console.log('ПЕРЕНОС!!!');
            console.log('widthAfterChange=',widthAfterChange);
            console.log('searchTransferTheLongestWord=',searchTransferTheLongestWord)
            transferOtherWord(widthAfterChange,searchTransferTheLongestWord,0.65);

        };
        console.log('searchTransferTheLongestWord=', searchTransferTheLongestWord.width());
      };
  });

    $('#'+childforMagicId+'').width(widthTextEditor);
    $().hatchShow(countMainPrioritet, pw);

  }

function lineHidht(){
   $('#'+childforMagicId+' .hsjs').each(function() {
        if ($(this).parent().hasClass('importancy5')) {
          $(this).css({'line-height': '0.60em','display':'block'});
          $(this).parent().css('height', ($(this).height() - $(this).height()*0.25)); 
        }
        if ($(this).parent().hasClass('importancy1')) {
          $(this).parent().css('height', ($(this).height()*1.15));
        }
        else{
          $(this).parent().css('height', ($(this).height())); 
        }
   });
}





