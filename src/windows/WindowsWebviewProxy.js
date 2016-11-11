var argscheck = require('cordova/argscheck'),
    channel = require('cordova/channel'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    cordova = require('cordova');

var webview, backButtonListenerAdded = false;

function navigate(success, fail, args) {
    /// <signature>
    /// <summary>Navigates the webview to the specified url, with the specified http method and optionally specified headers</summary>
    ///	<param name='success' type='Function'>
    ///     Ignore, does nothing
    /// </param>
    /// <param name='fail' type='Function'>
    ///     Ignore, does nothing
    /// </param>
    /// <param name='args' type='Array'>
    ///     An array with the arguments. The first index in the array must contain the url. The second index in the array must contain the Http method.
    ///     The third index is optional and should contain an array with header objects ie. {name: Name of the header (ex. Cache-Control), value: Value to append to the header (ex. no-cache)}
    /// </param>
    /// </signature>

    // Arguments
    var url = args[0],
        httpMethodName = args[1],
        headers = args[2],
        needsToBeRefreshed = args[3],
        fingerprint = args[4],
        maxConnectionAttempts = args[5];

    var uri = new Windows.Foundation.Uri(url),
        httpMethod = Windows.Web.Http.HttpMethod[httpMethodName.toLowerCase()];

    var httpRequestMessage = new Windows.Web.Http.HttpRequestMessage(httpMethod, uri);

    // Check to see if headers are provided
    if (headers !== undefined && headers instanceof Array) {
        // Add the headers to the request message
        headers.forEach(function (header) {
            httpRequestMessage.headers.append(header.name, header.value);
        })
    }

    // Check if it needs to be refreshed
    if (needsToBeRefreshed) {
        webview.addEventListener('MSWebViewContentLoading', refresh);
    }

    // Check if a fingerprint has been provided
    if (fingerprint) {
        checkSSLCertificate(url, fingerprint, maxConnectionAttempts, function () {
            // Fire callbacks on the webview navigation events
            onNavigation(success, fail, [true]);

            // Navigate the webview using the request message
            webview.navigateWithHttpRequestMessage(httpRequestMessage);
        }, fail);
    } else {
        // Fire callbacks on the webview navigation events
        onNavigation(success, fail, [true]);

        // Navigate the webview using the request message
        webview.navigateWithHttpRequestMessage(httpRequestMessage);
    }
}

function goBack() {
    /// <signature>
    /// <summary>Traverses backward once in the navigation stack of the webview if possible</summary>
    /// </signature>
    if (webview.canGoBack) {
        webview.goBack();
    }
}

function refresh() {
    /// <signature>
    /// <summary>Refreshes the webview in order to clear its cache</summary>
    /// </signature>
    webview.removeEventListener('MSWebViewContentLoading', refresh);

    webview.refresh();
}

function interceptBackButton(success, fail, args) {
    /// <signature>
    /// <summary>Adds or remove a 'backbutton' event listener based on the specified argument</summary>
    ///	<param name='success' type='Function'>
    ///     Ignore, does nothing
    /// </param>
    /// <param name='fail' type='Function'>
    ///     Ignore, does nothing
    /// </param>
    /// <param name='args' type='Array'>
    ///     An array with the arguments. The first index in the array is a boolean indicating whether or not to intercept the back button click.
    ///     Defaults to false.
    /// </param>
    /// </signature>
    var intercept = args[0] || false;

    if (intercept && backButtonListenerAdded === false) {
        document.addEventListener("backbutton", fireBackRequestedEvent);
        backButtonListenerAdded = true;
    } else if (intercept === false && backButtonListenerAdded) {
        document.removeEventListener("backbutton", fireBackRequestedEvent);
        backButtonListenerAdded = false;
    }
}

function onNavigation(success, fail, args) {
    /// <signature>
    /// <summary>Executes the success callback when the webview has successfuly navigated. The fail callback is
    ///     executed when the webview fails for whatever reason.
    /// </summary>
    /// <param name='success' type='Function'>
    ///     The success callback
    /// </param>
    /// <param name='fail' type='Function'>
    ///     The fail callback
    /// </param>
    /// <param name='args' type='Array'>
    ///     An array with the arguments. The first index in the array indicates the success or fail callback should only be executed once.
    /// </param>
    /// </signature>

    // Check if the webview exists
    if (webview) {
        addListeners();
    } else {
        // Add listeners when it is ready
        document.addEventListener('webviewready', addListeners);
    }

    function addListeners() {
        var once = args[0];

        webview.addEventListener('MSWebViewNavigationCompleted', onSuccess);
        webview.addEventListener('MSWebViewUnsupportedUriSchemeIdentified', onFail);
        webview.addEventListener('MSWebViewUnviewableContentIdentified', onFail);

        function onSuccess() {
            onFinished(success);
        }

        function onFail() {
            onFinished(fail, 'WEBVIEW_NAVIGATION_FAILED');
        }

        function onFinished(callback, message) {
            if (typeof callback == 'function') {
                callback(message);
            }

            // Remove event listeners if they should fire only once
            if (once) {
                webview.removeEventListener('MSWebViewNavigationCompleted', onSuccess);
                webview.removeEventListener('MSWebViewUnsupportedUriSchemeIdentified', onFail);
                webview.removeEventListener('MSWebViewUnviewableContentIdentified', onFail);
            }
        }
    }
}

function checkSSLCertificate(url, fingerprint, nrOfConnectionAttempts, success, fail) {
    /// <signature>
    /// <summary>Checks the SSL certificate of the provided url against the provided fingerprint</summary>
    ///	<param name='url' type='String'>
    ///     The url whose certificate to check
    /// </param>
    ///	<param name='fingerprint' type='String'>
    ///     The SHA fingerprint to check against
    /// </param>
    ///	<param name='nrOfConnectionAttempts' type='Number'>
    ///     The number of connection attempts to make. If left empty it will fail after 1 attempt.
    /// </param>
    /// <param name='success' type='Function'>
    ///     The success callback
    /// </param>
    /// <param name='fail' type='Function'>
    ///     The fail callback
    /// </param>
    /// </signature>
    window.plugins.sslCertificateChecker.check(
        success,
        function (message) {
            if (message == "CONNECTION_NOT_SECURE") {
                // There is likely a man in the middle attack going on, be careful!
                if (typeof fail == 'function') {
                    fail(message);
                }
            } else if (message.indexOf("CONNECTION_FAILED") > -1) {
                // Check if nr of connection attemps is a number
                if (isNaN(nrOfConnectionAttempts)) {
                    if (typeof fail == 'function') {
                        fail(message);
                    }
                } else {
                    // Made an attempt so decrease the number left to do
                    --nrOfConnectionAttempts;

                    if (nrOfConnectionAttempts > 0) {
                        // Attempt to connect again
                        setTimeout(function () {
                            checkSSLCertificate(url, fingerprint, nrOfConnectionAttempts, success, fail);
                        }, 2000);
                    } else {
                        if (typeof fail == 'function') {
                            fail(message);
                        }
                    }
                }
            }
        },
        url,
        fingerprint);
}

function handlePermissionRequest(success, fail, args) {
    /// <signature>
    /// <summary>
    ///     Handles the permission request  with the provided id by allowing or denying it depending on the provided
    // 'allow' argument / </summary> / <param name='success' type='Function'> /     The success callback / </param> /
    // <param name='fail' type='Function'> /     The fail callback / </param> / <param name='args' type='Array'> /
    // An array with the arguments. The first index in the array is the id of the permission request. The second index
    // is a boolean that indicates the request is to be allowed or denied. / </param> / </signature>

    var id = args[0],
        allow = args[1];

    var permissionRequest = webview.getDeferredPermissionRequestById(id);
    if (permissionRequest) {
        if (allow) {
            permissionRequest.allow();
        } else {
            permissionRequest.deny();
        }

        if (typeof success == 'function') {
            success();
        }
    } else {
        if (typeof fail == 'function') {
            fail();
        }
    }
}

function getPermissionRequests(success, fail) {
    /// <signature>
    /// <summary>
    ///     Returns all the outstanding permission requests
    /// </summary>
    /// <param name='success' type='Function'>
    ///     The success callback
    /// </param>
    /// <param name='fail' type='Function'>
    ///     The fail callback
    /// </param>
    /// </signature>
    var permissionRequests = webview.getDeferredPermissionRequests();

    if (permissionRequests) {
        if (typeof success == 'function') {
            var plainPermissionRequests = [];

            for (var p = 0; p < permissionRequests.length; p++) {
                var permissionRequest = permissionRequests[p];
                var plainPermissionRequest = {
                    id: permissionRequest.id,
                    type: permissionRequest.type,
                    uri: permissionRequest.uri
                };

                plainPermissionRequests.push(plainPermissionRequest);
            }

            success(plainPermissionRequests);
        }
    } else {
        if (typeof fail == 'function') {
            fail();
        }
    }
}

function fireBackRequestedEvent(evt) {
    /// <signature>
    /// <summary>Fires the cordova event 'backrequested' on the webview</summary>
    ///	<param name='evt' type='Event'>
    ///     The back button clicked event
    /// </param>
    /// </signature>
    invokeScript('fireCordovaEvent', { eventName: 'backrequested', args: { detail: evt } });
}

channel.onDeviceReady.subscribe(function () {
    // Create and add the webview
    webview = document.createElement('x-ms-webview');
    webview.getDeferredPermissionRequestById
    webview.style.cssText = 'position: absolute; top:0; left:0; width:100%; height:100%;';

    webview.addEventListener("MSWebViewPermissionRequested", function (e) {
        // Always defer permission requests
        e.permissionRequest.defer();

        // Create plain object of the permission request
        var plainPermissionRequest = {
            id: e.permissionRequest.id,
            type: e.permissionRequest.type,
            uri: e.permissionRequest.uri
        };

        // Fire the native event in the webview
        invokeScript('fireCordovaEvent', {eventName: 'wwPermissionRequested', args: plainPermissionRequest});
    });

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
                var navigateArgs = [urlNode.textContent, httpMethodNode.textContent, parseHeaders(windowsWebviewNode)];

                // Get refresh preference
                var refreshNode = windowsWebviewNode.getElementsByTagName("refresh").item(0);
                navigateArgs.push(refreshNode ? refreshNode.textContent : false);

                // Get fingerprint
                var fingerprintNode = windowsWebviewNode.getElementsByTagName("fingerprint").item(0);
                navigateArgs.push(fingerprintNode ? fingerprintNode.textContent : null);

                // Get max connection attempts preference
                var maxConnectionAttemptsNode = windowsWebviewNode.getElementsByTagName("max-connection-attempts").item(0);
                navigateArgs.push(maxConnectionAttemptsNode ? maxConnectionAttemptsNode.textContent : null);

                // Navigate to the configured url with the configured http method and headers
                navigate(null, null, navigateArgs);
            } else {
                utils.alert("[ERROR] The 'url' and/or 'http-method' node could not be found");
            }
        } else {
            utils.alert("[INFO] The 'windows-webview' node could not be found");
        }

        // Check if the interceptbackbutton preference has been set
        var interceptBackButton = doc.getElementsByName("interceptbackbutton").item(0);
        if (interceptBackButton) {
            var value = interceptBackButton.getAttribute('value');

            // Add 'backbutton' event listener if set to true
            if (value == "true") {
                document.addEventListener("backbutton", fireBackRequestedEvent);
                backButtonListenerAdded = true;
            }
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

    // Fire event to indicate the webview is ready
    document.dispatchEvent(createEvent('webviewready'));
});

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

// Copied from cordova.js
function createEvent(type, data) {
    /// <signature>
    /// <summary>Creates an event with the provided type and data</summary>
    ///	<param name='type' type='string'>
    ///     The type of event
    /// </param>
    /// <param name='data' type='{}'>
    ///    The data to pass with the event
    /// </param>
    /// </signature>
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

module.exports = {
    navigate: navigate,
    goBack: goBack,
    interceptBackButton: interceptBackButton,
    onNavigation: onNavigation,
    handlePermissionRequest: handlePermissionRequest,
    getPermissionRequests: getPermissionRequests
};

require("cordova/exec/proxy").add("WindowsWebview", module.exports);
