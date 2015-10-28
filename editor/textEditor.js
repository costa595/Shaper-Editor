$("document").ready(function() {

    //initTextEditor('editor1')

});

function initTextEditor(id) {
    // Replace the <textarea id="editor1"> with an CKEditor instance.
    //alert(id)
    try {
        CKEDITOR.disableAutoInline = true;
        var editor = CKEDITOR.inline(document.getElementById(id), {
            removePlugins: 'toolbar',
            forcePasteAsPlainText: true,
        });

        // editor.on('paste', function(evt) {
        //     // Update the text
        //     // evt.editor.setData(evt.editor.getData() + ' your additional comments.');
        //     alert('fdf')
        // }, editor.element.$);

        // console.log('t', t)
    } catch (e) {
        alert(e)
    }
    //     t.setReadOnly(false)
    // //CKEDITOR.editable(document.getElementById( id ))
    //     str = id + ' - \n';
    //     for (var k in t.config)
    //         str += k + ' ' + t.config[k] + '\n'
    //     alert(str)
}

// The instanceReady event is fired, when an instance of CKEditor has finished
// its initialization.
CKEDITOR.on('instanceReady', function(ev) {
    // Show the editor name and description in the browser status bar.
    //document.getElementById('eMessage').innerHTML = 'Instance <code>' + ev.editor.name + '<\/code> loaded.';

    ev.editor.setReadOnly(false);

    // Show this sample buttons.
    //document.getElementById( 'eButtons' ).style.display = 'block';
});

function InsertHTML(textValue, id) {
    // Get the editor instance that we want to interact with.
    var editor = CKEDITOR.instances[id];
    //var value = document.getElementById('htmlArea').value;

    // Check the active editing mode.
    if (editor.mode == 'wysiwyg') {
        // Insert HTML code.
        // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-insertHtml
        editor.setData(textValue);
    } else
        alert('You must be in WYSIWYG mode!');
}

function InsertText() {
    // Get the editor instance that we want to interact with.
    var editor = CKEDITOR.instances.editor1;
    var value = document.getElementById('txtArea').value;

    // Check the active editing mode.
    if (editor.mode == 'wysiwyg') {
        // Insert as plain text.
        // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-insertText
        editor.insertText(value);
    } else
        alert('You must be in WYSIWYG mode!');
}

function SetContents() {
    // Get the editor instance that we want to interact with.
    var editor = CKEDITOR.instances.editor1;
    var value = document.getElementById('htmlArea').value;

    // Set editor contents (replace current contents).
    // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-setData
    editor.setData(value);
}

function GetContents() {
    // Get the editor instance that you want to interact with.
    var editor = CKEDITOR.instances.editor1;

    // Get editor contents
    // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-getData
    alert(editor.getData());
}

function ExecuteCommand(commandName, id) {
    // Get the editor instance that we want to interact with.

    var editor = CKEDITOR.instances[id];

    //   str = '';
    // for (var k in editor)
    //     str+=k+' - '+editor[k]+'\n'
    // alert(str)
    console.log(editor)
    // Check the active editing mode.
    if (editor.mode == 'wysiwyg') {
        // Execute the command.
        // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-execCommand
        editor.execCommand(commandName);
    } else
        alert('You must be in WYSIWYG mode!');
}

function chaingeBkg(color, id) {
    var editor = CKEDITOR.instances[id];

    console.log(editor)
    // Check the active editing mode.
    if (editor.mode == 'wysiwyg') {
        // Execute the command.
        // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-execCommand
        try {
            var style = new CKEDITOR.style( { element: 'span', styles: { 'background-color': 'red' } } );

            editor.applyStyle( style );
        } catch (e) {
        alert(e)
    }
    } else
        alert('You must be in WYSIWYG mode!');
}

function CheckDirty() {
    // Get the editor instance that we want to interact with.
    var editor = CKEDITOR.instances.editor1;
    // Checks whether the current editor contents present changes when compared
    // to the contents loaded into the editor at startup
    // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-checkDirty
    alert(editor.checkDirty());
}

function ResetDirty() {
    // Get the editor instance that we want to interact with.
    var editor = CKEDITOR.instances.editor1;
    // Resets the "dirty state" of the editor (see CheckDirty())
    // http://docs.ckeditor.com/#!/api/CKEDITOR.editor-method-resetDirty
    editor.resetDirty();
    alert('The "IsDirty" status has been reset');
}

function Focus(id) {

    CKEDITOR.instances.editor1.focus();
}

function onFocus() {
    document.getElementById('eMessage').innerHTML = '<b>' + this.name + ' is focused </b>';
}

function onBlur() {
    document.getElementById('eMessage').innerHTML = this.name + ' lost focus';
}