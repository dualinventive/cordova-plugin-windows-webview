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
	var originalCallbackFromNative = cordova.callbackFromNative;

	// Override callbackFromNative to make sure 'status' and 'keepCallback' are included in the args
	cordova.callbackFromNative = function (callbackId, isSuccess, status, args, keepCallback) {
		args = [status, args, keepCallback];

		originalCallbackFromNative(callbackId, isSuccess, status, args, keepCallback);
	};

	// Add listeners for the native events
	document.addEventListener("resume", function () {
		// Fire the native event in the webview
		invokeScript('fireCordovaEvent', { eventName: 'resuming' });
	});

	document.addEventListener("pause", function () {
		// Fire the native event in the webview
		invokeScript('fireCordovaEvent', { eventName: 'checkpoint' });
	});

	document.addEventListener("activated", function (e) {
		// Fire the native event in the webview
		invokeScript('fireCordovaEvent', { eventName: 'activated', args: { detail: { type: e.type, arguments: e.args } } });
	});

	document.addEventListener("backbutton", function (evt) {
		// Fire the native event in the webview
		invokeScript('fireCordovaEvent', { eventName: 'backrequested', args: { detail: evt} });
	});

	// Add listener for webview sending messages
	webview.addEventListener("MSWebViewScriptNotify", function (e) {
		try {
			// Parse the message
			var data = JSON.parse(e.value);

			// Execute the cordova function specified in the message
			cordova.exec(function (status, args, keepCallback) {
				invokeScript('callbackFromNative', [data.callbackId, true, status, args, keepCallback]);
			}, function (status, args, keepCallback) {
				invokeScript('callbackFromNative', [data.callbackId, false, status, args, keepCallback]);
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
				navigate(function () { }, function () { }, [url, httpMethod, headers]);
			} else {
				utils.alert("[ERROR] The 'url' and/or 'http-method' node could not be found");
			}
		} else {
			utils.alert("[INFO] The 'windows-webview' node could not be found");
		}
	});
	xhr.open("get", "../config.xml", true);
	xhr.send();

	function parseHeaders(windowsWebviewNode)
	{
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
				var header = { name: headerNodes.item(i).getAttribute('name'), value: headerNodes.item(i).getAttribute('value') };
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
		var invoke = webview.invokeScriptAsync(script, JSON.stringify(args));
		invoke.onerror = function (e) {
			utils.alert("[ERROR] Error invoking webview function: " + e);
		};

		invoke.start();
	}
});

module.exports = {
	navigate: navigate
};

require("cordova/exec/proxy").add("WindowsWebview", module.exports);