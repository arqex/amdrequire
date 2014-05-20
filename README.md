amdrequire
==========
AMDrequire is NPM package that makes Node understand modules defined in AMD format. When using AMDrequire it is possible to define a module like this.

**world.js**
```javascript
define([], function() {
	return "world";
});
````
And use it like an usual AMD module.
```javascript
require(['world.js'], function(world){
	console.log('Hello ' + world); //Outputs a brand new "Hello world"
});
```

AMDrequire also respect node module definitions, so it is still possible to load node modules as usual
```javascript
var moduleExports = require('module');
```

Making Node understand both formats let the developer **reuse browse code** in the server without modifications, basically **require.js** modules, and write modules directly to be used in both places.

## License
Licensed under BSD-2. [See license](https://raw.githubusercontent.com/arqex/amdrequire/master/LICENSE)

## How to install
Using npm you only need to type in the console
```
npm install amdrequire
```

## How to use
AMDrequire overrides Node's require function to check whether a request of an AMD or Node module is happening, so it is recommended to require it in the first line of your application's main file.
```javascript
require = require('amdrequire');
```
Once AMDrequire is initialized, the require function will understand AMD ```require```s and ```define```s in every module, no more set up needed.

## How to configure
The configuration is really similar to the **require.js** one, the first require object has a ```config``` method that accepts a ```paths``` attribute to define the named requires:
```javascript
require = require('amdrequire');
require.config({
	paths: {
		'world': 'somedir/world'
	}
	basePath: __dirname + '/public/assets/js',
	publicPath: __dirname + '/public'
});
```
Using the example above, when calling ```require(['world'])``` AMDrequire will look up the module in the file ```public/assets/js/somedir/world.js``` relative to the current dir.
**The config method is only available when AMDrequire is required for the first time**, and not in other modules.

Let's have a look at the options of the config method:
### paths
Defines some named requires, so to use those modules it is not needed to write their full path, just the name defined here. The paths are relative to the basePath attribute.

**Note**: This named requires only affects to AMD ```require```s so you won't be able to call ```require('world')``` outside a ```define`` to get the *world* module.
### basePath
The ```basePath``` option set the root directory for AMD requires. All the relative paths used in AMD's ```require``` and ```define``` calls, that don't start with ```./``` or ```../``` will be relative to this directory. It is equivalent to **require.js** ```baseUrl``` option, so it should point to the local path of that URL.
### publicPath
Defines the path of the root URL directory. In the browser it is possible to require modules using root routes, they start with a slash ```/``` like ```/route/from/the/root```. ```publicPath``` tells what is the equivalent to that ```/``` route to AMDrequire, so it can handle this kind of requires.

## Some tips
### Reusing require.js configuration
It is possible to reuse the configuration object used for require directly with AMDrequire, so you can define your module paths in one site. The easiest way is creating a module with that data:

**config.js**
```javascript
define({
	path:{
		'hello': 'path/to/hello',
		'world': 'way/to/get/the/world'
	},
	baseUrl: '/js'
	// Some more require.js configuration
});
```
Yes, with require.js it is possible to define modules as objects using the object as the first parameter, and yes, AMDrequire knows about it, so you can use that module to config AMDrequire this way:
```javascript
require = require('amdrequire');
require(['config.js'], function(config){
	// Set basepaths first
	config.basePath = __dirname + '/public/js';
	config.publicPath = __dirname + '/public';
	require.config(config);
});
```
### Using AMD modules as Node modules
When an AMD module is required once, its exported value is stored in the cache like any other Node module, so you can require it using Node notation and the module path:

```javascript
require(['world'], function(world){
	// ...do any stuff
});

var world = require('path/to/world');
console.log('Hello ' + world); // Will output "Hello world"
```

However, you can't require an AMD module using its name, unless you are inside a ```define``` function.
```javascript

require(['world'], function(world){
	// ...do any stuff
});

require(__dirname + '/path/to/world'); // world
require('world'); // fail!!
```
```javascript
define([], function(){
	// This will return the result if the 'world' module
	// has been required before.
	var world = require('world');
});
```

### AMDrequire modules are not asynchronous
In case you don't know, AMD stands for Asynchronous Module Definition, but since AMDrequire is using Node's ```require``` function to get their modules, their fetching is actually synchronous. It is possible to make code like this:

```javascript
var mundo;
require(['world'], function(world){
	mundo = world;
});
console.log('Hello ' + mundo);
// Outputs "Hello world" because the code inside the require
// callback is always executed before this line.
```

## What's next?
AMD has just born and I am sure there are lots of ways of improve it. Feel free to fork it and make pull requests. These are some ideas.

### Shims
**require.js** allows third party libraries to be used as modules exporting some variable as the return of the module. They are called [shims](http://requirejs.org/docs/api.html#config-shim) and AMDrequire doesn't support them yet.

### require protocol paths
**require.js** allows to load files using protocols, like 'http' or 'https'. AMDrequire doesn't support this feature and using protocols will lead to errors.

I am not sure if load external files is a good idea in Node apps, but I am sure that if protocol and domain matches our protocol and domain AMDrequire should work as if the require was local and it is not working like this yet.

I personally would recommend always using relative paths instead of complete URLs.

### More testing
There is a small node app to test AMDrequire called [amdrequire-test](https://github.com/arqex/amdrequire-test). It tests the different ways that require.js load the files, but I am sure that those tests can be improved. Also, testing possible Node and AMD require conflicts would be great.

### Plugins
No plugins are yet supported. I haven't investigated about how to do it, but it would be great to give universal require.js plugin support. If complete plugin support is not possible, at least would be great to have [text plugin support](https://github.com/requirejs/text).

### Named defines
AMDrequire doesn't support named defines as they appeare in the [require.js docs](http://requirejs.org/docs/api.html#modulename). It shouldn't be difficult to support them.

## References
This piece of code has been developed with one eye on the [Node's module source code](https://github.com/joyent/node/blob/master/lib/module.js) and the other on the [require.js documentation](http://requirejs.org/docs/api.html).

If you want to know more about javascript modules implementation [Addy Osmani's writing modular js article](http://addyosmani.com/writing-modular-js/) is a must.