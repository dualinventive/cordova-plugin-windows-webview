/**
 * Created by mmanders on 5/25/2016.
 */

cordova.define("cordova-plugin-windows-webview.FileSystem", function(require, exports, module) {
    var FileSystem = require('cordova-plugin-file.FileSystem');

    // Copied from FileProxy.js
    function sanitize(path) {
        var slashesRE = new RegExp('/{2,}','g');
        var components = path.replace(slashesRE, '/').split(/\/+/);
        // Remove double dots, use old school array iteration instead of RegExp
        // since it is impossible to debug them
        for (var index = 0; index < components.length; ++index) {
            if (components[index] === "..") {
                components.splice(index, 1);
                if (index > 0) {
                    // if we're not in the start of array then remove preceeding path component,
                    // In case if relative path points above the root directory, just ignore double dots
                    // See file.spec.111 should not traverse above above the root directory for test case
                    components.splice(index-1, 1);
                    --index;
                }
            }
        }
        return components.join('/');
    }

    // Copied from FileProxy.js
    FileSystem.prototype.__format__ = function(fullPath) {
        var path = sanitize('/'+this.name+(fullPath[0]==='/'?'':'/')+FileSystem.encodeURIPath(fullPath));
        return 'cdvfile://localhost' + path;
    };
});