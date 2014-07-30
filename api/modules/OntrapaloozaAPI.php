<?php

	abstract class OntrapaloozaAPI {

		const _SESS_SESSION_KEY = "oplzSessionKey";
		const _SESS_USERNAME_KEY = "oplzUsername";

		static public $AvailableAPIList = array(
			"post" => array("")
		);

		static public function CreateAuthentiactedClientSession($username, $session){
			$_SESSION[self::_SESS_SESSION_KEY] = $session;
			$_SESSION[self::_SESS_USERNAME_KEY] = $username;
			return true;
		}

		static public function DestroyAuthentiactedClientSession($username, $session){
			unset($_SESSION[self::_SESS_SESSION_KEY]);
			unset($_SESSION[self::_SESS_USERNAME_KEY]);

			// session_destroy();
			return true;
		}


		static public function ClientIsAuthenticated(){
			error_log("in the func");
			if (isset($_SESSION[self::_SESS_SESSION_KEY])){
				error_log("where I want to be");

				SchedAPI::SetSessionKey( $_SESSION[self::_SESS_SESSION_KEY] );
				SchedAPI::SetUsername( $_SESSION[self::_SESS_USERNAME_KEY] );

				return true;
			}

			return false;
		}

		static public function Sanitize($content){
			return $content;
		}

		static public function Response($data, $code = 0, $message = "Success!"){
			exit(
				json_encode( 
					array(
						"status" => array(
							"code" => $code,
							"message" => $message
						),
						"data" => $data
					)
				)
			);

			return true;
		}
	}