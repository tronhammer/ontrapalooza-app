<?php

	abstract class SchedAPI {
		static public $api_version = "1.0";
		static public $session_key;
		static public $username;

		static public $methods = array(
			"get" => array("UserGetGoingList", "GetGoingList", "GetSessionList", "GetRoleList", "GetSessionKey", "GetActiveList"),
			"post" => array("UserAddAttendingEvent", "UserRemoveAttendingEvent", "CreateUserAccount"),
			"authenticated" => array("GetSessionKey", "UserGetGoingList", "UserAddAttendingEvent", "UserRemoveAttendingEvent")
		);

		static private $_roles = array("attendee", "speaker", "artist", "sponsor", "exhibitor", "staff");

		static private $_api_keys = array(
			// "1.0" => "4b95663904821ee688263d0c1f9d9d6f"
			"1.0" => "e0b531cdc80bf1689eedcbe5ceed15a5"
		);

		static private $_api_uris = array(
			// "1.0" => "http://ontrapalooza2014a.sched.org/api"
			"1.0" => "http://ontrapalooza2015.sched.org/api"
		);

		static public function SetAPIVersion($version){
			return self::$api_version = $version;
		}

		static public function SetSessionKey($session){
			return self::$session_key = $session;
		}

		static public function SetUsername($username){
			return self::$username = OntrapaloozaAPI::Sanitize($username);
		}

		static public function GetAuthToken($username, $password){
			self::SetUsername($username);

			$response = self::_Request("/auth/login", array(
					"username" => OntrapaloozaAPI::Sanitize(strtolower($username)), 
					"password" => OntrapaloozaAPI::Sanitize($password)
				) 
			);

			if (substr($response, 0, 4) == "ERR:"){
				return false;
			}

			if (self::SetSessionKey($response)){
				return self::$session_key;
			}

			return false;
		}

		static public function UserGetGoingList($data = array()){
			return json_decode(self::_UserRequest("/going/list"), true);
		}

		static public function UserAddAttendingEvent($data = array()){
			$response = json_decode(self::_UserRequest("/going/add", array(
				"sessions" => $data["keys"]
			)), true);

			// if (file_exists("../www/cache/OntrapaloozaAPI.GetUsers.json")){
			// 	unlink("../www/cache/OntrapaloozaAPI.GetUsers.json");
			// }

			return $response;
		}

		static public function UserRemoveAttendingEvent($data = array()){
			$response = json_decode(self::_UserRequest("/going/del", array(
				"sessions" => $data["keys"]
			)), true);

			// if (file_exists("../www/cache/OntrapaloozaAPI.GetUsers.json")){
			// 	unlink("../www/cache/OntrapaloozaAPI.GetUsers.json");
			// }
			return $response;
		}

		static public function GetSessionKey($data = array()){
			return self::$session_key;
		}

		/**
		 * PUBLIC
		 */

		static public function GetSessionList($data = array()){
			return json_decode(self::_Request("/session/export", array(
				"format" => "json",
				"custom_data" => "Y"
			)), true);
		}


		static public function CreateUserAccount($data = array()){
			if  (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)){
				return OntrapaloozaAPI::Response(array(), 7, "Not a valid email!");
			} else if (empty($data["username"]) || empty($data["name"]) || empty($data["email"]) || empty($data["password"]) ) {
				return OntrapaloozaAPI::Response(array(), 7, "Fields must not be empty!");
			}

			return json_decode(self::_Request("/user/add", array(
				"username" => $data["username"],
				"full_name" => $data["name"],
				"email" => $data["email"],
				"password" => $data["password"],
				"role" => "attendee"
			)), true);
		}

		static public function GetGoingList($data = array()){
			return json_decode(self::_Request("/going/all"), true);
		}

		static public function GetActiveList($data = array()){
			$actives = array();
			// get rid of first line.
			$line = strtok(self::_Request("/user/active"), PHP_EOL);
			$line = strtok(PHP_EOL);

			while($line !== false){
				$active = array();
				$data = explode(",", $line);
				$actives[ trim($data[0], "\"") ] = trim($data[1], "\"");

				$line = strtok(PHP_EOL);
			}
			
			return $actives;
		}

		static public function GetRoleList($data=array()){
			return json_decode(self::_Request("/role/export", array(
				"format" => "json",
				"role" => in_array($data["role"], self::$_roles) ? $data["role"] : "all",
				"fields" => isset($data["fields"]) ? $data["fields"] : "id,email,name,location,url,avatar,about,position,username"
			)), true);
		}

		static protected function _UserRequest($directive, $data = array()){
			 return self::_Request($directive, 
			 	array_merge($data, array(
						"session" => self::$session_key,
						"username" => self::$username
					)
				 )
			 );
		}

		static protected function _Request($directive, $data = array()){
			$curl = curl_init(self::$_api_uris[ self::$api_version ] . "/" . $directive);
			$curl_post_data = array_merge($data, array(
				"api_key" => self::$_api_keys[ self::$api_version ],
				"format" => "json"
			));

			// var_dump($curl_post_data);
			curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0)");
			curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($curl, CURLOPT_POST, true);
			curl_setopt($curl, CURLOPT_POSTFIELDS, $curl_post_data);
			$curl_response = curl_exec($curl);
			curl_close($curl);

			// var_dump($curl_response);
			
			if (substr($curl_response, 0, 4) == "ERR:"){
				OntrapaloozaAPI::Response(array(), 20, substr($curl_response, 5));
			}


			return $curl_response;
		}

	}