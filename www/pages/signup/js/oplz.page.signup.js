$(function(){
	var SignupPage = window.oplz.common.pages.load("signup", {
		"name": "signup",
		"active": true,
		"template": undefined,
		"paths": {
			"templates": "pages/signup/templates",
			"js": "pages/signup/js",
			"css": "pages/signup/style/css"
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
				$.get( page.paths.templates + "/oplz.signup."+window.oplz.common.screen.current+".tmpl").done(function (tmpl){
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

		"getData": function(callback, cached){
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
			// $("#page-container-signup").delegate("", "click", function(){});
		}
	});

	SignupPage.render();
});


  // This is called with the results from from FB.getLoginStatus().
  function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      testAPI();
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into this app.';
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
      document.getElementById('status').innerHTML = 'Please log ' +
        'into Facebook.';
    }
  }

  // This function is called when someone finishes with the Login
  // Button.  See the onlogin handler attached to it in the sample
  // code below.
  function checkLoginState() {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  }

  window.fbAsyncInit = function() {
  FB.init({
    appId      : '{your-app-id}',
    cookie     : true,  // enable cookies to allow the server to access 
                        // the session
    xfbml      : true,  // parse social plugins on this page
    version    : 'v2.1' // use version 2.1
  });

  // Now that we've initialized the JavaScript SDK, we call 
  // FB.getLoginStatus().  This function gets the state of the
  // person visiting this page and can return one of three states to
  // the callback you provide.  They can be:
  //
  // 1. Logged into your app ('connected')
  // 2. Logged into Facebook, but not your app ('not_authorized')
  // 3. Not logged into Facebook and can't tell if they are logged into
  //    your app or not.
  //
  // These three cases are handled in the callback function.

  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });

  };

  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  // Here we run a very simple test of the Graph API after login is
  // successful.  See statusChangeCallback() for when this call is made.
  function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Successful login for: ' + response.name);
      document.getElementById('status').innerHTML =
        'Thanks for logging in, ' + response.name + '!';
    });
  }