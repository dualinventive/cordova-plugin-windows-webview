var argscheck = require('cordova/argscheck'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    cordova = require('cordova');

var webview;

function navigate(success, fail, args) {
    /// <signature>
    /// <summary>Navigates the webview to the specified url, with the specified http method and optionally specified headers</summary>
    ///	<param name='success' type='navigateSuccess'>
    ///     Ignore, does nothing
    /// </param>
    /// <param name='fail' type='navigateFail'>
    ///     Ignore, does nothing
    /// </param>
    /// <param name='args' type='Array'>
    ///     An array with the arguments. The first index in the array must contain the url. The second index in the array must contain the Http method.
    ///     The third index is optional and should contain an array with header objects ie. {name: Name of the header (ex. Cache-Control), value: Value to append to the header (ex. no-cache)}
    /// </param>
    /// </signature>

    var uri = new Windows.Foundation.Uri(args[0]),
        httpMethod = Windows.Web.Http.HttpMethod[args[1].toLowerCase()];

    var httpRequestMessage = new Windows.Web.Http.HttpRequestMessage(httpMethod, uri);

    // Check to see if headers are provided
    if (args[2] !== undefined && args[2] instanceof Array) {
        var headers = args[2];
        // Add the headers to the request message
        headers.forEach(function (header) {
            httpRequestMessage.headers.append(header.name, header.value);
        })
    }

    // Navigate the webview using the request message
    webview.navigateWithHttpRequestMessage(httpRequestMessage);
}

channel.onDeviceReady.subscribe(function () {
    // Create and add the webview
    webview = document.createElement('x-ms-webview');
    webview.style.cssText = 'position: absolute; top:0; left:0; width:100%; height:100%;';

    document.body.appendChild(webview);

    // Get a reference to the original callbackFromNative
    cordova.originalCallbackFromNative = cordova.callbackFromNative;

    // Override callbackFromNative to make sure 'status' and 'keepCallback' are included in the args
    cordova.callbackFromNative = function (callbackId, isSuccess, status, args, keepCallback) {
        args.push(status, keepCallback);

        cordova.originalCallbackFromNative(callbackId, isSuccess, status, args, keepCallback);
    };

    // Add listeners for the native events
    document.addEventListener("resume", function () {
        // Fire the native event in the webview
        invokeScript('fireCordovaEvent', {eventName: 'resuming'});
    });

    document.addEventListener("pause", function () {
        // Fire the native event in the webview
        invokeScript('fireCordovaEvent', {eventName: 'checkpoint'});
    });

    document.addEventListener("activated", function (e) {
        // Fire the native event in the webview
        invokeScript('fireCordovaEvent', {eventName: 'activated', args: {detail: {type: e.type, arguments: e.args}}});
    });

    document.addEventListener("backbutton", function (evt) {
        // Fire the native event in the webview
        invokeScript('fireCordovaEvent', {eventName: 'backrequested', args: {detail: evt}});
    });

    // Add listener for webview sending messages
    webview.addEventListener("MSWebViewScriptNotify", function (e) {
        try {
            // Parse the message
            var data = JSON.parse(e.value);

            function callback(success, args) {
                args = Array.prototype.slice.call(args);
                var keepCallback = args.splice(args.length - 1, 1)[0];
                var status = args.splice(args.length - 1, 1)[0];
                invokeScript('callbackFromNative', [data.callbackId, success, status, args, keepCallback]);
            }

            // Execute the cordova function specified in the message
            cordova.exec(function () {
                callback(true, arguments);
            }, function () {
                callback(false, arguments);
            }, data.service, data.action, data.args);
        } catch (err) {
            utils.alert("[ERROR] Error parsing value: " + e);
        }
    });

    // Read the config.xml file to find the 'windows-webview' settings
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function () {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xhr.responseText, "application/xml");
        var windowsWebviewNode = doc.getElementsByTagName("windows-webview").item(0);

        if (windowsWebviewNode) {
            var urlNode = windowsWebviewNode.getElementsByTagName("url").item(0);
            var httpMethodNode = windowsWebviewNode.getElementsByTagName("http-method").item(0);
            if (urlNode && httpMethodNode) {
                var url = urlNode.textContent,
                    httpMethod = httpMethodNode.textContent,
                    headers = parseHeaders(windowsWebviewNode);

                // Navigate to the configured url with the configured http method and headers
                navigate(function () {
                }, function () {
                }, [url, httpMethod, headers]);
            } else {
                utils.alert("[ERROR] The 'url' and/or 'http-method' node could not be found");
            }
        } else {
            utils.alert("[INFO] The 'windows-webview' node could not be found");
        }
    });
    xhr.open("get", "../config.xml", true);
    xhr.send();

    function parseHeaders(windowsWebviewNode) {
        /// <signature>
        /// <summary>Parses the headers of the provided windows</summary>
        ///	<param name='windowsWebviewNode' type='Node'>
        ///     The windowswebview node to parse the headers from
        /// </param>
        /// <returns type='Array'>
        ///     The parsed headers
        /// </returns>
        /// </signature>

        var headers = [];

        var headersNode = windowsWebviewNode.getElementsByTagName("headers").item(0);
        if (headersNode) {
            var headerNodes = headersNode.getElementsByTagName("header");

            for (var i = 0; i < headerNodes.length; i++) {
                var header = {
                    name: headerNodes.item(i).getAttribute('name'),
                    value: headerNodes.item(i).getAttribute('value')
                };
                headers.push(header);
            }
        }

        return headers;
    }

    function invokeScript(script, args) {
        /// <signature>
        /// <summary>Invokes the specified script (function) on the webview with the specified arguments</summary>
        ///	<param name='success' type='string'>
        ///     The script to execute. Note: Must be in the global scope.
        /// </param>
        /// <param name='fail' type='*'>
        ///     The arguments to pass to the function. Must be JSON stringifiable. Note: Should be JSON parsed on the other end.
        /// </param>
        /// </signature>

        // Only a single string can be passed as an argument
        var invoke = webview.invokeScriptAsync(script, JSON.prune(args));
        invoke.onerror = function (e) {
            utils.alert("[ERROR] Error invoking webview function: " + script);
        };

        invoke.start();
    }
});

