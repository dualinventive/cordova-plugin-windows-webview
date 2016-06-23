/**
 * Created by mmanders on 5/11/2016.
 */
cordova.define("cordova-plugin-windows-webview.exec", function (require, exports, module) {
    // Get a reference to the original callbackFromNative
    var originalCallbackFromNative =  window.cordova.callbackFromNative;

    // callbackFromNative needs to be exposed globally, invokeScriptAsync cannot reach it otherwise
    window.callbackFromNative = function (args) {
        // Call the original callbackFromNative with the parsed arguments
        originalCallbackFromNative.apply(null, JSON.parse(args));
    };

    var cordova = require('cordova');

    // Remove the original exec function
    cordova.define.remove('cordova/exec');

    /**
     * Execute a cordova command.  It is up to the native side whether this action
     * is synchronous or asynchronous.  The native side can return:
     *      Synchronous: PluginResult object as a JSON string
     *      Asynchronous: Empty string ""
     * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
     * depending upon the result of the action.
     *
     * @param {Function} success    The success callback
     * @param {Function} fail       The fail callback
     * @param {String} service      The name of the service to use
     * @param {String} action       Action to be run in cordova
     * @param {String[]} [args]     Zero or more arguments to pass to the method
     */
    var exec = function (success, fail, service, action, args) {
        var callbackId = service + cordova.callbackId++;

        args = args || [];

        // console.log("EXEC:" + service + " : " + action);
        if (typeof success === "function" || typeof fail === "function") {
            cordova.callbacks[callbackId] = {success: success, fail: fail};
        }
        try {
            if (window.external && 'notify' in window.external) {
                // Send the command to the native side
                window.external.notify(JSON.stringify({
                    service: service,
                    action: action,
                    args: args,
                    callbackId: callbackId
                }));
            }
        } catch (e) {
            console.log("Exception calling native with command :: " + service + " :: " + action + " ::exception=" + e);
        }
    };

    // Define the new exec function
    cordova.define("cordova/exec", function (require, exports, module) {
        module.exports = exec;
    });

    module.exports = exec;
});