<?php
	
	/**
	 * @todo  Change HTTP_REFERER to be a specific access domain
	 *        ie: http://ontrapalooa.com
	 */
	header("Access-Control-Allow-Origin: " . rtrim($_SERVER["HTTP_REFERER"], "/"));
	header("Access-Control-Allow-Credentials: true");

	/**
	 * Setup session to only expire after 7 days.
	 */
	ini_set("session.gc_maxlifetime", 604800);
	ini_set("session.gc_probability", 1);

	session_start();

	function OntrapaloozaAPIAutoloader($className){
        if (file_exists("modules/" . $className . ".php")) {
            include_once("modules/" . $className . ".php");
            return;
        }
	}

	spl_autoload_register("OntrapaloozaAPIAutoloader");

	if (isset($_GET["action"])){
		$data = $_GET;
		$method = "get";
	} else if (isset($_POST["action"])) {
		$data = $_POST;
		$method = "post";
	}

	if (isset($data["sessid"])){
		session_id($data["sessid"]);
	}

	$api = isset($data["api"]) ? $data["api"] : OntrapaloozaAPI::_DEFAULT_API;

	if (OntrapaloozaAPI::IsAvailableAPI($api)){
		OntrapaloozaAPI::SetAPI($api);
		if (isset($data["fixture"])){
			OntrapaloozaAPI::Response( OntrapaloozaAPI::GetFixture($api, $data["action"]));
		} else if ($data["action"] === "login"){
			$username = $data["username"];  #"tamara14", "TWeaver123");
			$password = $data["password"];
			if (isset($username) && isset($password) && method_exists($api, "GetAuthToken")){
				$session_key = call_user_func(array($api, "GetAuthToken"), $username, $password);
				error_log($session_key);
				if ($session_key){
					OntrapaloozaAPI::CreateAuthentiactedClientSession($username, $session_key);
					OntrapaloozaAPI::Response(array("id" => session_id() ));
				} else {
					OntrapaloozaAPI::Response(array(), 5, "Username and password combination were not correct!");
				}
			} else {
				OntrapaloozaAPI::Response(array(), 3, "Username or password were empty or this api has no authentication mechanisms!");
			}
		} else if ($data["action"] === "logout") {
			OntrapaloozaAPI::DestroyAuthentiactedClientSession();
			OntrapaloozaAPI::Response("logged out succesfully.");
		} else {
			if (OntrapaloozaAPI::IsAPICall($data["action"], $method)){
				if (OntrapaloozaAPI::IsAuthenticatedAPICall($data["action"])){
					if (OntrapaloozaAPI::ClientIsAuthenticated()){
						OntrapaloozaAPI::Response( call_user_func(array($api, $data["action"] ), $data ) );
					} else {
						OntrapaloozaAPI::Response(array(), 1, "Client is not authenticated!");
					}
				} else {
					OntrapaloozaAPI::Response( call_user_func( array($api, $data["action"] ), $data ) );
				}
			} else {
				if (!isset($data["action"])){
					OntrapaloozaAPI::Response(array(), 2, "Action was not supplied!");
				} else {
					OntrapaloozaAPI::Response(array(), 3, "Action provided cannot be executed!");
				}
			}
		}
	} else {
		OntrapaloozaAPI::Response(array(), 4, "API provided is not available!");
	}