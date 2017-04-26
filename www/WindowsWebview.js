var exec = require('cordova/exec'),
    ns = "WindowsWebview",
    permissionRequestedEvent = 'wwPermissionRequested';

/**
 * @callback navigationCompleted
 * @property {boolean} isSuccess Indicates whether the navigation completed successfully.
 * @property {string} uri The Uniform Resource Identifier (URI) of the content.
 * @property {number} webErrorStatus A value that explains an unsuccessful navigation. Use Windows.Web.WebErrorStatus
 *     to identify the error.
 */

/**
 * @callback unviewableContentIdentified
 * @property {string} mediaType The media type of content that can't be viewed.
 * @property {string} referrer The Uniform Resource Identifier (URI) of the referring page.
 * @property {string} uri The Uniform Resource Identifier (URI) of the content.
 */

/**
 * @callback unsupportedUriSchemeIdentified
 * @property {boolean} mediaType Gets or sets a value that marks the routed event as handled. A true value for Handled
 *     prevents other handlers along the event route from handling the same event again.
 * @property {string} uri The Uniform Resource Identifier (URI) of the content.
 */

/**
 * Navigates the webview to the specified url.
 *
 * @param {string} url The url to navigate to
 * @param {string} httpMethod The Http method with which to perform request
 * @param {[{name: string}]} [headers] The headers to add to the request. The array should include objects with the
 *     following properties:
 *     name: Name of the header (ex. Cache-Control)
 *     value: Value to append to the header (ex. no-cache)
 *
 *     Note: To add multiple values to one header, add a header object with the same name and a different value to the
 *     array.
 * @param {boolean} [refresh] Indicates the webview will be refreshed, clearing the cache, before navigating to the
 *     provided url.
 * @param {string} [fingerprint] The SHA fingerprint used to check the validity of the SSL certificate of the url. Used
 *     to prevent 'Man in the Middle' attacks.
 * @param {number} [maxConnectionAttempts=1] The maximum number of connection attempts made checking the validity of
 *     the SSL certificate before failing.
 * @param {navigationCompleted} success The success callback, called when the webview has navigated successfully. Only
 *     useful in native scripts.
 * @param {navigationCompleted|unviewableContentIdentified|unsupportedUriSchemeIdentified} fail The fail callback,
 *     called when the webview has failed to navigate or when using the fingerprint option and validation fails. Only
 *     useful in native scripts.
 */
function navigate(url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts, success, fail) {
    exec(success, fail, ns, "navigate", [url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts]);
}

/**
 * Indicates whether or not the back button press should be intercepted
 *
 * @param [intercept=false] Set this to 'true' if you want to listen for the 'backbutton' event.
 */
function interceptBackButton(intercept) {
    exec(function () {
    }, function () {
    }, ns, "interceptBackButton", [intercept]);
}

/**
 * Traverses backward once in the navigation stack of the webview if possible.
 */
function goBack() {
    exec(function () {
    }, function () {
    }, ns, "goBack", []);
}

/**
 * Executes the provided callbacks when the webview navigates successfully or fails. </br>
 * Note: This is only useful in native scripts, scripts executed in the webview will never be able to listen to webview
 * events.
 *
 * @param {navigationCompleted} [success] The success callback.
 * @param {navigationCompleted|unviewableContentIdentified|unsupportedUriSchemeIdentified} [fail] The fail callback.
 * @param {boolean} [once] Indicates the callbacks should only be executed once
 */
function onNavigation(success, fail, once) {
    success = typeof success === 'function' ? success : function () {
    };
    fail = typeof fail === 'function' ? fail : function () {
    };

    exec(success, fail, "WindowsWebview", "onNavigation", [once]);
}

/**
 * Handles the permission request with the provided id by allowing or denying it depending on the provided 'allow'
 * argument.
 *
 * @param {number} id The id of the permission request to handle.
 * @param {boolean} allow Indicates the permission request should be granted. Set to false to deny the permission
 *     request.
 * @param {getPermissionRequestSuccess} [success] The callback function to execute when the permission with the
 *     provided is among the unhandled requests.
 * @param {Function} [fail] The callback function to execute when the permission with the provided is not among the
 *     unhandled requests.
 */
function handlePermissionRequest(id, allow, success, fail) {
    exec(success, fail, ns, "handlePermissionRequest", [id, allow]);
}

/**
 * @callback getPermissionRequestSuccess
 * @property {WWPermissionRequest[]} requests The returned requests
 */

/**
 * Returns all the outstanding permission requests in the success callback.
 *
 * @param {Function} [success] The callback function to execute when requests have been returned.
 * @param {Function} [fail] The callback function to execute when failing to get the requests.
 */
function getPermissionRequests(success, fail) {
    exec(function (permissionRequests) {
        if (typeof success === 'function') {
            var wwPermissionRequests = [];

            for (var i = 0; i < permissionRequests.length; i++) {
                var permissionRequest = permissionRequests[i];
                wwPermissionRequests.push(new WWPermissionRequest(permissionRequest.id, permissionRequest.type, permissionRequest.uri));
            }

            success(wwPermissionRequests);
        }
    }, fail, ns, "getPermissionRequests", []);
}

/**
 * @callback onPermissionRequestedCallback
 * @property {WWPermissionRequest} request The permission request
 */

/**
 * Creates an event handler and registers it to the permission requested event.
 *
 * @param {onPermissionRequestedCallback} callback The callback function to execute when the permission requested event
 *     is fired.
 * @return {Function} Returns the created event handler which can be used to unregister the event handler.
 */
function onPermissionRequested(callback) {
    var handler = function (e) {
        if (typeof callback === 'function') {
            var permissionRequest = e.detail;
            callback(new WWPermissionRequest(permissionRequest.id, permissionRequest.type, permissionRequest.uri))
        }
    };
    document.addEventListener(permissionRequestedEvent, handler);

    return handler;
}

/**
 * Unregisters the provided event handler from the permission requested event.
 * @param {Function} callback The event handler to unregister.
 */
function offPermissionRequested(callback) {
    document.removeEventListener(permissionRequestedEvent, callback);
}

/**
 * A permission request
 *
 * @param {number} id The id of the permission request
 * @param {string} type The type of permission requested
 * @param {string} uri The Uniform Resource Identifier (URI) of the content where the permission request originated.
 * @constructor
 */
function WWPermissionRequest(id, type, uri) {
    this.id = id;
    this.type = type;
    this.uri = uri;
}

/**
 * Grants the requested permission.
 *
 * @param {getPermissionRequestSuccess} [success] The callback function to execute when the permission with the
 *     provided is among the unhandled requests.
 * @param {Function} [fail] The callback function to execute when the permission with the provided is not among the
 *     unhandled requests.
 */
WWPermissionRequest.prototype.allow = function (success, fail) {
    handlePermissionRequest(this.id, true, success, fail);
};

/**
 * Denies the requested permission.
 *
 * @param {getPermissionRequestSuccess} [success] The callback function to execute when the permission with the
 *     provided is among the unhandled requests.
 * @param {Function} [fail] The callback function to execute when the permission with the provided is not among the
 *     unhandled requests.
 */
WWPermissionRequest.prototype.deny = function (success, fail) {
    handlePermissionRequest(this.id, false, success, fail);
};

module.exports = {
    navigate: navigate,
    goBack: goBack,
    onNavigation: onNavigation,
    interceptBackButton: interceptBackButton,
    handlePermissionRequest: handlePermissionRequest,
    getPermissionRequests: getPermissionRequests,
    onPermissionRequested: onPermissionRequested,
    offPermissionRequested: offPermissionRequested
};
