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

In the cordova_plugins.js you will need to add the WindowsWebviewExec.js as a plugin:

	{
		"file": "plugins/cordova-plugin-windows-webview/www/WindowsWebviewExec.js",
		"id": "cordova-plugin-windows-webview.exec",
		"runs": [
		]
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

If you want the webview to immediately navigate to your website add the following to the config.xml of your project:

    <windows-webview>
      <url>https://mywebsite.com</url>
      <http-method>POST</http-method>
      <headers>
        <header name="cache-control" value="no-store" />
      </headers>
    </windows-webview>

- __url__: The url to navigate to

- __http-method__: The Http method with which to perform request

- __header__: A header to add to the request. You can add as many request headers as you like. To add multiple values to one header, add a header node with the same name and a different value.

## cordova.plugins.WindowsWebview.navigate

Navigates the webview to the specified url.

	cordova.plugins.WindowsWebview.navigate(url, httpMethod, headers);

- __url__: {string} The url to navigate to

- __http-method__: {string} The Http method with which to perform request

- __headers__: {Array} Optional. The headers to add to the request.

	The array should include objects with the following properties:

	- __name__: Name of the header (ex. Cache-Control)

	- __value__: Value to append to the header (ex. no-cache)}

	Note: To add multiple values to one header, add a header object with the same name and a different value to the array.

## Supported Platforms

- Windows

