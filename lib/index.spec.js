const {expect, Assertion} = require('chai');

const { transform, template, types: t } = require('babel-core');
const { default: generate } = require('babel-generator');
const esModulesToYm = require('../lib');

const generatorOpts = { quotes: 'single', compact: true };
const stringifyAst = ast => generate(ast, generatorOpts).code;

function transpile(filename, source, pluginOptions = {}) {
    return transform(source, {
        filenameRelative: filename,
        plugins: [esModulesToYm, pluginOptions],
        generatorOpts: generatorOpts
    });
}

describe('babel-plugin-transform-es2015-modules-ym', () => {
    it('should transpile simple module', () => {
        const actual = transpile('foobar.js', 'export default 0;');
        const expectedStr = `ym.modules.define('foobar',[],function(PROVIDE){PROVIDE(0);});`;

        const expectedAst = template(expectedStr)({ PROVIDE: t.identifier(actual.metadata.ym.provideName) });
        expect(actual.code).to.be.equal(stringifyAst(expectedAst));
    });
});
