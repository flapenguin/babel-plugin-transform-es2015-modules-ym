const path = require('path');
const generateModuleName = require('./generateModuleName');

function splitFirst(str, separator) {
    const ix = str.indexOf(separator);
    if (ix === -1) {
        return [str, ''];
    }

    return [str.substr(0, ix), str.substr(ix + separator.length)];
}

module.exports = function (imported, importer, options) {
    const { sourceMappings = {} } = options;

    if (path.isAbsolute(imported)) {
        throw new Error(`Doesn't know how to deal with absolute module: ${imported}`);
    }

    if (!/^(\.|\.\.)/.test(imported)) {
        const [package, rest] = splitFirst(imported, '/');

        const mapping = Object.keys(sourceMappings)
            .find(mapping => mapping.replace(/\/+$/, '') === package);

        if (mapping === undefined) {
            throw new Error(`Doesn't know how to map '${package}'`);
        }

        const prefix = sourceMappings[mapping] ? sourceMappings[mapping] + '.' : '';

        return  prefix + generateModuleName(rest, { sourceExtension: '' });
    }

    const cwd = path.resolve(process.cwd()) + '/';
    const fullPath = path.resolve(path.dirname(importer), imported);

    return generateModuleName(fullPath.slice(cwd.length), options);
};
