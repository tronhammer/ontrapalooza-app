
window.oplz = {
	"config": {
		"defaultRoute": "main"
	},

	"pages": {
		"loaded": {},
		"current": null,
		"next": null,
		"prev": null
	},

	"users": {
		"current": null
	},

	"events": {
		"current": null
	},

	"getData": function(callback){
		// this.common.ajax.getRoles({"role": "all"}, function(data){
		// 	window.oplz.common.users.load(data);
		// 	callback();
		// });

		callback();
	},

	"setupSession": function(){
		if (location.hash.match("sessid=")){
			this.common.ajax._builtIn.data.sessid = location.hash.split("sessid=")[1].split("&")[0];
		} else {
			window.oplz.common.ajax.login("tamara14", "TWeaver123", function(data){
				console.log(data);
				location.hash += (location.hash.indexOf("?") !== -1 ? "&" : "?") + "sessid="+data.data.id;
			});
		}
	},

	"start": function(){
		var _this = this;
		this.common.screen.detect();

		this.setupSession();

		this.getData(function(){
			_this.common.route.load();
		});
	}
};

window.oplz.common = {
	"route": {
		"loading": false,
		"getCurrent": function(){
			var hash = window.location.hash.split("#!");
			return !hash[1] ? window.oplz.config.defaultRoute : hash[1].split("?")[0];
		},

		"getParams": function(cached){
			var delim = location.hash.split("?");
			var params = {};
			if (cached && this.params){
				return this.params;
			} else{
				if (delim[1]){
					delim[1].split("&").map(function(v){
						var vs = v.split("=");
						params[vs[0]] = vs[1];
					});
				}
			}

			this.params = params;

			return params;
		},

		"load": function(){
			if (window.oplz.common.route.loading){
				return false;
			}

			this.loading = true;

			var params = this.getParams();
			var currentRoute = this.getCurrent();
			var page = window.oplz.pages.loaded[currentRoute];

			window.oplz.pages.prev = window.oplz.pages.current;
			window.oplz.pages.current = currentRoute;

			if (!page){
				$("body").append( 
					$("<script>").attr({
						"src": "pages/"+currentRoute+"/js/oplz.page."+currentRoute+".js", 
						"async": true 
					})
				);
			} else {
				page.render();
				this.loaded();
			}
		},

		"loaded": function(){
			this.loading = false;
		}
	},

	"pages": {
		"load": function(name, obj){
			window.oplz.pages.loaded[name] = obj;
			return obj;
		},
		"loadCSS": function(page){
			/**
			 * @todo Make this more dynamic
			 */
			var uris = [
				page.paths.css + "/oplz.page."+page.name+".layout.css",
				page.paths.css + "/oplz.page."+page.name+".layout."+window.oplz.common.screen.current+".css",
				page.paths.css + "/oplz.page."+page.name+".aesthetic.css",
				page.paths.css + "/oplz.page."+page.name+".aesthetic."+window.oplz.common.screen.current+".css"
			];

			for(var i=0; i<uris.length; i++){
				var uri = uris[i];
				if (document.createStyleSheet){
				    document.createStyleSheet(uri);
				} else {
				    $("<link/>")
				    	.appendTo("head")
				    	.attr({
				    		"type" : "text/css", 
				    		"rel": "stylesheet"
				    	})
				    	.attr("href", uri);
				}
			}
		},
		"getCurrent": function(){
			return window.oplz.pages.loaded[ window.oplz.pages.current ];
		},
		"parse": function(page, tmplString, data, withFunctions){
			var tmplTagOpenDeliminator = "{{";
			var tmplTagCloseDeliminator = "}}";
			var tmplTagEndDeliminator = "/";

			tmplString = tmplString.replace(/\r|\n/gim, " ");

			if (!$.isEmptyObject(data)){
				for(var dataKey in data){
					tmplString = tmplString.split(tmplTagOpenDeliminator+dataKey+tmplTagCloseDeliminator).join(data[dataKey]);
				}
			}

			if (withFunctions){
				var parseFunctions = $.extend({}, window.oplz.common.pages.parseFunctions, data);
				// tmplString = tmplString.replace(/\{\{(\w+) (\w+)\}\}(.*)(?!\{\{\/\1\}\})*/gim, function(fullMatch, keyName, keyID, content, pos, fullString){
				// 	return parseFunctions[keyName](page, data, keyID, content, pos, fullMatch, fullString);
				// });

				collectedFunctions = [];
				cleanTmplString = "";
				tmplStringDeliminated = tmplString.split( tmplTagOpenDeliminator )
				tmplStringDeliminated.map(function(matched, pos, arr){
					if (matched.substr(0,1) == tmplTagEndDeliminator) {
						var content = []; 
						var funcName = matched.split(tmplTagCloseDeliminator)[0].substring(1); 
						var args = {};
						for (var i=pos-1; i!=-1; i--){
							var arrItem = arr[i];
							if (arrItem.substring(0, funcName.length) == funcName){
								var argsSpace = arrItem.substr(funcName.length).split( tmplTagCloseDeliminator )[0];
								argsSpace.split("\" ").map(function(argPair, pos, arr){
									var argsSplit = argPair.split("=\"");
									var argKey = argsSplit[0];
									var argValue = argsSplit[1];
									args[ (pos === 0) ? argKey.trim() : argKey ] = (pos == arr.length - 1) ? argValue.substr(0, argValue.length - 1 ) : argValue;
								});

								content.push(arrItem.substr(funcName.length + argsSpace.length + tmplTagCloseDeliminator.length));
								break;
							} else {
								content.push(tmplTagOpenDeliminator + arrItem);
							}
						}

						collectedFunctions.push({
							"funcName": funcName,
							"content": content.reverse().join(""),
							"args": args,
							"startPos": i,
							"endPos": pos
						});
					}
				});

				tmplString = tmplStringDeliminated.map(function(matched, pos, arr){
					for(var i=0;i<collectedFunctions.length;i++){
						var func = collectedFunctions[i];
						if (pos == func.endPos){
							return parseFunctions[func.funcName](page, func.args, func.content) + matched.substr(tmplTagEndDeliminator.length + func.funcName.length + tmplTagCloseDeliminator.length);
						} else if (pos >= func.startPos && pos < func.endPos) {
							return "";
						}
					}

					return !pos ? matched : tmplTagOpenDeliminator + matched;
				}).join("").trim(" ");
			}

			return tmplString;
		},
		"parseFunctions": {
			"template": function(page, args, content){
				page.templates[ args.id ] = content;
				return "";
			}
		},
		"build": function(page, tmplString){

			tmplString = this.parse(page, tmplString, page.templateData, true);

			this.loadCSS(page);

			return $("<div>").attr({
				"id": "page-container-" + page.name
			}).append($(tmplString));
		},
		"embed": function(page){
			$("#oplz-primary-container").append( page.template.hide() );
		},
		"display": function(page){
			$("#oplz-primary-container").children().hide().filter("#page-container-" + page.name).show();
		}

	},
	"screen": {
		"current": null,
		"sizes": {
			"desktop": 5,
			"bigTablet": 4,
			"smallTablet": 3,
			"bigPhone": 2,
			"smallPhone": 1,
		},
		"detect": function(type, operation){
			var params = window.oplz.common.route.getParams();
			var winWidth = $(window).width();
			var sizeID = 0;
			var screen = window.oplz.common.screen;

			operation = operation || "=";

			/* Large desktops and laptops */
			if (winWidth >= 1200) {
				sizeID = 5;
			}

			/* Portrait tablets and medium desktops */
			else if (winWidth >= 992 && winWidth <= 1199) {
				sizeID = 4;
			}

			/* Portrait tablets and small desktops */
			else if (winWidth >= 768 && winWidth <= 991) {
				sizeID = 3;
			}

			/* Landscape phones and portrait tablets */
			else if (winWidth <= 767) {
				sizeID = 2;
			}

			/* Landscape phones and smaller */
			else if (winWidth <= 480) {
				sizeID = 1;
			}


			if (params.platform && screen.sizes[ params.platform ]){
				screen.current = params.platform;
			} else if (screen.sizes[ screen.current ] !== sizeID){
				for(var size in screen.sizes){
					if (screen.sizes[ size ] === sizeID){
						screen.current = size;
					}
				}
			}


			if (type && operation){
				if (operation == "="){
					return screen.sizes[type] === sizeID;
				} else if (operation == ">="){
					return screen.sizes[type] <= sizeID;
				} else if (operation == "<="){
					return screen.sizes[type] >= sizeID;
				} else if (operation == ">"){
					return screen.sizes[type] < sizeID;
				} else if (operation == "<"){
					return screen.sizes[type] > sizeID;
				}
			}

			return sizeID;
		}
	},
	"schedule": {
		"daysOfWeek": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
	},
	"ajax": {
		"_builtIn": {
			"data": {
				"uri": {
					"base": "http://api.ontrapalooza.com/",
					"cache": "cache/"
				}
			},
			"cache": {},
			"buildCacheKey": function(uri, data){
				var cacheKey = uri;
				for (var dataKey in data){
					cacheKey += "_"+dataKey;
				}
				return cacheKey;
			},
			"request": function(method, uri, params, callback, data, cached, cache){
				var cacheKey = this.buildCacheKey( uri + "?action=" + params.action, params);

				data = data || {};
				cache = cache !== undefined ? cache : true;

				params["sessid"] = this.data.sessid;

				if (cached && this.cache[ cacheKey ]){
					return $.Deferred(function(defer){
						callback( $.extend({}, this.cache[ cacheKey ], data) );
						defer.resolve();
					});
				} else {
					return $.ajax({
						"url": uri,
						"type": method,
						"crossDomain": true,
						"xhrFields": {
							"withCredentials": true
						},
						"cache": false,
						"data": params
					}).done(function(response){
						data["data"] = typeof response == "string" ? JSON.parse(response).data : response;

						if (cache){
							window.oplz.common.ajax._builtIn.cache[cacheKey] = data;
						}

						if ($.isFunction(callback)){
							callback(data);
						}
					});
				}

			},

			"post": function(action, params, callback, data, cached, cache){
				params["action"] = action;
				return this.request("post", this.data.uri.base, params, callback, data, cached, cache);
			},

			"get": function(action, params, callback, data, cached, cache){
				params["action"] = action;
				return this.request("get", this.data.uri.base, params, callback, data, cached, cache);
			},

			"getCached": function(fileName, callback, data, cached, cache){
				return this.request("get", this.data.uri.cache + fileName + ".json", {}, callback, data, cached, cache);
			}
		},

		"tools": {
			"_requestLoading": [],
			"_requestLoaded": function(data){
				var requestLoading = window.oplz.common.ajax.tools._requestLoading[ data._requestGroupData.requestLoadingID ]

				// way to do splice but much faster
				// move last entry into position where this request name exists, then pop the last since it's now a dup
				requestLoading[ requestLoading.indexOf(data._requestGroupData.requestGroupName) ] = requestLoading[ requestLoading.length - 1];
				requestLoading.pop();

				if (!requestLoading.length){
					var callback = data._requestGroupData.callbacks.finished;

					data.results = data._requestGroupData.callbacks.results;

					delete window.oplz.common.ajax.tools._requestLoading[ data._requestGroupData.requestLoadingID ];
					delete data._requestGroupData;

					callback(data);
				}
			},
			"_groupCallbackWrapper": function(data){
				var callbacks = data._requestGroupData.callbacks.each;
				
				data._requestGroupData.callbacks.results[ data._requestGroupData.requestName ] = data.data;
				
				for(var reservedCallback in callbacks){
					callbacks[reservedCallback](data);
				}
			},
			/**
				EXAMPLE
				oplz.common.ajax.tools.group({
					"getRoles": [{"role": "all"}, _this.common.users.load ]
					"getEvents": [{}, function(data){ console.log("getEvents data: ", data); }],
				}, {
					"finished": function(data){ 
						console.log("WE'RE DONE!", data.results.getRoles);
					}
				});
			*/
			"group": function(requestGroup, callbacks){
				var requestLoadingID = this._requestLoading.push(Object.keys(requestGroup)) - 1;
				var context = window.oplz.common.ajax;

				for (var requestName in requestGroup){
					var requestFunc = window.oplz.common.ajax[requestName];
					var requestParams = $.isArray(requestGroup[requestName]) ? requestGroup[requestName] : [];
					var callback = requestParams[1];
					var data = requestParams[2];

					if (!data){
						data = requestParams[2] = {};
					}

					data._requestGroupData = {
						"callbacks": $.extend({
							"each": $.merge([callback, this._requestLoaded], callbacks.each || []),
							"results": {}
						}, callbacks),
						"requestName": requestName,
						"requestGroup": requestGroup,
						"requestLoadingID": requestLoadingID
					}

					requestParams[1] = this._groupCallbackWrapper;

					requestFunc.apply(context, requestParams);
				}
			}
		},

		"login": function(username, password, callback){
			return this._builtIn.post("login", {
				"username": username,
				"password": password
			}, callback, {}, false, false);
		},

		"getRoles": function(params, callback, data, cached){
			cached = cached !== undefined ? cached : true;
			return this._builtIn.get("GetRoleList", $.extend({
				"role": "all"
			}, params), callback, data, cached );
		},

		"getAttendees": function(params, callback, data, cached){
			cached = cached !== undefined ? cached : true;
			return this._builtIn.get("GetRoleList", $.extend({
				"role": "attendee"
			}, params), callback, data, cached );
		},

		"getSpeakers": function(params, callback, data, cached){
			cached = cached !== undefined ? cached : true;
			return this._builtIn.get("GetRoleList", $.extend({
				"role": "speaker"
			}, params), callback, data, cached );
		},

		"getGoing": function(params, callback, data, cached){
			return this._builtIn.get("GetGoingList", params, callback, data, cached );
		},

		"getActive": function(params, callback, data, cached){
			return this._builtIn.get("GetActiveList", params, callback, data, cached );
		},

		"addAttendingEvent": function(params, callback, data, cached){
			return this._builtIn.post("UserAddAttendingEvent", params, callback, data, cached );
		},

		"removeAttendingEvent": function(params, callback, data, cached){
			return this._builtIn.post("UserRemoveAttendingEvent", params, callback, data, cached );
		},

		/**
		 * Ontrapalooza API
		 */
		
		"getUsers": function(params, callback, data, cached){
			var _this = this;
			return this._builtIn.getCached("OntrapaloozaAPI.GetUsers", callback, data, cached)
					.fail(function(){
						_this._builtIn.get("GetUsers", $.extend(params, {
							"api": "OntrapaloozaAPI"
						}), callback, data, cached );
					});
		},

		"getEvents": function(params, callback, data, cached){
			var _this = this;
			return this._builtIn.getCached("OntrapaloozaAPI.GetEvents", callback, data, cached)
					.fail(function(){
						_this._builtIn.get("GetEvents", $.extend(params, {
							"api": "OntrapaloozaAPI"
						}), callback, data, cached );
					});
		},
	},
	"users": {
		"defaults": {
			"avatar": "/app/style/images/unknownUser.png"
		},
		"load": function(users){
			window.oplz.users = $.extend(window.oplz.users, users);
		},
		"get": function(id){
			var users = window.oplz.users.all;
			return id ? users[ id ] : users;
		}
	},
	"events": {
		"defaults": {},
		"load": function(events){
			window.oplz.events = $.extend(window.oplz.events, events);
		},
		"get": function(id){
			var events = window.oplz.events.all;
			return id ? events[ id ] : events;
		}
	}
}

$(function(){
	window.oplz.start();
});
