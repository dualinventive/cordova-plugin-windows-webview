/**
 * Created by mmanders on 5/25/2016.
 */

cordova.define("cordova-plugin-file.fileSystems", function(require, exports, module) {
    var exec = require('cordova/exec');

    module.exports.getFs = function (name, callback) {
        // Check which type to use
        var type = name == "temporary" ? LocalFileSystem.TEMPORARY : LocalFileSystem.PERSISTENT;

        exec(function (fs) {
            // Create a new FileSystem object using the data in the returned FileSystem object
            callback(new (require('./FileSystem'))(fs.name, fs.root));
        }, null, "File", "requestFileSystem", [type, 0]);
    };
});