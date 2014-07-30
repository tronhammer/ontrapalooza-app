<?php

	header("Access-Control-Allow-Origin: http://ontrapalooza.com");

	session_start();

	var_dump($_SESSION);

	function OntrapaloozaAPIAutoloader($className){
        if (file_exists("modules/" . $className . ".php")) {
            include_once("modules/" . $className . ".php");
            return;
        }
	}

	spl_autoload_register("OntrapaloozaAPIAutoloader");

	/**
	 * @todo Change REQUEST => POST
	 */
	if ($_REQUEST["action"] === "login"){
		$username = $_REQUEST["username"];  #"tamara14", "TWeaver123");
		$password = $_REQUEST["password"];
		if (isset($username) && isset($password)){
			if (SchedAPI::GetAuthToken($username, $password)){
				OntrapaloozaAPI::CreateAuthentiactedClientSession($username, SchedAPI::$session_key);
				OntrapaloozaAPI::Response("logged in succesfully.");
			}
		} else {
			OntrapaloozaAPI::Response(array(), 3, "Username or password were empty!");
		}


	} else {
		if (SchedAPI::IsAPICall($_REQUEST["action"])){

			if (SchedAPI::IsAuthenticatedAPICall($_REQUEST["action"])){
				if (OntrapaloozaAPI::ClientIsAuthenticated()){
					OntrapaloozaAPI::Response( call_user_func("SchedAPI::" . $_REQUEST["action"] ) );
				} else {
					OntrapaloozaAPI::Response(array(), 1, "Client is not authenticated!");
				}
			} else {
				OntrapaloozaAPI::Response( call_user_func("SchedAPI::" . $_REQUEST["action"] ) );
			}
		} else {
			if (!isset($_REQUEST["action"])){
				OntrapaloozaAPI::Response(array(), 2, "Action was not supplied!");
			} else {
				OntrapaloozaAPI::Response(array(), 3, "Action provided cannot be executed!");
			}
		}
	}