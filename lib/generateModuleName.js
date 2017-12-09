const capitalize = str => str && (str[0].toUpperCase() + str.slice(1));

/**
 * Generates module name from file name.
 *
 * src/foo/bar/baz/quz.js   => base.foo.bar.baz.quz
 * src/foo/bar/baz/index.js => base.foo.bar.baz
 * src/foo/bar/baz/Baz.js   => base.foo.bar.Baz
 */
module.exports = function generateModuleName(filename, {
    sourceExtension = '.js',
    sourceDir = '.',
    moduleBase = ''
} = {}) {
    if (sourceDir) {
        sourceDir = sourceDir.replace(/\/*$/, '/');

        if (!sourceDir.startsWith('./') && !sourceDir.startsWith('/')) {
            sourceDir = './' + sourceDir;
        }
    }

    if (filename.startsWith('/')) {
        throw new Error(`Filename can't start with /: ${filename}`);
    }

    if (!filename.startsWith('./')) {
        filename = './' + filename;
    }

    let modulePath = filename;
    let usePrefix = false;
    if (sourceDir && modulePath.startsWith(sourceDir)) {
        modulePath = modulePath.slice(sourceDir.length);
        usePrefix = true;
    } else if (!sourceDir) {
        usePrefix = true;
    }

    const modulePathWithoutExtension = modulePath.endsWith(sourceExtension)
        ? modulePath.substr(0, modulePath.length - sourceExtension.length)
        : modulePath;

    let moduleName = modulePathWithoutExtension.replace(/^\.\//, '').replace(/\//g, '.');

    const parts = moduleName.split('.');
    if (parts.length >= 2) {
        if (parts[parts.length - 1] === capitalize(parts[parts.length - 2])) {
            parts.splice(parts.length - 2, 1);
            moduleName = parts.join('.');
        } else if (parts[parts.length - 1] === 'index') {
            moduleName = parts.slice(0, parts.length - 1).join('.');
        }
    }

    if (usePrefix && moduleBase) {
        moduleName = moduleBase + '.' + moduleName;
    }

    return moduleName;
}