module.exports = {
    navigate: navigate
};

require("cordova/exec/proxy").add("WindowsWebview", module.exports);

// JSON.prune : a function to stringify any object without overflow
// two additional optional parameters :
//   - the maximal depth (default : 6)
//   - the maximal length of arrays (default : 50)
// You can also pass an "options" object.
// examples :
//   var json = JSON.prune(window)
//   var arr = Array.apply(0,Array(1000)); var json = JSON.prune(arr, 4, 20)
//   var json = JSON.prune(window.location, {inheritedProperties:true})
// Web site : http://dystroy.org/JSON.prune/
// JSON.prune on github : https://github.com/Canop/JSON.prune
// This was discussed here : http://stackoverflow.com/q/13861254/263525
// The code is based on Douglas Crockford's code : https://github.com/douglascrockford/JSON-js/blob/master/json2.js
// No effort was done to support old browsers. JSON.prune will fail on IE8.
(function () {
    'use strict';

    var DEFAULT_MAX_DEPTH = 6;
    var DEFAULT_ARRAY_MAX_LENGTH = 50;
    var DEFAULT_PRUNED_VALUE = '"-pruned-"';
    var seen; // Same variable used for all stringifications
    var iterator; // either forEachEnumerableOwnProperty, forEachEnumerableProperty or forEachProperty

    // iterates on enumerable own properties (default behavior)
    var forEachEnumerableOwnProperty = function (obj, callback) {
        for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) callback(k);
        }
    };
    // iterates on enumerable properties
    var forEachEnumerableProperty = function (obj, callback) {
        for (var k in obj) callback(k);
    };
    // iterates on properties, even non enumerable and inherited ones
    // This is dangerous
    var forEachProperty = function (obj, callback, excluded) {
        if (obj == null) return;
        excluded = excluded || {};
        Object.getOwnPropertyNames(obj).forEach(function (k) {
            if (!excluded[k]) {
                callback(k);
                excluded[k] = true;
            }
        });
        forEachProperty(Object.getPrototypeOf(obj), callback, excluded);
    };

    Object.defineProperty(Date.prototype, "toPrunedJSON", {value: Date.prototype.toJSON});

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        meta = {	// table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    var prune = function (value, depthDecr, arrayMaxLength) {
        var prunedString = DEFAULT_PRUNED_VALUE;
        var replacer;
        if (typeof depthDecr == "object") {
            var options = depthDecr;
            depthDecr = options.depthDecr;
            arrayMaxLength = options.arrayMaxLength;
            iterator = options.iterator || forEachEnumerableOwnProperty;
            if (options.allProperties) iterator = forEachProperty;
            else if (options.inheritedProperties) iterator = forEachEnumerableProperty;
            if ("prunedString" in options) {
                prunedString = options.prunedString;
            }
            if (options.replacer) {
                replacer = options.replacer;
            }
        } else {
            iterator = forEachEnumerableOwnProperty;
        }
        seen = [];
        depthDecr = depthDecr || DEFAULT_MAX_DEPTH;
        arrayMaxLength = arrayMaxLength || DEFAULT_ARRAY_MAX_LENGTH;
        function str(key, holder, depthDecr) {
            var i, k, v, length, partial, value = holder[key];
            if (value && typeof value === 'object' && typeof value.toPrunedJSON === 'function') {
                value = value.toPrunedJSON(key);
            }

            switch (typeof value) {
                case 'string':
                    return quote(value);
                case 'number':
                    return isFinite(value) ? String(value) : 'null';
                case 'boolean':
                case 'null':
                    return String(value);
                case 'object':
                    if (!value) {
                        return 'null';
                    }
                    if (depthDecr <= 0 || seen.indexOf(value) !== -1) {
                        if (replacer) {
                            var replacement = replacer(value, prunedString, true);
                            return replacement === undefined ? undefined : '' + replacement;
                        }
                        return prunedString;
                    }
                    seen.push(value);
                    partial = [];
                    if (Object.prototype.toString.apply(value) === '[object Array]') {
                        length = Math.min(value.length, arrayMaxLength);
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value, depthDecr - 1) || 'null';
                        }
                        v = '[' + partial.join(',') + ']';
                        if (replacer && value.length > arrayMaxLength) return replacer(value, v, false);
                        return v;
                    }
                    iterator(value, function (k) {
                        try {
                            v = str(k, value, depthDecr - 1);
                            if (v) partial.push(quote(k) + ':' + v);
                        } catch (e) {
                            // this try/catch due to forbidden accessors on some objects
                        }
                    });
                    return '{' + partial.join(',') + '}';
                case 'function':
                case 'undefined':
                    return replacer ? replacer(value, undefined, false) : undefined;
            }
        }

        return str('', {'': value}, depthDecr);
    };

    prune.log = function () {
        console.log.apply(console, Array.prototype.map.call(arguments, function (v) {
            return JSON.parse(JSON.prune(v));
        }));
    };
    prune.forEachProperty = forEachProperty; // you might want to also assign it to Object.forEachProperty

    if (typeof module !== "undefined") module.exports = prune;
    else JSON.prune = prune;
}());