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

    var messagingUtil = {};
	
	messagingUtil.setOnDataReceivedCallback = function(callback)
	{
		var onMessage = function (evt) {
			if (evt && evt.data && evt.data.hasOwnProperty("data"))
			{
				callback(evt.data);
			}
		}
		
		if (window.addEventListener) {
			// For standards-compliant web browsers
			window.addEventListener("message", onMessage, false);
		}
		else {
			window.attachEvent("onmessage", onMessage);
		}
	};
	
	/*
	ExampleS of valid selectedRows: 
	[0, 3, 4]
	[{row: 0}, {row: 3}, {row: 4}]
	*/
	messagingUtil.postSelectionMessage = function(resultName, selectedRows) 
	{
		var selections;
		if (selectedRows && selectedRows.length > 0 && selectedRows[0].hasOwnProperty("row")) {
			selections = selectedRows;
		}
		else {
			selections = [];
			selectedRows.forEach(function (selRow) {
				selections.push({row: selRow});
			});
		}

		var message = {
			resultName: resultName, 
			selections: selections
		};
		var url = (window.location != window.parent.location)
			? document.referrer
			: document.location.href;
			
		window.parent.postMessage(message, url);
	};
	
	messagingUtil.postInstructionalMessage = function(resultName, strMessage) 
	{
		var message = {
			resultName: resultName,
			message: strMessage
		};
		var url = (window.location != window.parent.location)
			? document.referrer
			: document.location.href;
			
		window.parent.postMessage(message, url);
	};
	
	if (!window.va)
		window.va = {};
    window.va.messagingUtil = messagingUtil;

})(window);