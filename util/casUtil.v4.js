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
	'use strict'

	let casUtil = {}


	// Changes XML to JSON
	// Source: https://davidwalsh.name/convert-xml-json
	let _xmlToJson = function (xml) {

		// Create the return object
		let obj = {}

		if (xml.nodeType == 1) { // element
			// do attributes
			if (xml.attributes.length > 0) {
				obj["@attributes"] = {}
				for (let j = 0; j < xml.attributes.length; j++) {
					let attribute = xml.attributes.item(j)
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue
				}
			}
		} else if (xml.nodeType == 3) { // text
			obj = xml.nodeValue
		}

		// do children
		if (xml.hasChildNodes()) {
			for (let i = 0; i < xml.childNodes.length; i++) {
				let item = xml.childNodes.item(i)
				let nodeName = item.nodeName
				if (typeof (obj[nodeName]) == "undefined") {
					obj[nodeName] = _xmlToJson(item)
				} else {
					if (typeof (obj[nodeName].push) == "undefined") {
						let old = obj[nodeName]
						obj[nodeName] = []
						obj[nodeName].push(old)
					}
					obj[nodeName].push(_xmlToJson(item))
				}
			}
		}
		return obj
	}


	let _handleErrors = async function (response) {
		if (!response.ok) {
			const isJson = response.headers.get('content-type')?.includes('application/json')
			const data = isJson ? await response.json() : null
			const error = (data && data.message) || response.statusText
			throw new Error(error)
		}
	}


	// Extracts a cookie's value based on the key (added for Viya 4 requirement to pass tkhttp-id cookie in request header)
	let _getCookies = function (name) {
		let cookie = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
		return cookie
	}


	casUtil.getAppVersion = async function (app) {

		// remove '/' from the beginning and end of app name
		if (app.substr(0, 1) == '/') app = app.substr(1)
		if (app.substr(app.length - 1, 1) == '/') app = app.substr(0, app.length - 1)

		try {
			const url = "/" + app + "/apiMeta"

			const requestHeaders = new Headers()
			requestHeaders.append("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9")

			const requestOptions = {}
			requestOptions.headers = requestHeaders
			requestOptions.method = "GET"

			const response = await fetch(url, requestOptions)

			await _handleErrors(response)
			//console.log("response:",response)
			const text = await response.text()
			console.log("application apiMeta info: ", text)
			const xmlDoc = new window.DOMParser().parseFromString(text, "application/xml")
			const jsonXML = _xmlToJson(xmlDoc)
			return jsonXML.apiMeta["@attributes"].applicationVersion
		}
		catch (error) {
			console.error("******ERROR:getAppVersion******")
			console.error("error: ", error)
			return null
		}

	}


	let _getVAVersion = async function () {

		if (casUtil._vaVersion) {
			return casUtil._vaVersion // returns cached value. This is the same as: Promise.resolve(casUtil._vaVersion)
		}

		let vaVersion = await casUtil.getAppVersion('SASVisualAnalytics')

		if (vaVersion == "8.3" || vaVersion == "8.3.1" || vaVersion == "8.4") {
			vaVersion = 83
		} else if (vaVersion == "8.5" || vaVersion == "8.5.1") {
			vaVersion = 85
		} else {
			vaVersion = 2023 // setting to 2023 for Viya 4 releases
		}
		casUtil._vaVersion = vaVersion	// caches value internally for future retrieval
		return vaVersion

	}


	casUtil.getCsrfToken = async function (service) {

		// remove '/' from the beginning and end of service name
		if (service.substr(0, 1) == '/') service = service.substr(1)
		if (service.substr(service.length - 1, 1) == '/') service = service.substr(0, service.length - 1)

		let tokenName = '_' + service + 'Token'

		if (casUtil[tokenName]) {
			return casUtil[tokenName] // returns cached value
		}

		try {
			const url = '/' + service + '/'

			const requestHeaders = new Headers()
			requestHeaders.append("X-CSRF-TOKEN", "Fetch")

			const requestOptions = {}
			requestOptions.headers = requestHeaders
			requestOptions.method = "GET"

			const response = await fetch(url, requestOptions)

			await _handleErrors(response)
			//console.log("response:",response)
			let csrfToken = response.headers.get("X-CSRF-TOKEN")
			casUtil[tokenName] = csrfToken	// caches value internally for future retrieval
			return csrfToken
		}
		catch (error) {
			console.error("******ERROR:getCsrfToken******")
			console.error("error: ", error)
			return null
		}

	}


	casUtil.getCasServerName = async function () {

		try {
			const url = "/casManagement/servers"

			const requestOptions = {}
			requestOptions.method = "GET"

			const response = await fetch(url, requestOptions)

			await _handleErrors(response)
			//console.log("response:",response)
			const data = await response.json()
			//console.log("data:",data)

			let serverList = [], casServer = {}

			if (data && data.items) {
				serverList = data.items
				casServer = serverList[0] || {}
			}

			let csrfToken = response.headers.get("X-CSRF-TOKEN")
			//console.log("csrfToken:",csrfToken)

			return { "casServerName": casServer.name, "csrfToken": csrfToken }

		}
		catch (error) {
			console.error("******ERROR:getCasServerName******")
			console.error("error: ", error)
			return {}
		}

	}


	let _createCasSession = async function (serverName, headers) {

		let vaVersion = await _getVAVersion()

		if (vaVersion >= 85) {
			try {
				const url = "/casManagement/servers/" + serverName + "/sessions"

				const requestHeaders = new Headers(headers)

				const requestOptions = {}
				requestOptions.headers = requestHeaders
				requestOptions.method = "POST"

				const response = await fetch(url, requestOptions)

				await _handleErrors(response)
				//console.log("response:",response)
				const data = await response.json()
				let session = { id: data.id, owner: data.owner }
				return session
			}
			catch (error) {
				console.error("******ERROR:_createCasSession******")
				console.error("error: ", error)
				return null
			}
		}
		else {
			try {
				const url = "/casProxy/servers/" + serverName + "/cas/sessions"

				const requestHeaders = new Headers(headers)

				const requestOptions = {}
				requestOptions.headers = requestHeaders
				requestOptions.method = "POST"

				const response = await fetch(url, requestOptions)

				await _handleErrors(response)
				//console.log("response:",response)
				const data = await response.json()
				let session = { id: data.session, owner: null } // casProxy does not return session owner info

				try {

					const url = "/casProxy/servers/" + serverName + "/cas/sessions"

					const requestHeaders = new Headers(headers)
					requestHeaders.append('Content-Type', 'application/json')
					requestHeaders.append('Accept', 'application/json')

					const requestOptions = {}
					requestOptions.headers = requestHeaders
					requestOptions.method = "GET"

					const response = await fetch(url, requestOptions)

					await _handleErrors(response)
					const data = await response.json()
					session.owner = data.owner
					return session
				}
				catch (error) {
					console.error("******ERROR:_createCasSession******")
					console.error("error: ", error)
					return session
				}

			}
			catch (error) {
				console.error("******ERROR:_createCasSession******")
				console.error("error: ", error)
				return null
			}
		}
	}


	casUtil.casAction = async function (serverName, sessId, action, bodyStringifiedJSON) {

		if (typeof bodyStringifiedJSON == "object") bodyStringifiedJSON = JSON.stringify(bodyStringifiedJSON)

		const proxyToken = await casUtil.getCsrfToken('casProxy')
		const vaVersion = await _getVAVersion()

		try {
			const url = "/casProxy/servers/" + serverName + "/cas/sessions/" + sessId + "/actions/" + action

			const requestHeaders = new Headers()
			requestHeaders.append('X-CSRF-TOKEN', proxyToken)
			requestHeaders.append('Content-Type', 'application/json')
			requestHeaders.append('Accept', 'application/json')

			// check cookies, for Viya 4 compatibility (casUtil._vaVersion >= 2023)
			if (vaVersion >= 2023) {
				// check for tkhttp-id cookie
				let tkhttpid_cookie = _getCookies("tkhttp-id")
				// if cookie IS present, add cookie's value to the request header
				if (tkhttpid_cookie) {
					requestHeaders.append("tkhttp-id", tkhttpid_cookie)
				}
			}

			const requestOptions = {}
			requestOptions.headers = requestHeaders
			requestOptions.method = "POST"
			requestOptions.body = bodyStringifiedJSON

			const response = await fetch(url, requestOptions)

			await _handleErrors(response)
			console.log("response:", response)
			return response.json()
		}
		catch (error) {
			console.error("******ERROR:casAction******")
			console.error("error: ", error)
			return null
		}

	}


	casUtil.startSession = async function () {
		// for compatibility only
		return casUtil.startCasSession()
	}


	casUtil.startCasSession = async function () {

		try {
			const vaVersion = await _getVAVersion()
			//debugger
			if (vaVersion >= 85) {
				let response = await casUtil.getCasServerName()
				//console.log("casServerName: ", response.casServerName)

				const requestHeaders = new Headers()
				requestHeaders.append('Content-Type', 'application/vnd.sas.cas.session+json')
				requestHeaders.append('Accept', 'application/vnd.sas.cas.session+json')
				requestHeaders.append('X-CSRF-TOKEN', response.csrfToken)

				let session = await _createCasSession(response.casServerName, requestHeaders)
				//console.log("sessionId: ", session.id)
				return { "casServerName": response.casServerName, "csrfToken": response.csrfToken, "sessionId": session.id, "userId": session.owner }
			}
			else {
				let response = await casUtil.getCasServerName()
				//console.log("casServerName: ", response.casServerName)

				let proxyToken = await casUtil.getCsrfToken('casProxy')
				//console.log("proxyToken: ", proxyToken)

				const requestHeaders = new Headers()
				requestHeaders.append('Accept', 'application/json')
				requestHeaders.append('X-CSRF-TOKEN', proxyToken)

				let session = await _createCasSession(response.casServerName, requestHeaders)
				//console.log("sessionId: ", session.id)
				return { "casServerName": response.casServerName, "csrfToken": proxyToken, "sessionId": session.id, "userId": session.owner }
			}
		}
		catch {
			return null
		}
	}


	if (!window.va)
		window.va = {}
	window.va.casUtil = casUtil

})(window)
