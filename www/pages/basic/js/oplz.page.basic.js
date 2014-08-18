$(function(){
	var SplashPage = window.oplz.common.pages.load("splash", {
		"name": "splash",
		"active": true,
		"template": undefined,
		"paths": {
			"templates": "pages/splash/templates",
			"js": "pages/splash/js",
			"css": "pages/splash/style/css"
		},
		"templateData": {
		},
		"pageData": {
			"defaults": {}
		},
		"render": function (data){
			var page = this;

			if (!page.template){
				/**
				 * @todo Change uri to dynamically select template based on screen.
				 */
				$.get( page.paths.templates + "/oplz.myschedule."+window.oplz.common.screen.current+".tmpl").done(function (tmpl){
					page.templateString = tmpl;
					page.template = window.oplz.common.pages.build(page, tmpl);

					window.oplz.common.pages.embed( page );

					window.oplz.common.pages.display( page );

					page.getData(function (data){
						page.bind();
					});

					window.oplz.common.route.loaded(); // todo: turn into a call to an event listener for loaded
				});
			} else {
				window.oplz.common.pages.display( page );
			}
		},

		"getData": function(callback){
			var _this = this;
			cached = cached !== undefined ? cached : true;

			oplz.common.ajax.tools.group({
				"getEvents": [{}, function(data){
					window.oplz.common.events.load(data.data);
				}, {}, cached ],
				"getUsers": [{}, function(data){
					window.oplz.common.users.load(data.data)
					window.oplz.me = window.oplz.common.users.get( window.oplz.users.usernames["tamara14"] );
				}, {}, cached ]
			}, {
				"finished": callback
			});
		},

		"bind": function(){
			// $("#page-container-splash").delegate("", "click", function(){});
		}
	});

	SplashPage.render();
});