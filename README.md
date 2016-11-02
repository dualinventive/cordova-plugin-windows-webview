# cordova-plugin-windows-webview
A webview implementation for the 'windows' platform in cordova. With this plugin you can load an external site and make
use of the cordova functionality.

## Installation

    cordova plugin add cordova-plugin-windows-webview

## Server configuration

Firstly you will need to copy the cordova.js, cordova_plugins.js and the plugins directory from the windows platform to your server.
After that you will need to copy the files, located in the \server directory of this plugin, to the same location as you have copied the cordova.js file.

The order in which to include the cordova files is as follows:

1. cordova-windows-native-override.js (This file overrides any references in cordova.js to native Windows functions)
2. cordova.js
3. (Optional) cordova_plugins.js (This file should automatically be included by cordova.js, but can be added manually)

### Plugin configuration

In the cordova_plugins.js you will need to add the WindowsWebviewExec.js as a plugin. **Important! This needs to be added to the top of the list**.

	{
		"file": "plugins/cordova-plugin-windows-webview/www/WindowsWebviewExec.js",
		"id": "cordova-plugin-windows-webview.exec",
		"clobbers": [
			"cordova.exec",
			'Cordova.exec'
		]
	},

_Note: Some plugins will not automatically work, including original cordova ones. Report any issues you might find._

For the following plugins extra entries in the cordova_plugins.js are required, they need to be added underneath the WindowsWebviewExec.js entry.

#### cordova-plugin-file

	{
		"file": "plugins/cordova-plugin-windows-webview/www/cordova-plugin-file/fileSystems.js",
		"id": "cordova-plugin-file.fileSystems",
		"pluginId": "cordova-plugin-windows-webview",
		"runs": true
	},
	{
		"file": "plugins/cordova-plugin-windows-webview/www/cordova-plugin-file/FileSystem.js",
		"id": "cordova-plugin-windows-webview.FileSystem",
		"pluginId": "cordova-plugin-windows-webview",
		"runs": true
	},

You should remove all references to proxy files. For example for the device plugin you can remove this:

    {
        "file": "plugins/cordova-plugin-device/src/windows/DeviceProxy.js",
        "id": "cordova-plugin-device.DeviceProxy",
        "pluginId": "cordova-plugin-device",
        "merges": [
            ""
        ]
    }

You can also remove the actual proxy file located in the plugins directory. In the case of the device plugin you can remove this file:

	plugins/cordova-plugin-device/src/windows/DeviceProxy.js

## Client configuration

__Important!__

The website you want to navigate to and use cordova with __must__ be included in the cordova white-list or manually in the ApplicationContentUriRules.
Your website will not be able to communicate with the native cordova otherwise.

You will receive a warning like this if it is not included in the white-list/ApplicationContentUriRules:

	Unable to receive a ScriptNotify event from: 'https://mywebsite.com'. The website attempted to send a ScriptNotify event to the app from a WebView URI that is not included in the ApplicationContentUriRules ...

If you want the webview to immediately navigate to your website add the following to the config.xml of your project:

    <windows-webview>
      <url>https://mywebsite.com</url>
      <http-method>POST</http-method>
      <headers>
        <header name="cache-control" value="no-store" />
      </headers>
      <refresh>false</refresh>
      <fingerprint>2B 24 1B E0 D0 8C A6 41 68 C2 BB E3 60 0A DF 55 1A FC A8 45</fingerprint>
      <max-connection-attempts>3</max-connection-attempts>
      <preference name="interceptbackbutton" value="false"/>
    </windows-webview>

- __url__: The url to navigate to

- __http-method__: The Http method with which to perform request

- __header__: A header to add to the request. You can add as many request headers as you like. To add multiple values to one header, add a header node with the same name and a different value.

- __refresh__: {boolean} Indicates the webview will be refreshed, clearing the cache, before navigating to the provided url. </br>
 	Defaults to **false**. 	

- __fingerprint__: The SHA fingerprint used to check the validity of the SSL certificate of the url. Used to prevent 'Man in the Middle' attacks. For more information refer to: [SSLCertificateChecker-PhoneGap-Plugin](https://github.com/EddyVerbruggen/SSLCertificateChecker-PhoneGap-Plugin) </br>
    Defaults to **null**. No validation is performed. 
    
- __max-connection-attempts__: The maximum number of connection attempts made checking the validity of the SSL certificate before failing. </br>
    Defaults to **1**. Only 1 attempt is made. 

- __preferences__:
 	- __interceptbackbutton__: {boolean} Indicates the back button press should be intercepted. </br>
 	Set this to **true** if you want to listen for the 'backbutton' event. Defaults to **false**.

## cordova.plugins.WindowsWebview.navigate

Navigates the webview to the specified url.

	cordova.plugins.WindowsWebview.navigate(url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts, success, fail);

- __url__: {string} The url to navigate to

- __http-method__: {string} The Http method with which to perform request

- __headers__: {Array} Optional. The headers to add to the request.

	The array should include objects with the following properties:

	- __name__: Name of the header (ex. Cache-Control)

	- __value__: Value to append to the header (ex. no-cache)}

	Note: To add multiple values to one header, add a header object with the same name and a different value to the array.

- __refresh__: {boolean} Optional. Indicates the webview will be refreshed, clearing the cache, before navigating to the provided url.

- __fingerprint__: {string} Optional. The SHA fingerprint used to check the validity of the SSL certificate of the url. Used to prevent 'Man in the Middle' attacks. For more information refer to: [SSLCertificateChecker-PhoneGap-Plugin](https://github.com/EddyVerbruggen/SSLCertificateChecker-PhoneGap-Plugin)

- __max-connection-attempts__: {number: 1} Optional. The maximum number of connection attempts made checking the validity of the SSL certificate before failing.

- __success__: {Function} Optional. The success callback, called when the webview has navigated successfully. Only useful in native scripts.

- __fail__: {Function(message)} Optional. The fail callback, called when the webview has failed to navigate or when using the fingerprint option and validation fails. Only useful in native scripts.

## cordova.plugins.WindowsWebview.goBack

Traverses backward once in the navigation stack of the webview if possible.

	cordova.plugins.WindowsWebview.goBack();

## cordova.plugins.WindowsWebview.interceptBackButton

Indicates whether or not the back button press should be intercepted

	cordova.plugins.WindowsWebview.interceptBackButton(intercept);

- __intercept__: {boolean} Set this to **true** if you want to listen for the 'backbutton' event. Defaults to **false**.

## cordova.plugins.WindowsWebview.onNavigation

Executes the provided callbacks when the webview navigates successfully or fails. </br>
Note: This is only useful in native scripts, scripts executed in the webview will never be able to listen to webview events.

	cordova.plugins.WindowsWebview.onNavigation(success, fail, once);

- __success__: {Function} Optional. The callback function to execute when the webview successfully navigated.

- __fail__: {Function} Optional. The callback function to execute when the webview fails to navigate for whatever reason.

- __once__: {boolean} Optional. Indicates the provided callback functions should only be executed once.

## Supported Platforms

- Windows

## Credits

Incorporates the SSLCertificateChecker-PhoneGap-Plugin by [Eddy Verbruggen](https://github.com/EddyVerbruggen)