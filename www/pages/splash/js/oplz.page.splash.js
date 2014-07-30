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
		"render": function(data){
			var page = window.oplz.common.pages.getCurrent();

			if (!page.template){
				$.get( page.paths.templates + "/oplz.splash.tmpl").done(function(tmpl){
					page.template = window.oplz.common.pages.build(page, tmpl);

					window.oplz.common.pages.embed( page );
					// $.get("fixtures/session_list.json").done(function(events){
					// 	var $container = $(".opz-main-column")
					// 	$.each(events, function(){
					// 		$container.append( new window.EventFeedItem(this) )
					// 	});
					// });

					window.oplz.common.route.loaded();
				});
			}
		}
	});

	SplashPage.render();
});

//# sourceURL=/js/pages/oplz.page.splash.js