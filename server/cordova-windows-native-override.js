(function () {
    window.onNativeReady = true;

    var MS_APP_HOST_3 = 'MSAppHost/3.0', MS_APP_HOST_2 = 'MSAppHost/2.0';
    var useMSAppHost3 = false, isWindows10 = navigator.appVersion.indexOf(MS_APP_HOST_3) !== -1;

    // Check if it's Windows 10
    if (isWindows10) {
        // MSAppHost/3.0 needs to be replaced with MSAppHost/2.0 in order to avoid a fatal 'access violation' on Windows 10.
        var appVersionMSAppHost3 = navigator.appVersion,
            appVersionMSAppHost2 = appVersionMSAppHost3.replace(MS_APP_HOST_3, MS_APP_HOST_2),
            appVersionProp = {
                get: function () {
                    if (useMSAppHost3) {
                        return appVersionMSAppHost3;
                    } else {
                        return appVersionMSAppHost2;
                    }
                }
            };

        // Can only define a property once
        Object.defineProperty(window.navigator, 'appVersion', appVersionProp);
    }

    // Override WinJS
    window.WinJS = {
        Application: {
            addEventListener: addEventListener,
            start: function () {
                if (isWindows10) {
                    useMSAppHost3 = true;
                }
            }
        }
    };

    // Override Windows
    window.Windows = {
        UI: {
            WebUI: {
                WebUIApplication: {
                    addEventListener: addEventListener
                }
            }
        }
    };

    /**
     * Used to fire the native Windows events
     * @param args The arguments. Must contain the property 'eventName' and optionally the property 'args'.
     */
    window.fireCordovaEvent = function (args) {
        var data = JSON.parse(args);

        var detail;
        if (data.args) {
            detail = {detail: data.args};
        }

        var event = new CustomEvent(data.eventName, detail);
        document.dispatchEvent(event);
    };

    function addEventListener(type, listener, useCapture) {
        document.addEventListener(type, listener, useCapture);
    }
})();