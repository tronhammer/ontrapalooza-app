<?php

	abstract class OntrapaloozaAPI {
		static public $api_version = "1.0";

		const _SESS_SESSION_KEY = "oplzSessionKey";
		const _SESS_USERNAME_KEY = "oplzUsername";

		const _DEFAULT_API = "SchedAPI";

		static private $currentAPI;

		static private $_available_apis = array(
			"OntrapaloozaAPI" => array(
				"post" => array(),
				"get" => array(
					"GetUsers" => array(
						"users" => array(
							"id" => "1",
							"username" => "demo",
							"avatar" => "http://url.com"
						)
					),
					"GetEvents" => array(),
					"GetTest" => array("Test is working")
				),
				"authenticated" => array()
			),
			"SchedAPI" => array()
		);

		static public function CreateAuthentiactedClientSession($username, $session){
			$_SESSION[self::_SESS_SESSION_KEY] = $session;
			$_SESSION[self::_SESS_USERNAME_KEY] = $username;
			return true;
		}

		static public function DestroyAuthentiactedClientSession(){
			unset($_SESSION[self::_SESS_SESSION_KEY]);
			unset($_SESSION[self::_SESS_USERNAME_KEY]);

			// session_destroy();
			return true;
		}

		static public function getAuthentiactedClientSession(){
			return array(
				"session" => $_SESSION[self::_SESS_SESSION_KEY],
				"username" => $_SESSION[self::_SESS_USERNAME_KEY]
			);;
		}


		static public function ClientIsAuthenticated(){
			if (isset($_SESSION[self::_SESS_SESSION_KEY])){
				$api = self::$currentAPI;
				$api::SetSessionKey( $_SESSION[self::_SESS_SESSION_KEY] );
				$api::SetUsername( $_SESSION[self::_SESS_USERNAME_KEY] );

				return true;
			}

			return false;
		}

		static public function GetFixture($apiName, $methodName, $method = "get"){
			return self::$_available_apis[ $apiName ][ $method ][ $methodName ];
		}

		static public function IsAvailableAPI($apiName){
			return is_array( self::$_available_apis[ $apiName ]);
		}

		static public function SetAPI($apiName){
			if (class_exists($apiName)){
				if (isset($apiName::$methods)){
					self::$_available_apis[$apiName] = $apiName::$methods;
				} else if (method_exists($apiName, "Methods")){
					self::$_available_apis[$apiName] = $apiName::Methods();
				}

				return self::$currentAPI = $apiName;
			}

			return false;
		}

		static public function Sanitize($content){
			return $content;
		}

		static public function Response($data, $code = 0, $message = "Success!", $exit = true){
			$response = json_encode( 
				array(
					"status" => array(
						"code" => $code,
						"message" => $message
					),
					"data" => $data
				)
			);
			
			if ($exit){
				exit($response);
			}

			return $response;
		}


		static public function IsAPICall($methodName, $method = "get"){
			if (isset(self::$_available_apis[self::$currentAPI][$method][ $methodName ])
				|| in_array($methodName, self::$_available_apis[self::$currentAPI][$method])){
				return true;
			}
			return false;
		}

		static public function IsAuthenticatedAPICall($methodName){
			return in_array($methodName, self::$_available_apis[ self::$currentAPI ]["authenticated"]);
		}

		static public function GetTest(){
			return self::GetFixture("OntrapaloozaAPI", "GetTest");
		}

		static public function GetUsers(){
			$users = array(
				"all" => array(),
				"usernames" => array()
			);

			foreach(array("artist", "attendee", "sponsor", "speaker", "exhibitor") as $role){
				$roles = SchedAPI::GetRoleList( array("role" => $role) );

				foreach($roles as $user){
					$users["all"][ $user["id"] ] = array_merge(
						isset($users["all"][ $user["id"] ]) ? $users["all"][ $user["id"] ] : array(),
						$user
					);

					$users["usernames"][ $user["username"] ] = $users[ $role . "s"][]= $user["id"];
				}
			}

			// foreach(array("Workshop", "Keynote") as $role){
			// 	$roles = SchedAPI::GetRoleList( array("role" => $role) );
			//
			// 	foreach($roles["artist"] as $user){
			// 		$users["all"][ $user["id"] ] = array_merge(
			// 			isset($users["all"][ $user["id"] ]) ? $users["all"][ $user["id"] ] : array(),
			// 			$user
			// 		);
			//
			// 		$users["usernames"][ $user["username"] ] = $users[ $role . "s"][]= $user["id"];
			// 	}
			// }
			
			// var_dump(array_keys($users));
			// die();
			
			$going = SchedAPI::GetGoingList();

			foreach($going as $username=>$eventIDs){
				$users["all"][ $users["usernames"][ $username ] ]["attending"] = $eventIDs;
			}

			// file_put_contents("../www/cache/OntrapaloozaAPI.GetUsers.json", json_encode($users));

			return $users;
		}

		static public function GetEvents(){
			$events = array(
				"all" => array(),
				"chron" => array(),
				"keys" => array()
			);

			$list = SchedAPI::GetSessionList();

			foreach($list as $event){
				$events["all"][ $event["id"] ] = $event;
				$events["keys"][ $event["event_key"] ] = $event["id"];
				$events["chron"][ strtolower($event["event_start_weekday"]) ][ $event["event_start_time"] ][] = $event["id"];
			}

			// file_put_contents("../www/cache/OntrapaloozaAPI.GetEvents.json", json_encode($events));

			return $events;
		}

	}