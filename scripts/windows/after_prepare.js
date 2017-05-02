module.exports = function (ctx) {
    var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path');

    var appxmanifestWindows = path.join(ctx.opts.projectRoot, '/platforms/windows/package.windows.appxmanifest'),
        appxmanifestPhone = path.join(ctx.opts.projectRoot, '/platforms/windows/package.phone.appxmanifest'),
        configXML = path.join(ctx.opts.projectRoot, '/config.xml');

    if (fs.existsSync(appxmanifestWindows)) {
        if (fs.existsSync(appxmanifestPhone)) {
            if (fs.existsSync(configXML)) {
                try {
                    var configData = fs.readFileSync(configXML, 'utf8');

                    // Find all allowed urls
                    var regexAllowNavigation = /<allow-navigation href="(.*)".*\/>/g,
                        matches,
                        rules = '<ApplicationContentUriRules>';

                    // Create rule for each match
                    while (matches = regexAllowNavigation.exec(configData)) {
                        rules += '<Rule Match="' + matches[1] + '" Type="include"/>';
                    }

                    rules += '</ApplicationContentUriRules>';

                    // Write the rules to the files
                    writeRulesToFile(appxmanifestWindows, rules);
                    writeRulesToFile(appxmanifestPhone, rules);
                } catch (ex) {
                    console.log(ex);
                }
            } else {
                console.log('Couldn not find: ' + configXML);
            }
        } else {
            console.log('Couldn not find: ' + appxmanifestPhone);
        }
    } else {
        console.log('Couldn not find: ' + appxmanifestWindows);
    }

    function writeRulesToFile(filename, rules) {
        var fileData = fs.readFileSync(filename, 'utf8');

        var regexConfigFile = /([\s\S]*)(<\/Application>)/g;
        var replaceData = '$1' + rules + '$2';
        var result = fileData.replace(regexConfigFile, replaceData);

        fs.writeFileSync(filename, result, 'utf8');
    }
};