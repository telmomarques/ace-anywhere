/**
 * Escape HTML entities from a string
 */
String.prototype.escapeHTMLEntities = function()
{
    var map =
    {
        "&": "&amp",
        "<": "&lt;",
        ">": "&gt"
    };

    return this.replace(/[&<>]/g, function(entity)
    {
        return map[entity];
    });
};

function AceEditor()
{
    function createOrUpdateScriptNode(elementID, content)
    {
        var scriptNode = document.getElementById(elementID);
        if(scriptNode !== null)
        {
            scriptNode.parentElement.removeChild(scriptNode);
        }
        scriptNode = document.createElement("script");
        scriptNode.id = elementID;
        scriptNode.innerHTML = content;
        document.head.appendChild(scriptNode);
    }

    this.setLanguage = function(languageName)
    {
        var code =
        '\n\
            var editor = ace.edit("_aceAnywhereEditor");\n\
            editor.getSession().setMode("ace/mode/'+languageName+'");\n\
        ';
        createOrUpdateScriptNode("_aceAnywhereChangeLanguage", code);
    };

    this.setTheme = function(themeName)
    {
        var code =
        '\n\
            var editor = ace.edit("_aceAnywhereEditor");\n\
                editor.setTheme("ace/theme/'+themeName+'");\n\
        ';
        createOrUpdateScriptNode("_aceAnywhereChangeTheme", code);
    };

    this.setWordWrapping = function(value)
    {
        var code =
        '\n\
            var editor = ace.edit("_aceAnywhereEditor");\n\
            editor.getSession().setUseWrapMode('+value+');\n\
        ';
        createOrUpdateScriptNode("_aceAnywhereToggleWordWrapping", code);
    };
}

var aceEditor = new AceEditor();

/*
 * Application types
 */
//cPanel's text editor
var TYPE_CPANEL = 0;
//Everything else
var TYPE_NORMAL = 1;

//Wrapper for the Ace Editor
var editorNode = null;

//Reference to original editable area
var editableArea = null;
//Listen to right mouse clicks
document.addEventListener("mousedown", function(e)
{
    //Right button (context menu)
    if(e.button === 2)
    {
        //Save referente to original editable area
        editableArea = e.target;
        
        //Assess application type
        var type = "normal";
        //Look for cPanel's "cpsess" session token in the URL
        if(window.location.href.indexOf("cpsess") > -1)
        {
            type = "cpanel"; //Quite possibly. I'm fairly sure... maybe.
        }
    
        //Tell the extension to create/update the context menu
        chrome.runtime.sendMessage({type: type});
    }
});

//The context menu was clicked
chrome.extension.onMessage.addListener(function(message)
{
    var code = "";
    if(message.changeMode !== undefined)
    {
        if(editorNode !== null)
        {
            aceEditor.setLanguage(message.changeMode);
        }
    }
    else if(message.changeTheme !== undefined)
    {
        if(editorNode !== null)
        {
            aceEditor.setTheme(message.changeTheme);
        }
    }
    else if(message.toggleWordWrapping !== undefined)
    {
        if(editorNode !== null)
        {
            aceEditor.setWordWrapping(message.toggleWordWrapping)
        }
    }
    else
    {
        //Oups
        if(editableArea === null)
        {
            //Nothing to do here
            return;
        }

        //Assign ID to the original editable area if there's none
        if(editableArea.id === "")
        {
            editableArea.id = "_aceAnywhereOrigin";
        }

        //Create a wrapper for the Ace Editor
        editorNode = document.createElement("div");
        //Insert it just above the original editable area
        editableArea.parentNode.insertBefore(editorNode, editableArea);
        //Give it an ID
        editorNode.setAttribute("id", "_aceAnywhereEditor");
        //Set inital content from the original editable area
        editorNode.innerHTML = editableArea.value.escapeHTMLEntities();
        //Same height
        editorNode.style.height = editableArea.offsetHeight+"px";
        //Same width
        editorNode.style.width = editableArea.offsetWidth+"px";
        //Hide the original editable area
        editableArea.style.display = "none";

        //Import Ace from a CDN
        var aceJS = document.createElement("script");
        aceJS.src = "//cdnjs.cloudflare.com/ajax/libs/ace/1.1.2/ace.js";
        aceJS.setAttribute("charset", "utf-8");
        //When the script it finally loaded
        aceJS.onload = function()
        {
            /*
             * 1. Initialize Ace editor
             * 
             * 2. If TYPE_NORMAL keep changes on the original editable area,
             * so that changes can be saved by the application
             * 
             * 3. If TYPE_CPANEL, copy contents to the "CODEWINDOW.value" variable
             * only when the save button is pressed.
             */
            var loadAce = document.createElement("script");
            loadAce.innerHTML =
            '\
                var editableArea = document.getElementById("'+editableArea.id+'")\n\
                var editor = ace.edit("_aceAnywhereEditor");\n\
                editor.getSession().setUseWorker(false);\n\
                editor.getSession().on("change", function(e)\n\
                {\n\
                    if(typeof CODEWINDOW === "undefined")\n\
                    {\n\
                        editableArea.innerHTML = editor.getSession().getValue();\n\
                    }\n\
                });\n\
                var sform_submit = document.getElementById("sform_submit");\n\
                if(sform_submit !== null)\n\
                {\n\
                    sform_submit.onclick = function()\n\
                    {\n\
                        CODEWINDOW.value = editor.getSession().getValue();\n\
                    }\n\
                }\n\
            ';
            
            document.head.appendChild(loadAce);
            aceEditor.setLanguage(message.language);
            aceEditor.setTheme(message.theme);
            aceEditor.setWordWrapping(message.wordWrapping);
        };

        document.head.appendChild(aceJS);
    }
});