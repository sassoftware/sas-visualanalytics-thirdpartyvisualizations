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

	var tkhttpid_cookie = "";  // for handling tkhttp-id cookie, required in Viya 4

	// Changes XML to JSON
	// Source: https://davidwalsh.name/convert-xml-json
	var _xmlToJson = function(xml) {
		
		// Create the return object
		var obj = {};
	
		if (xml.nodeType == 1) { // element
			// do attributes
			if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType == 3) { // text
			obj = xml.nodeValue;
		}
	
		// do children
		if (xml.hasChildNodes()) {
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (typeof(obj[nodeName]) == "undefined") {
					obj[nodeName] = _xmlToJson(item);
				} else {
					if (typeof(obj[nodeName].push) == "undefined") {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(_xmlToJson(item));
				}
			}
		}
		return obj;
	};
	
    // Extracts a cookie's value based on the key (added for Viya 4 requirement to pass tkhttp-id cookie in request header)
    var getCookies = function(name) { 
		let c = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
		return c;
	}
	  
	casUtil.getAppVersion = function(app) {
		
		if (app.substr(0,1) == '/') app = app.substr(1);
		if (app.substr(app.length-1,1) == '/') app = app.substr(0,app.length-1);
		
		return jq.ajax({
			method: "GET", 
			url: "/"+app+"/apiMeta", 
			headers: {
				"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
			}
		})
		.then(function(xmlDoc){
			console.log("application apiMeta info: ", xmlDoc);
			var jsonXML = _xmlToJson(xmlDoc);
			//console.log("jsonXML: ", jsonXML);
			return jsonXML.apiMeta["@attributes"].applicationVersion;
		})
		.fail(function(jqXHR, textStatus, errorThrown){
			console.error("******ERROR:getAppVersion******");
			console.log("jqXHR: ", jqXHR);
			console.log("textStatus: ", textStatus);
			console.log("errorThrown: ", errorThrown);
		});
		
	};
	

	var _getVAVersion = function() {
		
		if (casUtil._vaVersion) {
			var d = jq.Deferred();
			return d.resolve(casUtil._vaVersion); // returns cached value
		}
		else {
			return casUtil.getAppVersion('SASVisualAnalytics').then(function(vaVersion) {
				if (vaVersion == "8.3" || vaVersion == "8.3.1" || vaVersion == "8.4") {
					vaVersion=83;
				} else if (vaVersion == "8.5" || vaVersion == "8.5.1") {
					vaVersion=85;
				} else {
					vaVersion=2023; // setting to 2023 for Viya 4 releases
				}
				casUtil._vaVersion = vaVersion;	// caches value internally for future retrieval
				return vaVersion;
			});
		}
		
	};
	
	
	casUtil.getCsrfToken = function(service) {

		if (service.substr(0,1) == '/') service = service.substr(1);
		if (service.substr(service.length-1,1) == '/') service = service.substr(0,service.length-1);
		
		var tokenName = '_'+service+'Token';
		
		if (casUtil[tokenName]) {
			var d = jq.Deferred();
			return d.resolve(casUtil[tokenName]); // returns cached value
		}
		else {
			return jq.ajax({
				url: '/'+service+'/',
				method: "GET",
				headers: {"X-CSRF-TOKEN": "Fetch"}
			})
			.then(function(data, status, xhr){
				var token = xhr.getResponseHeader("X-CSRF-TOKEN");
				casUtil[tokenName] = token;	// caches value internally for future retrieval
				return token;
			})
			.fail(function(jqXHR, textStatus, errorThrown){
				console.error("******ERROR:getCsrfToken******");
				console.log("jqXHR: ", jqXHR);
				console.log("textStatus: ", textStatus);
				console.log("errorThrown: ", errorThrown);
				return null;
			});
		}
		
	};


	casUtil.getCasServerName = function() {

		return jq.get("/casManagement/servers").then(function(data, status, xhr) {
		  
			var serverList = [], casServer = {};

			if (data && data.items) {
				serverList = data.items;
				casServer = serverList[0] || {};
			}
			
			var csrfToken = xhr.getResponseHeader("X-CSRF-TOKEN");
			
			//return casServer.name;
			return {"casServerName": casServer.name, "csrfToken": csrfToken};

		});
		
	};


	var _createCasSession = function(serverName, headers) {

		return _getVAVersion().then(function(vaVersion) {
			if (vaVersion >= 85) {
				return jq.ajax({
					url: ("/casManagement/servers/" + serverName + "/sessions"), 
					headers: headers, 
					method: "POST"
				})
				.then(function (data) {
					var session = {id: data.id, owner: data.owner};
					return session;
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.error('******ERROR:_createCasSession******');
					console.log("jqXHR: ",jqXHR);
					console.log("textStatus: ",textStatus);
					console.log("errorThrown: ",errorThrown);
					return null;
				});
			}
			else {
				return jq.ajax({
					url: ("/casProxy/servers/" + serverName + "/cas/sessions"), 
					headers: headers, 
					method: "POST"
				})
				.then(function (data) {
					var session = {id: data.session, owner:null}; // casProxy does not return session owner info

					var requestHeaders = {
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					};
					return jq.ajax({
						url: ("/casProxy/servers/" + serverName + "/cas/sessions/" + data.session + "/user"), 
						headers: requestHeaders, 
						method: "GET"
					})
					.then(function (data) {
						session.owner = data.owner;
						return session;
					})
					.fail(function(jqXHR, textStatus, errorThrown) {
						console.error('******ERROR:_createCasSession******');
						console.log("jqXHR: ",jqXHR);
						console.log("textStatus: ",textStatus);
						console.log("errorThrown: ",errorThrown);
						return session;
					});
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.error('******ERROR:_createCasSession******');
					console.log("jqXHR: ",jqXHR);
					console.log("textStatus: ",textStatus);
					console.log("errorThrown: ",errorThrown);
					return null;
				});
			}
		});

	};


	casUtil.casAction = function(serverName, sessId, action, bodyStringifiedJSON) {
		
		if (typeof bodyStringifiedJSON == "object") bodyStringifiedJSON = JSON.stringify(bodyStringifiedJSON);
		
		return casUtil.getCsrfToken('casProxy').then(function(proxyToken) {
			var requestHeaders = {
				'X-CSRF-TOKEN': proxyToken
			};

			// check cookies, for Viya 4 compatibility (casUtil._vaVersion >= 2023)
			if (casUtil._vaVersion >= 2023) {
				// check for tkhttp-id cookie
				tkhttpid_cookie = getCookies("tkhttp-id");
				// if cookie IS present, add cookie's value to the request header
				if ( tkhttpid_cookie ) {
					requestHeaders["tkhttp-id"] = tkhttpid_cookie;
				}
			}
			  
			return jq.ajax({
					url: ("/casProxy/servers/" + serverName + "/cas/sessions/" + sessId + "/actions/" + action),
					method: "POST",
					contentType: 'application/json',
					headers: requestHeaders,
					data: bodyStringifiedJSON
				})
				.then(function(data) {
					return data;
				})
				.fail(function(jqXHR, textStatus, errorThrown) {
					console.error('******ERROR:casAction******');
					console.log("jqXHR: ",jqXHR);
					console.log("textStatus: ",textStatus);
					console.log("errorThrown: ",errorThrown);
					return null;
				});
		});
			
	};


	casUtil.startSession = function() {
		// for compatibility only
		return casUtil.startCasSession();
	};


	casUtil.startCasSession = function() {

		return _getVAVersion().then(function(vaVersion) {
			if (vaVersion >= 85) {
				return casUtil.getCasServerName().then(function(response) {
					//console.log("casServerName: ", response.casServerName);

					var requestHeaders = {
						'Content-Type': 'application/vnd.sas.cas.session+json',
						'Accept': 'application/vnd.sas.cas.session+json',
						'X-CSRF-TOKEN': response.csrfToken
					};
					return _createCasSession(response.casServerName, requestHeaders).then(function(session) {
						//console.log("sessionId: ", session.id);
						return {"casServerName":response.casServerName, "csrfToken":response.csrfToken, "sessionId":session.id, "userId":session.owner};
					});

				});
			}
			else {
				return casUtil.getCasServerName().then(function(response) {
					//console.log("casServerName: ", response.casServerName);

					return casUtil.getCsrfToken('/casProxy/').then(function(proxyToken) {
						//console.log("proxyToken: ", proxyToken);
						var requestHeaders = {
							"X-CSRF-TOKEN": proxyToken,
							"Accept": "application/json"
						};

						return _createCasSession(response.casServerName, requestHeaders).then(function(session) {
							//console.log("sessionId: ", session.id);
							return {"casServerName":response.casServerName, "csrfToken":proxyToken, "sessionId":session.id, "userId":session.owner};
						});

					});

				});
			}
		});
	};


	if (!window.va)
		window.va = {};
	window.va.casUtil = casUtil;

})(window);