var Module = require('module'),
	path = require('path'),

	// Are we on windows?
	win = path.sep === '\\',

	// Node require
	noderequire = function(dep, thisModule){
		//Call _load directly as we can't set this object for require.
		return Module._load(dep, thisModule);
	},

	// Named paths loaded from the config as 'name': 'path'
	paths = {},

	// Stack of paths used to load relative dependencies
	pathStack = [],

	// Stack of modules to let define access to its module
	defineModuleStack = [],

	// Stack of defines to know if we are inside a define method.
	defineStack = [],

	// The baseUrl setting of require.js translated to path. Overrided by the config method.
	basePath = path.dirname(process.mainModule.filename) + path.sep;
	publicPath = basePath + 'public' + path.sep;

	requireStack = [],
	defineValues = {},

	// AMD require
	amdrequire = function(deps, callback, thisModule){
		var dependencies = [];
		defineModuleStack.push(thisModule);

		deps.forEach(function(depName){
			//Get absolute path
			var depPath = resolveAmdPath(depName, thisModule),
				depExport = {}
			;

			//Normalize, no .js extension
			if(path.extname(depPath) == '.js')
				depPath = depPath.substring(0, depPath.length - 3);

			if(typeof Module._cache[depPath + '.js'] == 'undefined'){

				// Push the path as the id of this require. Define will use to store its output.
				requireStack.push(depPath);

				// Push the current path in case we needed to resolve more relative paths
				pathStack.push(path.dirname(depPath));
				noderequire(depPath, thisModule);
				pathStack.pop();

				depExport = defineValues[depPath];
				Module._cache[depPath + '.js'].exports = depExport;

				delete defineValues[depPath];

				requireStack.pop();
			}
			else {
				depExport = Module._cache[depPath + '.js'].exports;
			}

			//Add to the current dependencies
			dependencies.push(depExport);
		});
		defineModuleStack.pop();

		// Use the dependencies
		if(callback)
			return callback.apply(this, dependencies);
	},

	// Hybrid require ;)
	require = function(deps, callback){
		var depExports = {},
			thisModule = this && this.exports ? this : module
		;

		// Push the current path in case we needed to resolve more relative paths
		pathStack.push(path.dirname(thisModule.parent.filename));

		// AMD require
		if(Object.prototype.toString.call( deps ) === '[object Array]'){
			depExports = amdrequire(deps, callback, thisModule);
		}
		else { // Node require
			//If we are inside a define we can use require('string') notation to get amdrequire modules
			if(defineStack.length && paths[deps])
				deps = paths[deps];
			depExports = noderequire(deps, thisModule);
		}

		//Get out of this path
		pathStack.pop();

		return depExports;
	},

	// AMD module define
	define = function(deps, callback){
		var depName = requireStack[requireStack.length - 1],
			exp = {}
		;

		defineStack.push(depName);

		// AMD define
		if(Object.prototype.toString.call( deps ) === '[object Array]' && (typeof callback == 'function')){
			//Require all the dependencies
			exp = amdrequire(deps, callback, defineModuleStack[defineModuleStack.length - 1]);
		}
		// No dependencies, first arg as callback
		else if(!callback && typeof deps === 'function'){
			exp = deps();
		}
		// Define a module directly as an object
		else if(deps !== null && typeof deps === 'object'){
			exp = deps;
		}

		// Get out the define
		defineStack.pop();

		// Leave the value in teh defineValues for amdrequire
		defineValues[depName] = exp;
	},

	// Config function to reuse require.js named modules
	config = function(settings){
		if(settings.basePath)
			basePath = settings.basePath;
		if(settings.publicPath)
			publicPath = settings.publicPath;

		if(settings.paths){
			for (var depName in settings.paths){
				var depPath = settings.paths[depName],
					base = basePath;

				if(depPath[0] == '/'){ //Relative to the root url
					base = publicPath;
					depPath = depPath.substring(1);
				}

				//Normalize, no .js extension
				if(path.extname(depPath) == '.js')
					depPath = depPath.substring(0, depPath.length - 3);

				if(win)
					depPath = depPath.replace(/\//g, '\\');

				//Store absolute paths
				paths[depName] = path.resolve(base, depPath);
			}
		}
	},

	// Resolve amd require urls to absolute paths
	resolveAmdPath = function(request, thisModule){
		var start = request.substring(0, 2),
			filepath
		;
		if(request[0] == '/'){
			// Absolute url or absolute path in linux
			filepath = win ? request.substring(1).replace(/\//g, '\\') : request.substring(1);
			var lookupPaths = [path.dirname(request), path.dirname(path.resolve(publicPath, filepath))],
				requestName = path.basename(request, '.js')
			;

			// Let Node look up the path for us
			return Module._findPath(requestName, lookupPaths);
		}

		if (start !== './' && start !== '..' && start !== '.\\'){
			if(paths[request]){
				//Named require
				return paths[request];
			}

			filepath = win ? request.replace(/\//g, '\\') : request;
			//Either it is a windows absolute path or relative to the basePath
			var lookupPaths = [path.dirname(filepath), path.dirname(path.resolve(basePath, filepath))],
				requestName = path.basename(request, '.js')
			;
			// Let node look up the path for us
			return Module._findPath(requestName, lookupPaths);
		}

		// Relative path to the current one
		filepath = win ? request.replace(/\//g, '\\') : request;
		return path.resolve(pathStack[pathStack.length - 1], filepath);
	}
;

// Make AMD require available.
require.config = config;
Module.prototype.require = require;

// Let define be used in all modules
global.define = define;

module.exports = require;