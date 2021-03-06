/*
 * Application types
 */
//cPanel's text editor
var TYPE_CPANEL = 0;
//Everything else
var TYPE_NORMAL = 1;
//chrome.storage.local.clear();
function RemoteAce()
{
    var aceModes = ["abap", "actionscript", "ada", "asciidoc", "assembly_x86", "autohotkey", "batchfile", "c9search", "c_cpp", "clojure", "cobol", "coffee", "coldfusion", "csharp", "css", "curly", "d", "dart", "diff", "django", "dot", "ejs", "erlang", "forth", "ftl", "glsl", "golang", "groovy", "haml", "handlebars", "haskell", "haxe", "html", "html_completions", "html_ruby", "ini", "jack", "jade", "java", "javascript", "json", "jsoniq", "jsp", "jsx", "julia", "latex", "less", "liquid", "lisp", "livescript", "logiql", "lsl", "lua", "luapage", "lucene", "makefile", "markdown", "matlab", "mushcode", "mushcode_high_rules", "mysql", "nix", "objectivec", "ocaml", "pascal", "perl", "pgsql", "php", "plain_text", "powershell", "prolog", "properties", "protobuf", "python", "r", "rdoc", "rhtml", "ruby", "rust", "sass", "scad", "scala", "scheme", "scss", "sh", "sjs", "snippets", "soy_template", "space", "sql", "stylus", "svg", "tcl", "tex", "text", "textile", "toml", "mwig", "typescript", "vbscript", "velocity", "verilog", "vhdl", "xml", "xquery", "yaml"];
    var aceThemes = ["ambiance", "chaos", "chrome", "clouds", "clouds_midnight", "cobalt", "crimson_editor", "dawn", "dreamweaver", "eclipse", "github", "idle_fingers", "kr", "merbivore", "merbivore_soft", "mono_industrial", "monokai", "pastel_on_dark", "solarized_dark", "solarized_light", "terminal", "textmate", "tomorrow", "tomorrow_night", "tomorrow_night_blue", "tomorrow_night_bright", "tomorrow_night_eighties", "twilight", "vibrant_ink", "xcode"];
    var defaultLanguage = "html";
    var defaultTheme = "textmate";
    var defaultWordWrapping = false;
    var aceItcontextMenuID = null;
    var aceModesFirstLetterContextmenuIDs = [];
    var fieldID = "";
    
    createAceItContextMenu();
    createModesContextMenu();
    createThemesContextMenu();
    createPreferencesContextMenu();
    
    function aceIt(tabID, fieldID)
    {
        var language = defaultLanguage;
        var theme = defaultTheme;
        var wordWrapping = defaultWordWrapping;
        
        chrome.storage.local.get(["lastUsedLanguage", "lastUsedTheme", "wordWrapping"], function(items)
        {
            if(items.lastUsedLanguage !== undefined)
            {
                language = items.lastUsedLanguage;
            }
        
            if(items.lastUsedTheme !== undefined)
            {
                theme = items.lastUsedTheme;
            }
        
            if(items.wordWrapping !== undefined)
            {
                wordWrapping = items.wordWrapping;
            }
        
            sendMessage(tabID, {"ace": "it", "language": language, "theme": theme, "wordWrapping": wordWrapping, "elementID": fieldID});
        });
    }
    
    function sendMessage(tabID, properties)
    {
        chrome.tabs.sendMessage(tabID, properties);
    }

    function changeLanguage (tabID, languageName)
    {
        chrome.storage.local.set({lastUsedLanguage: languageName});
        sendMessage(tabID, {"changeMode":languageName});
    };

    function changeTheme (tabID, themeName)
    {
        chrome.storage.local.set({lastUsedTheme: themeName});
        sendMessage(tabID, {changeTheme: themeName});
    }

    function toggleWordWrapping(tabID)
    {
        var currentValue = defaultWordWrapping;
        chrome.storage.local.get("wordWrapping", function(items)
        {
            if(items.wordWrapping !== undefined)
            {
                currentValue = items.wordWrapping;
            }

            var wordWrapping = !currentValue;
            chrome.storage.local.set({wordWrapping: wordWrapping});
            sendMessage(tabID, {toggleWordWrapping: wordWrapping});
        });
    }

    function toggleAutoLoad(url)
    {
        isFieldAutoLoaded(url, function(result, items)
        {
            var obj = {};
            if(items["autoLoadingFields"] !== undefined)
            {
                obj = items["autoLoadingFields"];
            }
            
            obj[url] = fieldID;
            if(result !== false)
            {
                obj[url] = false;    
            }
            chrome.storage.local.set({autoLoadingFields: obj});
        });
    }

    function isFieldAutoLoaded(url, callback)
    {
        chrome.storage.local.get("autoLoadingFields", function(items)
        {
            callback(items["autoLoadingFields"]!== undefined && items["autoLoadingFields"][url] !== undefined && items["autoLoadingFields"][url] !== false, items);
        });
    }

    function createAceItContextMenu()
    {
        aceItcontextMenuID = chrome.contextMenus.create(
        {
            "id": "aceit",
            "title": "Ace it!",
            "contexts": ["editable"],
            "onclick": function(info, tab)
            {
                aceIt(tab.id);
            }
        });
    
        chrome.runtime.onMessage.addListener(function(message, sender)
        {
            if(message.doWhat === "updateState")
            {
                var title = "Ace it!";
                if(message.type === "cpanel")
                {
                    title = "Ace it! (cPanel detected)";
                }
            
                fieldID = message.elementID;
                if(fieldID === "")
                {
                    fieldID = "_aceAnywhereOrigin";
                }
            
                var autoLoadState = false;
                isFieldAutoLoaded(message.url.href, function(result, items)
                {
                    autoLoadState = result;
                    chrome.contextMenus.update("autoload", {checked: autoLoadState});
                });
                
                chrome.contextMenus.update(aceItcontextMenuID, {title: title});
            }
            else if(message.doWhat === "aceIt")
            {
                aceIt(sender.tab.id, message.elementID);
            }
        });
    }
    
    function createModesContextMenu()
    {
        chrome.contextMenus.create(
        {
            "id": "acemodes",
            "title": "Language",
            "contexts": ["editable"]
        });
    
        for(var i=0; i<aceModes.length; i++)
        {
            var language = aceModes[i];
            var firstLetter = language[0];
            var parentContextMenuID = aceModesFirstLetterContextmenuIDs[firstLetter];
            if(parentContextMenuID === undefined)
            {
                parentContextMenuID = chrome.contextMenus.create(
                {
                    "id": "first_letter_"+firstLetter,
                    "title": firstLetter.toUpperCase(),
                    "contexts": ["editable"],
                    "parentId": "acemodes"
                });
                aceModesFirstLetterContextmenuIDs[firstLetter] = parentContextMenuID;
            }
        
            chrome.contextMenus.create(
            {
                "id": language,
                "title": language,
                "contexts": ["editable"],
                "onclick": function(info, tab)
                {
                    changeLanguage(tab.id, info.menuItemId);
                },
                "parentId": parentContextMenuID
            });
        }
    }

    function createThemesContextMenu()
    {
        chrome.contextMenus.create(
        {
            "id": "acethemes",
            "title": "Themes",
            "contexts": ["editable"]
        });
    
        chrome.storage.local.get("lastUsedTheme", function(items)
        {        
            for(var i=0; i<aceThemes.length; i++)
            {
                var themeName = aceThemes[i];
                chrome.contextMenus.create(
                {
                    "id": themeName,
                    "title": themeName,
                    "checked": false,
                    "contexts": ["editable"],
                    "onclick": function(info, tab)
                    {
                        changeTheme(tab.id, info.menuItemId);
                    },
                    "parentId": "acethemes"
                });
            }
        });
    }

    function createPreferencesContextMenu()
    {
        chrome.contextMenus.create(
        {
            "id": "preferences",
            "title": "Preferences",
            "contexts": ["editable"],
        });
    
        chrome.contextMenus.create(
        {
            "id": "wordwrapping",
            "title": "Toggle Word Wrapping",
            "contexts": ["editable"],
            "parentId": "preferences",
            "onclick": function(info, tab)
            {
                toggleWordWrapping(tab.id);
            }
        });
    
        chrome.contextMenus.create(
        {
            "id": "autoload",
            "title": "Auto load Ace on this URL",
            "contexts": ["editable"],
            "parentId": "preferences",
            "type": "checkbox",
            "onclick": function(info, tab)
            {
                toggleAutoLoad(tab.url);
            }
        });
                
    }
}

var aceEditor = new RemoteAce();