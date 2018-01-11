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
	}
	
	messagingUtil.postSelectionMessage = function(resultName, selections) 
	{
		var message = {
			resultName: resultName, 
			selections: selections
		};
		var url = (window.location != window.parent.location)
			? document.referrer
			: document.location.href;
			
		window.parent.postMessage(message, url);
	}
	
	if (!window.va)
		window.va = {};
    window.va.messagingUtil = messagingUtil;

})(window);