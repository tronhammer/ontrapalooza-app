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

					page.bind();

					window.oplz.common.pages.display( page );
					window.oplz.common.route.loaded(); // todo: turn into a call to an event listener for loaded
				});
			} else {
				window.oplz.common.pages.display( page );
			}
		},
		"bind": function(){
			$("#page-container-splash").delegate(".oplz-splash-option-container", "click", function(){
				location.hash = "#!" + $(this).data("gotopage");
			});
		}
	});

	SplashPage.render();
});

//# sourceURL=/pages/splash/js/oplz.page.splash.js