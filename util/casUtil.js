/*
Copyright 2018 SAS Institute Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
(function (window) {
    'use strict';

    var casUtil = {};
	
	window.jq = window.parent.$;
	
	casUtil.getCasServerName = function() {

		return jq.get("/casManagement/servers").then(function(data){
		  
			var serverList = [], casServer = {};

			if (data && data.items) {
				serverList = data.items;
				casServer = serverList[0] || {};
			}

			return casServer.name;

		});
		
	};

	casUtil.createCasSession = function(serverName, headers) {

		return jq.ajax({
			url: ("/casManagement/servers/" + serverName + "/sessions"), 
			headers: headers, 
			method: "POST"
		})
		.done(function (data) {
			return data;
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			console.log('******ERROR******');
		    console.log("jqXHR: ",jqXHR);
		    console.log("textStatus: ",textStatus);
		    console.log("errorThrown: ",errorThrown);
			return null;
		});

	};

	casUtil.casAction = function(serverName, sessId, action, data) {

		return jq.ajax({
				url: ("/casProxy/servers/" + serverName + "/cas/sessions/" + sessId + "/actions/" + action),
				method: "POST",
				contentType: 'application/json',
				data: data
			})
			.done(function(data) {
				return data;
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				console.log('******ERROR******');
				console.log("jqXHR: ",jqXHR);
				console.log("textStatus: ",textStatus);
				console.log("errorThrown: ",errorThrown);
				return null;
			});

	};

	casUtil.startSession = function() {
		// for compatibility only
		return casUtil.startCasSession();
	}

	casUtil.startCasSession = function() {

		return casUtil.getCasServerName().then(function(casServerName) {
			//console.log("casServerName: ", casServerName);

			var requestHeaders = {
				'Content-Type': 'application/vnd.sas.cas.session+json',
				'Accept': 'application/vnd.sas.cas.session+json'
			};
			return casUtil.createCasSession(casServerName, requestHeaders).then(function(session) {
				//console.log("sessionId: ", session.id);
				return {"casServerName": casServerName, "sessionId":session.id};
			});

		});

	};
	
	if (!window.va)
		window.va = {};
    window.va.casUtil = casUtil;

})(window);