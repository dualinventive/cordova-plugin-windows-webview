var exec = require('cordova/exec');

module.exports = {
	navigate: function (url, httpMethod, headers) {
		exec(function () { }, function () { }, "WindowsWebview", "navigate", [url, httpMethod, headers]);
	},
	goBack: function () {
		exec(function () { }, function () { }, "WindowsWebview", "goBack", []);
	},
	interceptBackButton: function (intercept) {
		exec(function () { }, function () { }, "WindowsWebview", "interceptBackButton", [intercept]);
	}
};