const assert = require('assert');
const { transform, template, types: t } = require('babel-core');
const { default: generate } = require('babel-generator');
const plugin = require('../lib');

const generatorOpts = {
    quotes: 'single',   // Always single quotes for strings.
    compact: true       // Remove all insignificant whitespace.
};
const transformOpts = { plugins: [plugin], generatorOpts: generatorOpts };

function attempt(what, message) {
    try {
        return what();
    } catch (e) {
        assert.fail(message);
    }
}

function test(name, source, expected, babelOptions, extraPlugins, extraPlaceholders) {
    extraPlaceholders = extraPlaceholders || (() => ({}));

    const options = Object.assign({}, transformOpts, babelOptions);
    options.plugins = options.plugins.concat(extraPlugins || []);
    const actualProgram = transform(source, options);

    const body = actualProgram.ast.program.body;
    assert.equal(body.length, 1, `${name}: file has too many statements`);
    const provideIdentifier = attempt(() => body[0].expression.arguments[2].params[0], `${name}: has no provide`);

    const placeholders = Object.assign({ PROVIDE: provideIdentifier }, extraPlaceholders());
    for (let key in placeholders) {
        if (typeof placeholders[key] === 'string') {
            placeholders[key] = t.identifier(placeholders[key]);
        }
    }
    const expectedAst = template(expected)(placeholders);
    const actualCode = actualProgram.code;
    const expectedCode = generate(expectedAst, generatorOpts).code;

    if (actualCode !== expectedCode) {
        console.log(source);
        console.log(actualCode);
        console.log(expectedCode);
        assert.equal(actualCode, expectedCode, `${name} failed`);
    }
}

test('Simple module name',
    `export default 0;`,
    `ym.modules.define('ModuleName', [], function (PROVIDE) { PROVIDE(0); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('Nested module name',
    `export default 0;`,
    `ym.modules.define('a.b.c.d.e.ModuleName', [], function (PROVIDE) { PROVIDE(0); })`,
    { filenameRelative: 'a/b/c/d/e/ModuleName.esn.js' });

test('Nested module name with folder for module',
    `export default 0;`,
    `ym.modules.define('a.b.c.d.ModuleName', [], function (PROVIDE) { PROVIDE(0); })`,
    { filenameRelative: 'a/b/c/d/moduleName/ModuleName.esn.js' });

test('Nested module name with index filename',
    `export default 0;`,
    `ym.modules.define('a.b.c.d.moduleName', [], function (PROVIDE) { PROVIDE(0); })`,
    { filenameRelative: 'a/b/c/d/moduleName/index.esn.js' });

test('Simple transformation',
    `import foo from 'Foo'; export default foo.bar;`,
    `ym.modules.define('ModuleName', ['Foo'], function (PROVIDE, foo) { PROVIDE(foo.bar); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('Squash imports',
    `import foo from 'Foo'; import foo2 from 'Foo'; export default 0;`,
    `ym.modules.define('ModuleName', ['Foo'], function (PROVIDE, foo) { var foo2 = foo; PROVIDE(0); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('Multiple imports',
    `import foo from 'Foo'; import bar from 'Bar'; export default 0;`,
    `ym.modules.define('ModuleName', ['Foo', 'Bar'], function (PROVIDE, foo, bar) { PROVIDE(0); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('Empty imports',
    `import 'Foo'; import bar from 'Bar'; export default 0;`,
    `ym.modules.define('ModuleName', ['Bar', 'Foo'], function (PROVIDE, bar) { PROVIDE(0); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('Function declaration exports',
    `export default function foo(bar) {bar();};`,
    `ym.modules.define('ModuleName', [], function (PROVIDE) { function foo(bar){bar();} PROVIDE(foo); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('Anonymous function exports',
    `export default function(bar) {bar();}`,
    `ym.modules.define('ModuleName', [], function (PROVIDE) { PROVIDE(function(bar){bar();}); });`,
    { filenameRelative: 'ModuleName.esn.js' });

test('ym: dynamic provide',
    `import {provide} from 'ym'; setTimeout(function() { provide(0); }, 0);`,
    `ym.modules.define('ModuleName', [], function (PROVIDE) { setTimeout(function() { PROVIDE(0); }, 0); })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('ym: dynamic require',
    `import {require} from 'ym';
    require(['Foo'], function(foo){foo();});
    export default 0;`,
    `ym.modules.define('ModuleName', [], function (PROVIDE) {
        var require = ym.modules.require;
        require(['Foo'], function(foo){foo();});
        PROVIDE(0);
    })`,
    { filenameRelative: 'ModuleName.esn.js' });

test('ym: renaming',
    `import {require as r, provide as p} from 'ym';
    require(['Foo'], function(foo){p(foo());});`,
    `ym.modules.define('ModuleName', [], function (PROVIDE) {
        var r = ym.modules.require;
        require(['Foo'], function(foo){PROVIDE(foo());});
    })`,
    { filenameRelative: 'ModuleName.esn.js' });

let utilBarImportName = '';
test('file.importYmModule',
    `import Foo from 'foo';
    export default 0;`,
    `ym.modules.define('ModuleName', ['util.Bar', 'foo'], function (PROVIDE, UTILBAR, Foo) {
        PROVIDE(0);
    })`,
    { filenameRelative: 'ModuleName.esn.js' },
    [function ({ template, types: t }) {
        return { visitor: { Program() {
            utilBarImportName = this.file.importYmModule('util.Bar').name;
        } } };
    }],
    () => ({ UTILBAR: utilBarImportName }));
