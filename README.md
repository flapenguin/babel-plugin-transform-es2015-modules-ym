# babel-plugin-transform-es2015-modules-ym

> This plugin transforms ES2015 modules to [ym](https://github.com/ymaps/modules).

## Example

**In**
```javascript
// MyModule.esn.js
import id from 'util.id';
export default id.gen();
```

**Out**
```javascript
ym.modules.define('MyModule', ['util.id'], function (_provide, id) {
  _provide(id.gen());
});
```

**In**
```javascript
import {require, provide as ppp} from 'ym';
require(['foo.bar'], function (Bar) {
  ppp(new Bar());
});
```

**Out**
```javascript
ym.modules.define('MyModule', ['util.id'], function (ppp) {
  var require = ym.modules.require;
  require(['foo.bar'], function (Bar) {
    ppp(new Bar());
  });
});
```

## Supported features

- default `import`'s;
- single `export default` per module;
- special module `'ym'` with `require`, `provide` and `logger` inside;
- asynchronous export with `provide` from `'ym'` module.

## Usage

`.babelrc`:
```json
{
  "plugins": [
    ["transform-es2015-modules-ym", {
      "sourceExtension": ".es6.js"
    }]
  ]
}
```

If you're using `env` preset, set `modules` to `false` to prevent it from generating `commonjs` modules by default (see https://babeljs.io/docs/plugins/preset-env/#optionsmodules):
```json
{
  "preset": [
    ["env", {
      "modules": false
    }]
  ]
}
```
