var exec = require('cordova/exec');

module.exports = {
    navigate: function (url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts, success, fail) {
        exec(success, fail, "WindowsWebview", "navigate", [url, httpMethod, headers, refresh, fingerprint, maxConnectionAttempts]);
	},
	goBack: function () {
		exec(function () { }, function () { }, "WindowsWebview", "goBack", []);
	},
	interceptBackButton: function (intercept) {
		exec(function () { }, function () { }, "WindowsWebview", "interceptBackButton", [intercept]);
	}
};