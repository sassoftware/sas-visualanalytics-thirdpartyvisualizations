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