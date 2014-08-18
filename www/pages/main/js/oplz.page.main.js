
/**
 * [description]
 * @return {[type]}
 */
$(function () {
	var MainPage = window.oplz.common.pages.load("main", {
		"name": "main",
		"active": true,
		"template": undefined,
		"templates": {},
		"paths": {
			"templates": "pages/main/templates",
			"js": "pages/main/js",
			"css": "pages/main/style/css"
		},
		"templateData": {
			"header1top": "three day",
			"header1bottom": "lineup",
			"header2": "your business' best vacation",
			"mainIntroText": "We've stacked ONTRApalooza 2014 with awesome speeches, talks and workshops <em>plus</em> unannounced demos exclusively for attendees. Did we mention the end-of-day parties? They aren't to be missed. This isn't your typical business conference. This is a three day event that will transform your business."
		},
		"pageData": {
			"renderMap": {
				"schedule": "scheduleRenderData",
				"sponsors": "usersRenderData",
				"exhibitors": "usersRenderData",
				"speakers": "usersRenderData",
				"attendees": "usersRenderData"
			},
			"eventType": null,
			"eventDay": null,
			"defaults": {
				"eventType": oplz.common.route.params["type"] || "schedule",
				"eventDay": oplz.common.route.params["day"] || "wednesday"
			}
		},
		"render": function (data){
			var page = this;

			if (!page.template){
				/**
				 * @todo Change uri to dynamically select template based on screen.
				 */
				$.get( page.paths.templates + "/oplz.main."+window.oplz.common.screen.current+".tmpl").done(function (tmpl){
					page.templateString = tmpl;
					page.template = window.oplz.common.pages.build(page, tmpl);

					window.oplz.common.pages.embed( page );

					window.oplz.common.pages.display( page );

					page.getData(function (data){
						page.bind();
						page.switchTabs();
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
				}, {}, cached ]
			}, {
				"finished": callback
			});
		},

		"bind": function (){
			var _this = this;
			this.template
				.delegate(".oplz-main-schedule-tab", "click", function (){
					_this.pageData.eventDay = $(this).data("tabkey");
					_this.switchTabs();
				})
				.delegate(".oplz-main-schedule-tab-sub-type", "click", function (){
					_this.pageData.eventType = $(this).data("subtype");
					_this.switchTabs();
				})
				.delegate(".oplz-main-timeslot-event", "click", function (){
					_this.toggleEventAttendance( $(this).data("eventkey").toString() );
				});
		},

		"toggleEventAttendance": function(eventKey){
			var _this = this;
			var pos = window.oplz.me.attending.indexOf( eventKey );
			var action = (pos !== -1 ? "remove" : "add");

			window.oplz.common.ajax[ action +"AttendingEvent" ]({
				"keys": eventKey
			}, function(data){
				if (action == "add"){
					window.oplz.me.attending.push(eventKey);
				} else {
					window.oplz.me.attending.splice(pos, 1);
				}

				_this.selectAttendingEvents();
			});
		},

		"switchTabs": function (reload){
			var eventType = this.pageData.eventType || this.pageData.defaults.eventType;
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;

			if (reload){
				this.getData(this.switchTabs);
			} else if (!this.pageData[eventDay] || !this.pageData[eventDay][eventType]){
				this[ this.pageData.renderMap[ eventType ] ]();
			} else {
				this.template
					.find(".oplz-main-schedule-tab-content").addClass("hide").removeClass("selected")
					.filter("[data-tabKey='"+ eventDay +"']").addClass("selected").removeClass("hide")
					.find(".oplz-main-schedule-tab-type-content").addClass("hide").removeClass("selected")
					.filter("[data-subType='"+ eventType +"']").addClass("selected").removeClass("hide");
			}
		},

		"selectAttendingEvents": function(){
			this.template.find(".oplz-main-timeslot-event").removeClass("selected")
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
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var storage = this.pageData[eventDay];
			var $template = this.template;
			var $eventDayContainers = this.template.find(".oplz-main-schedule-tab-content");
			var timeSlotsHTML = "";
			var eventRowsHTML;

			if (reload || !storage || !storage.schedule){
				storage = this.scheduleLoadData();
			}

			for(var eventTime in storage.schedule){
				var eventIDs = storage.schedule[ eventTime ];
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
				"type": "schedule",
				"content": timeSlotsHTML,
			});

			$eventDayContainers.filter("[data-tabKey='"+eventDay+"']").append( eventRowsHTML );

			this.selectAttendingEvents();

			this.switchTabs();
		},

		"speakersLoadData": function (){
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var storage = this.pageData[eventDay] || (this.pageData[eventDay]={});
			var speakers = storage.speakers || (storage.speakers=[]);

			for(var eventTime in window.oplz.events.chron[eventDay]){
				var eventIDs = window.oplz.events.chron[eventDay][ eventTime ];

				for(var i=0; i<eventIDs.length; i++){
					var event = window.oplz.common.events.get( eventIDs[i] );

					if (event.speakers){
						for(var ii=0; ii<event.speakers.length; ii++){
							var id = event.speakers[ii].id;
							if (speakers.indexOf(id) == -1){
								speakers.push(id);
							} 
						}
					}
				}
			}

			return storage;
		},

		"attendeesLoadData": function (){
			var users = window.oplz.users;
			var events = window.oplz.events;
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var storage = this.pageData[eventDay] || (this.pageData[eventDay]={});
			var attendees = storage.attendees || (storage.attendees=[]);

			for(var i=0;i<users.attendees.length;i++){
				var attendingUserID = users.attendees[i];
				var attendingUser = window.oplz.common.users.get( attendingUserID );
				var attendingEventKeyList = attendingUser.attending;

				if(attendingEventKeyList){
					for(var ii=0;ii<attendingEventKeyList.length;ii++){
						var eventID = events.keys[ attendingEventKeyList[ii] ];
						var event = events.all[ eventID ];
						if (event.event_start_weekday.toLowerCase() == eventDay){
							attendees.push(attendingUserID);
							break;
						}
					}
				}
			}

			return storage;
		},

		"sponsorsLoadData": function(){
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var storage = this.pageData[eventDay] || (this.pageData[eventDay]={});
			var sponsors = storage.sponsors || (storage.sponsors=window.oplz.users.sponsors);

			return storage;
		},

		"exhibitorsLoadData": function(){
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var storage = this.pageData[eventDay] || (this.pageData[eventDay]={});
			var exhibitors = storage.exhibitors || (storage.exhibitors=window.oplz.users.exhibitors);

			return storage;
		},

		"usersRenderData": function (reload){
			var eventDay = this.pageData.eventDay || this.pageData.defaults.eventDay;
			var eventType = this.pageData.eventType || this.pageData.defaults.eventType;
			var storage = this.pageData[eventDay];
			var $template = this.template;
			var $eventDayContainers = this.template.find(".oplz-main-schedule-tab-content");
			var usersPlotHTML = "";

			if (reload || !storage || !storage[eventType]){
				storage = this[eventType + "LoadData"]();
			}

			var userStore = storage[eventType];

			for(var i=0; i<userStore.length; i++){
				var user = window.oplz.common.users.get( userStore[ i ] );
				usersPlotHTML += window.oplz.common.pages.parse( this, this.templates["speakersUserContainer"], {
					"id": user.id,
					"name": user.name,
					"avatar_uri": user.avatar || window.oplz.common.users.defaults.avatar
				});
			}

			eventRowsHTML = window.oplz.common.pages.parse( this, this.templates["eventTypeContainer"], {
				"type": eventType,
				"content": usersPlotHTML
			});

			$eventDayContainers.filter("[data-tabKey='"+eventDay+"']").append( eventRowsHTML );

			this.switchTabs();
		}
	});

	MainPage.render();
});

//# sourceURL=/js/pages/main/js/oplz.page.main.js