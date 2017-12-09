const expect = require('chai').expect;
const normalizeImportName = require('./normalizeImportName');

describe('normalizeImportName', () => {
    it('should resolve relative paths', () => {
        expect(normalizeImportName('./foo', 'src/bar/qux/index.js', { sourceDir: 'src/' })).to.be.equal('bar.qux.foo');
    });

    it('should resolve global mappings', () => {
        const name = normalizeImportName('@api/foo', 'src/bar/index.js', {
            sourceDir: 'src/',
            sourceMappings: { '@api/': '' }
        });

        expect(name).to.be.equal('foo');
    });
});
