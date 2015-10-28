var editorApp = angular.module('presEditor', ['dnd', "xeditable", 'uiSlider', 'ngLettering', 'angularFileUpload']);

editorApp.run(function(editableOptions, editableThemes) {


	// editableOptions.theme = 'default'; // bootstrap3 theme. Can be also 'bs2', 'default'
	// editableThemes['default'].submitTpl = '';
	// editableThemes['default'].cancelTpl = '';
	// editableThemes['default'].controlsTpl = '<div class="activeTextEditor"></div>';
	// editableThemes['default'].formTpl = '<form style="width: 100%;" class="editable-wrap"></form>';
});