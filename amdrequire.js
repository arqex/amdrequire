var Module = require('module'),
	path = require('path'),
	win = path.sep === '\\',
	noderequire = function(dep, module){
		//Call _load directly as we can't set this object for require.
		return Module._load(dep, module);
	},
	paths = {},

	//Win also understand '/' as directory separator
	basePath = path.dirname(process.mainModule.filename) + path.sep;

	requireStack = [],
	amdCache = {},

	amdrequire = function(deps, callback){
		var dependencies = [];
		deps.forEach(function(dep){
			console.log('dep ' + dep);
			var depPath = resolveAmdPath(dep);
			if(typeof Module._cache[dep] == 'undefined'){
				var filepath = paths[dep] ||
				console.log('inside amdrequire ' + dep);
				requireStack.push(dep);

				noderequire(depPath);
				console.log('DEPPATH ' + depPath + '.js');
				//console.log(Module._cache);
				console.log(Module._cache[depPath + '.js']);
				console.log(amdCache[dep]);
				Module._cache[depPath + '.js'].exports = amdCache[dep];
				console.log(Module._cache[depPath + '.js']);
			}
			//console.log(Module._cache[dep]);
			dependencies.push(amdCache[dep]);
		});
		if(callback)
			callback.apply(this, dependencies);
	},

	require = function(deps, callback){
		if(Object.prototype.toString.call( deps ) === '[object Array]'){
			console.log('amdrequire ' + deps);
			return amdrequire(deps, callback);
		}

		var thisModule = this && this.exports ? this : module;
		return noderequire(deps, thisModule);
	},
	define = function(deps, callback){
		var depName = requireStack[requireStack.length - 1],
			exp = {}
		;

		console.log('Using define');
		if(typeof deps == 'function')
			exp = callback.call(require, module.exports, module);
		else if(Object.prototype.toString.call( deps ) === '[object Array]' && (typeof callback == 'function')){
			exp = callback();
		}
		else if(deps !== null && typeof deps === 'object'){
			console.log('Object require ' + deps);
			exp = deps;
		}

		console.log('Define ' + depName + ': ');
		console.log(exp);
		amdCache[depName] = exp;
	},
	config = function(settings){
		if(settings.paths)
			paths = settings.paths;
		if(settings.baseUrl)
			basePath = settings.baseUrl;
	},

	resolveAmdPath = function(request){
		var start = request.substring(0, 2), filepath;
		if (start !== './' && start !== '..' && start !== '.\\'){
			if(paths[request]){
				//Named require
				filepath = paths[request];
				if(win)
					filepath.replace(/\//g, '\\');
				console.log('Named require ' +  filepath);
				return resolveAmdPath(filepath);
			}

			//Absolute path
			filepath = win ? request.replace(/\//g, '\\') : request;
			console.log('Resolving absolute path ' + filepath);
			return filepath;
		}

		filepath = win ? request.replace(/\//g, '\\') : request;
		console.log('Resolving ' + request + ' to ' + path.resolve(basePath, filepath));
		return path.resolve(basePath, filepath);
	}
;

console.log("SEPARATOR: " + path.sep);
console.log("SEPARATOR: " + (path.sep === '\\'));
console.log(basePath);

//Make AMD require available.
require.config = config;
Module.prototype.require = require;
global.define = define;

//console.log(process.mainModule);

module.exports = require;