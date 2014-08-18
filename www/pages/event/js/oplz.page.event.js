$(function(){
	var EventPage = window.oplz.common.pages.load("event", {
		"name": "event",
		"active": true,
		"template": undefined,
		"paths": {
			"templates": "pages/event/templates",
			"js": "pages/event/js",
			"css": "pages/event/style/css"
		},
		"templateData": {},
		"pageData": {
			"defaults": {},

			"currentEventID": null
		},
		"render": function (data){
			var page = this;
			var params = oplz.common.route.getParams();

			if (!params["event"]){
				history.back();
			}

			this.pageData.currentEventID = params["event"];

			page.getData(function (data){
				window.oplz.common.events.load(data.data);

				var event = page.pageData.event = window.oplz.common.events.get( page.pageData.currentEventID );

				$.extend(page.templateData, {
					"eventDate": event.event_start_weekday + ", " + event.event_start_month_short +" "+ event.event_start_day,
					"eventName": event.name,
					"eventDescription": event.description,
					"eventImage": event.media_url
				});

				if (!page.template){
					/**
					 * @todo Change uri to dynamically select template based on screen.
					 */
					
					$.get( page.paths.templates + "/oplz.event."+window.oplz.common.screen.current+".tmpl").done(function (tmpl){
						page.templateString = tmpl;
						page.template = window.oplz.common.pages.build(page, tmpl);

						window.oplz.common.pages.embed( page );

						window.oplz.common.pages.display( page );

						page.bind();

						window.oplz.common.route.loaded(); // todo: turn into a call to an event listener for loaded
					});
				} else {
					window.oplz.common.pages.display( page );
				}
			});
		},

		"getData": function(callback){
			window.oplz.common.ajax.getEvents({}, callback);
		},

		"bind": function(){
			// $("#page-container-event").delegate(".oplz-event-option-container", "click", function(){
			// 	location.hash = "#!" + $(this).data("gotopage");
			// });
		}
	});

	EventPage.render();
});

//# sourceURL=/js/pages/event/js/oplz.page.events.js