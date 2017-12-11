const {expect, Assertion} = require('chai');

const { transform, template, types: t } = require('babel-core');
const { default: generate } = require('babel-generator');
const esModulesToYm = require('../lib');

const generatorOpts = { quotes: 'single', compact: true };

function transpile(filename, source, extraPlugins = []) {
    return transform(source, {
        filenameRelative: filename,
        plugins: [ [esModulesToYm, { sourceDir: 'src/' } ], ...extraPlugins],
        generatorOpts: generatorOpts
    });
}

function adapt(metadata, source) {
    const nodes = { PROVIDE: metadata.ym.provideIdentifier };
    for (const singleImport of metadata.ym.imports) {
        const key = 'IMPORT_' + singleImport.module.toUpperCase().replace(/\./g, '_');
        nodes[key] = singleImport.local;
    }

    const ast = template(source)(nodes);
    return { ast: ast, code: generate(ast, generatorOpts).code };
}

describe('babel-plugin-transform-es2015-modules-ym', () => {
    it('should transpile simple module', () => {
        const actual = transpile('src/main.js', 'export default 0;');
        const expected = adapt(actual.metadata, `ym.modules.define('main', [], function(PROVIDE) { PROVIDE(0); });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should import static modules', () => {
        const actual = transpile('src/root/main.js', `import './static'; export default 0;`);
        const expected = adapt(actual.metadata,
            `ym.modules.define('root.main', ['root.static'], function(PROVIDE) { PROVIDE(0); });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should allow empty imports', () => {
        const actual = transpile('src/root/main.js', `import foo from './foo.css'; export default foo.value;`);
        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', ['root.foo.css'], function(PROVIDE, foo) {
                PROVIDE(foo.value);
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should squash same imports', () => {
        const actual = transpile('src/root/main.js', `
            import foo from './foo';
            import foo2 from './foo';
            export default foo.value + foo2.value;`);
        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', ['root.foo'], function(PROVIDE, foo) {
                var foo2 = foo;
                PROVIDE(foo.value + foo2.value);
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should import multiple modules', () => {
        const actual = transpile('src/root/main.js', `
            import foo from './foo';
            import bar from './bar';
            export default foo.value + bar.value;`);
        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', ['root.foo', 'root.bar'], function(PROVIDE, foo, bar) {
                PROVIDE(foo.value + bar.value);
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should allow named function exports', () => {
        const actual = transpile('src/root/main.js', `export default function foobar() { done(); };`);
        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', [], function(PROVIDE) {
                function foobar() {
                    done();
                }
                PROVIDE(foobar);
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should allow anonymous function exports', () => {
        // TODO: comma at the end for some reason duplicates.
        const actual = transpile('src/root/main.js', `export default function() { done(); }`);
        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', [], function(PROVIDE) {
                PROVIDE(function() { done(); });
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should allow to import provide directly from ym', () => {
        const actual = transpile('src/root/main.js', `
            import { provide } from 'ym';
            setTimeout(() => provide(0), 5000);`);

        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', [], function(PROVIDE) {
                setTimeout(() => PROVIDE(0), 5000);
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should allow to import require directly from ym', () => {
        const actual = transpile('src/root/main.js', `
            import { require } from 'ym';
            export default function() {
                require('foo.bar', function() { done(); });
            }`);

        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', [], function(PROVIDE) {
                var require = ym.modules.require;
                PROVIDE(function() {
                    require('foo.bar', function() { done(); });
                });
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });

    it('should allow to rename provide and require from ym', () => {
        const actual = transpile('src/root/main.js', `
            import { provide as p, require as r } from 'ym';
            r('foo.bar', function() { p(0); });`);

        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', [], function(PROVIDE) {
                var r = ym.modules.require;
                r('foo.bar', function() { PROVIDE(0); });
            });`);


        expect(actual.code).to.be.equal(expected.code);
    });

    it('should provide file.ym.addImport', () => {
        const actual = transpile('src/root/main.js', `export default 0;`, [
                function ({ template, types }) {
                    return { visitor: { Program() { this.file.ym.addImport('util.foo.bar'); } } }
                }
            ]);
        const expected = adapt(actual.metadata, `
            ym.modules.define('root.main', ['util.foo.bar'], function(PROVIDE, IMPORT_UTIL_FOO_BAR) {
                PROVIDE(0);
            });`);

        expect(actual.code).to.be.equal(expected.code);
    });
});
