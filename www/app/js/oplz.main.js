window.oplz = {
	"config": {
		"defaultRoute": "splash"
	},
	"pages": {
		"loaded": {},
		"current": undefined,
		"next": undefined,
		"prev": undefined,
	}
};

window.oplz.common = {
	"route": {
		"loading": false,
		"getCurrent": function(){
			return window.location.hash.split("#!")[1] || window.oplz.config.defaultRoute;
		},

		"load": function(){
			if (window.oplz.common.route.loading){
				return false;
			}

			window.oplz.common.route.loading = true;

			var currentRoute = window.oplz.common.route.getCurrent();

			window.oplz.pages.prev = window.oplz.pages.current;
			window.oplz.pages.current = currentRoute;

			if (!window.oplz.pages.loaded[currentRoute]){
				$("body").append( 
					$("<script>").attr({
						"src": "pages/"+currentRoute+"/js/oplz.page."+currentRoute+".js", 
						"async": true 
					})
				);
			} else {
				var page = window.oplz.common.pages.getCurrent();

				page.render();
			}
		},

		"loaded": function(){
			window.oplz.common.route.loading = false;
		}
	},

	"pages": {
		"load": function(name, obj){
			window.oplz.pages.loaded[name] = obj;
			return obj;
		},
		"loadCSS": function(page){
			var uri = page.paths.css + "/oplz.page."+page.name+".css";
			
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
		},
		"getCurrent": function(){
			return window.oplz.pages.loaded[ window.oplz.pages.current ];
		},
		"build": function(page, tmpl){

			window.oplz.common.pages.loadCSS(page);

			return $("<div>").attr({
				"id": "page-container-" + page.name
			}).append($(tmpl));
		},
		"embed": function(page){
			$("#oplz-primary-container").append( page.template );
		}
	}
}

$(function(){
	window.oplz.common.route.load();
});
