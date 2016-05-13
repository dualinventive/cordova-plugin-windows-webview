(function () {
    window.onNativeReady = true;

    // Override WinJS
    window.WinJS = {
        Application: {
            addEventListener: addEventListener,
            start: function () {
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
            },
            Core: {
                SystemNavigationManager: {
                    getForCurrentView: function () {
                        return {
                            addEventListener: addEventListener
                        }
                    }
                },
                AppViewBackButtonVisibility: {
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