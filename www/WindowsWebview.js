var exec = require('cordova/exec'),
    ns = "WindowsWebview",
    permissionRequestedEvent = 'wwPermissionRequested';

function navigate(url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts, success, fail) {
    exec(success, fail, ns, "navigate", [url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts]);
}

function interceptBackButton(intercept) {
    exec(function () {
    }, function () {
    }, ns, "interceptBackButton", [intercept]);
}

function goBack() {
    exec(function () {
    }, function () {
    }, ns, "goBack", []);
}

function handlePermissionRequest(id, allow, success, fail) {
    exec(success, fail, ns, "handlePermissionRequest", [id, allow]);
}

function getPermissionRequests(success, fail) {
    exec(function (permissionRequests) {
        if (typeof success == 'function') {
            var wwPermissionRequests = [];

            for (var i = 0; i < permissionRequests.length; i++) {
                var permissionRequest = permissionRequests[i];
                wwPermissionRequests.push(new WWPermissionRequest(permissionRequest.id, permissionRequest.type, permissionRequest.uri));
            }

            success(wwPermissionRequests);
        }
    }, fail, ns, "getPermissionRequests", []);
}

function onPermissionRequested(callback) {
    var handler = function (e) {
        if (typeof callback == 'function') {
            var permissionRequest = e.detail;
            callback(new WWPermissionRequest(permissionRequest.id, permissionRequest.type, permissionRequest.uri))
        }
    };
    document.addEventListener(permissionRequestedEvent, handler);

    return handler;
}

function offPermissionRequested(callback) {
    document.removeEventListener(permissionRequestedEvent, callback);
}

function WWPermissionRequest(id, type, uri) {
    this.id = id;
    this.type = type;
    this.uri = uri;
}

WWPermissionRequest.prototype.allow = function (success, fail) {
    handlePermissionRequest(this.id, true, success, fail);
};

WWPermissionRequest.prototype.deny = function (success, fail) {
    handlePermissionRequest(this.id, false, success, fail);
};

module.exports = {
    navigate: navigate,
    goBack: goBack,
    interceptBackButton: interceptBackButton,
    handlePermissionRequest: handlePermissionRequest,
    getPermissionRequests: getPermissionRequests,
    onPermissionRequested: onPermissionRequested,
    offPermissionRequested: offPermissionRequested
};
