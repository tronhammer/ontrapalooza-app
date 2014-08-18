
/**
 * [description]
 * @return {[type]}
 */
$(function () {
	var MySchedulePage = window.oplz.common.pages.load("myschedule", {
		"name": "myschedule",
		"active": true,
		"template": undefined,
		"templates": {},
		"paths": {
			"templates": "pages/myschedule/templates",
			"js": "pages/myschedule/js",
			"css": "pages/myschedule/style/css"
		},
		"templateData": {
		},
		"pageData": {
			"defaults": {
				"miniMenuCurrentDay": "wednesday"
			},

			"miniMenuCurrentDay": null
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

						page.scheduleRenderData();

						page.miniMenuRenderData();

						page.recentSpeakersRenderData();
					});

					window.oplz.common.route.loaded(); // todo: turn into a call to an event listener for loaded
				});
			} else {
				window.oplz.common.pages.display( page );
			}
		},

		"getData": function (callback, cached){
			var _this = this;
			cached = cached !== undefined ? cached : true;

			oplz.common.ajax.tools.group({
				"getEvents": [{}, function(data){
					window.oplz.common.events.load(data.data);
				}, {}, cached ],
				"getUsers": [{}, function(data){
					window.oplz.common.users.load(data.data)
					window.oplz.me = window.oplz.common.users.get( window.oplz.users.usernames["tamara14"] );
				}, {}, cached ],
				"getActive": [{}, function(data){
					_this.pageData.recentSpeakers = data.data;
				} ]
			}, {
				"finished": callback
			});
		},

		"bind": function (){
			var _this = this;
			this.template
				.delegate(".oplz-myschedule-mini-menu-option", "click", function (){
					_this.pageData.miniMenuCurrentDay = $(this).data("eventday");

					$(this).addClass("selected").siblings().removeClass("selected");

					_this.miniMenuSelectDay();
				})
		},

		"selectAttendingEvents": function(){
			this.template.find(".oplz-myschedule-timeslot-event").removeClass("selected")
				.filter(function(pos, item){
					return window.oplz.me.attending.indexOf( $(item).data("eventkey").toString() ) !== -1 ? item : undefined;	
				}).addClass("selected");
		},

		"scheduleLoadData": function(){
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var events = window.oplz.events.chron[eventDay];
			var storage = this.pageData[eventDay] || (this.pageData[eventDay]={});
			var schedule = storage.schedule || (storage.schedule=window.oplz.events.chron[eventDay]);

			return storage;
		},

		"scheduleRenderData": function (reload){
			var storage = window.oplz.events.chron;
			var $template = this.template;
			var $eventDayContainers = this.template.find(".oplz-myschedule-schedule-tab-content");
			var timeSlotsHTML = "";
			var eventRowsHTML;

			for(var eventDay in storage){
				var daySchedule = storage[ eventDay ];

				for(var eventTime in daySchedule){
					var eventIDs = daySchedule[ eventTime ];
					var currentDay = null;
					var timeSlotHTML = "";
					
					for(var pos in eventIDs){
						var event = window.oplz.common.events.get( eventIDs[pos] );

						timeSlotHTML += window.oplz.common.pages.parse( this, this.templates["scheduleTimeSlotEventContainer"], {
							"name": event.name,
							"key": event.event_key
						});
					}

					timeSlotsHTML += window.oplz.common.pages.parse( this, this.templates["scheduleTimeSlot"], {
						"time": eventTime,
						"events": timeSlotHTML
					});
				}

				eventRowsHTML = window.oplz.common.pages.parse( this, this.templates["eventTypeContainer"], {
					"date": event.event_start_weekday + ", " + event.event_start_month_short +" "+ event.event_start_day,
					"content": timeSlotsHTML
				});

				$eventDayContainers.filter("[data-tabKey='"+eventDay+"']").html( eventRowsHTML );
			}

			this.selectAttendingEvents();
		},

		"miniMenuLoadData": function(){
			var storage = this.pageData;
			var eventsByDay = storage.eventsByDay || (storage.eventsByDay={});

			for(var dayOfWeek in oplz.events.chron){
				var eventsByTime = oplz.events.chron[dayOfWeek];

				for(var eventTime in eventsByTime){
					var eventIDs = eventsByTime[eventTime]; 

					if(!eventsByDay[dayOfWeek]){
						eventsByDay[dayOfWeek] = {};
					} 

					for(var i=0;i<eventIDs.length;i++){ 
						var event = window.oplz.common.events.get(eventIDs[i]); 

						if(!eventsByDay[dayOfWeek][ event.event_type]){ 
							eventsByDay[dayOfWeek][ event.event_type] = [];
						} 

						eventsByDay[dayOfWeek][ event.event_type ].push( event.id ); 
					}
				}
			}

			return eventsByDay;
		},

		"miniMenuRenderData": function(){
			var storage = this.pageData.eventsByDay;
			var $template = this.template;
			var $eventDayContainers = this.template.find(".oplz-myschedule-mini-menu-sub-options-container");
			var miniMenuContentHTML = "";

			if (!storage){
				storage = this.miniMenuLoadData();
			}

			for(var dayOfWeek in storage){
				var eventDay = storage[dayOfWeek];
				var miniMenuContentTypes = ""

				for(var typeName in eventDay){
					var events = eventDay[ typeName ];

					miniMenuContentTypes += window.oplz.common.pages.parse( this, this.templates["miniMenuSubOption"], {
						"key": typeName,
						"name": typeName
					});
				}

				miniMenuContentHTML += window.oplz.common.pages.parse( this, this.templates["miniMenuSubOptionsContainer"], {
					"type": dayOfWeek,
					"content": miniMenuContentTypes
				});
			}

			$eventDayContainers.html( miniMenuContentHTML );

			this.miniMenuSelectDay();
		},

		"miniMenuSelectDay": function(){
			var eventDay = this.pageData.miniMenuCurrentDay || this.pageData.defaults.miniMenuCurrentDay;
			var $template = this.template;
			var $eventDayContainers = this.template.find(".oplz-myschedule-mini-menu-sub-options-container").children();

			$template.find(".oplz-mini-menu-selected-title").text( $template.find(".oplz-myschedule-mini-menu-option[data-eventday='"+eventDay+"'] > a").text() );

			$eventDayContainers.addClass("hide").filter("[data-subtype='"+eventDay+"']").removeClass("hide");

		},

		"recentSpeakersRenderData": function(){
			var storage = this.pageData.recentSpeakers;
			var $template = this.template;
			var $recentSpeakersContainer = this.template.find(".oplz-myschedule-recent-speakers-container");
			var recentSpeakersHTML = "";

			for(username in storage){
				var user = window.oplz.common.users.get(window.oplz.users.usernames[ username ]); 

				recentSpeakersHTML += window.oplz.common.pages.parse( this, this.templates["recentSpeaker"], {
					"name": user.name,
					"id": user.id
				});
			}

			$recentSpeakersContainer.html( recentSpeakersHTML );

		}

	});

	MySchedulePage.render();
});

//# sourceURL=/js/pages/myschedule/js/oplz.page.myschedule.js