<?php

	abstract class SchedAPI {
		static public $api_version = "1.0";
		static public $session_key;
		static public $username;

		static private $_api_keys = array(
			"1.0" => "4b95663904821ee688263d0c1f9d9d6f"
		);

		static private $_api_uris = array(
			"1.0" => "http://ontrapalooza2014a.sched.org/api"
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

		static public function IsAPICall($methodName){
			return method_exists("SchedAPI", $methodName);
		}

		static public function IsAuthenticatedAPICall($methodName){
			if (substr($methodName, 0, 4) === "User"){
				return method_exists("SchedAPI", $methodName);
			}

			return false;
		}

		static public function GetAuthToken($username, $password){
			self::SetUsername($username);

			if (self::SetSessionKey(
				self::_Request("/auth/login", array(
						"username" => OntrapaloozaAPI::Sanitize($username), 
						"password" => OntrapaloozaAPI::Sanitize($password)
					) 
				)
			)){
				return self::$session_key;
			}

			return false;
		}

		static public function UserGetGoingList(){
			return json_decode(self::_UserRequest("/going/list"));
		}

		/**
		 * PUBLIC
		 */

		static public function GetGoingList(){
			return json_decode(self::_Request("/going/all"));
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
			));

			var_dump($curl_post_data);
			curl_setopt($curl, CURLOPT_USERAGENT, "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0)");
			curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($curl, CURLOPT_POST, true);
			curl_setopt($curl, CURLOPT_POSTFIELDS, $curl_post_data);
			$curl_response = curl_exec($curl);
			curl_close($curl);

			return $curl_response;
		}

	}