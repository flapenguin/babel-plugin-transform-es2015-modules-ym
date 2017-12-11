const expect = require('chai').expect;
const generateModuleName = require('./generateModuleName');

describe('generateModuleName', () => {
    it('should work with defaults', () => {
        expect(generateModuleName('a/b/c.js')).to.be.equal('a.b.c');
    });

    it('should understand index.js', () => {
        expect(generateModuleName('a/b/c/index.js')).to.be.equal('a.b.c');
    });

    it('should understand capitalized names', () => {
        expect(generateModuleName('a/b/module/Module.js')).to.be.equal('a.b.Module');
    });

    it('should understand sourceDir', () => {
        expect(generateModuleName('./src/a/b/c.js', { sourceDir: './src/' })).to.be.equal('a.b.c');
        expect(generateModuleName('./src/a/b/c.js', { sourceDir: 'src' })).to.be.equal('a.b.c');
        expect(generateModuleName('src/a/b/c.js', { sourceDir: './src/' })).to.be.equal('a.b.c');
        expect(generateModuleName('src/a/b/c.js', { sourceDir: 'src/' })).to.be.equal('a.b.c');
        expect(generateModuleName('./src/inner/folders/a/b/c.js', { sourceDir: './src/inner/folders' })).to.be.equal('a.b.c');
    });

    it('should understand moduleBase', () => {
        expect(generateModuleName('src/a/b/c.js', { sourceDir: 'src/', moduleBase: 'base' }))
            .to.be.equal('base.a.b.c');
    });

    it('should not collapse index or Capitalized with moduleBase', () => {
        expect(generateModuleName('index.js', { moduleBase: 'base' })).to.be.equal('base.index');
        expect(generateModuleName('Base.js', { moduleBase: 'base' })).to.be.equal('base.Base');
    });
});
