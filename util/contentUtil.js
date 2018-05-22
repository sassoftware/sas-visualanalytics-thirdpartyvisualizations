(function (window) {
    'use strict';

    var contentUtil = {};
	
	contentUtil.setupResizeListener = function(callback)
	{
        var resizeEndEvent = document.createEvent("Event");
        resizeEndEvent.initEvent("resizeEndEvent", false, true);

        //redraw graph when window resize is completed
		window.addEventListener ('resizeEndEvent', function() {
			callback();
		});

		//create trigger to resizeEnd event
		window.addEventListener('resize',function() {
			if (this._timeoutID)
				clearTimeout(this._timeoutID);
			this._timeoutID = setTimeout(function() {
				window.dispatchEvent(resizeEndEvent);
			}, 25);
		});
	}
	
	// Example of expectedTypes: ["string", "number", "date"]
	// Example of optionalTypes: ["string", "number", "date"] OR "string" OR "number" OR "date" OR [] OR null
	//
	contentUtil.validateRoles = function(resultData, expectedTypes, optionalTypes) {
		var columnsInfo = resultData.columns;
		var numCols = columnsInfo.length;
		// Check the required columns 
		if (numCols < expectedTypes.length) return false;
		for (var c = 0; c < expectedTypes.length; c++) {
			if (columnsInfo[c].type !== expectedTypes[c]) return false;
		}
		// Check the optional columns (if any). 
		if (numCols > expectedTypes.length) {
			if (optionalTypes === null) return false;
			if (typeof optionalTypes == "object") { // It's an array: (match each type in sequence or until one of the arrays end)
				for (var c = expectedTypes.length, i = 0; c < numCols && i < optionalTypes.length; c++, i++) {
					if (columnsInfo[c].type !== optionalTypes[i]) return false;
				}
			}
			else { // It's one single type: all remaining types must match that single type
				for (var c = expectedTypes.length; c < numCols; c++) {
					if (columnsInfo[c].type !== optionalTypes) return false;
				}
			}
		}
		return true;
	};
	
	contentUtil.initializeSelections = function(resultData) {
		if (!resultData)
			return null;
			
		var columnsInfo = resultData.columns;
		var arrayData = resultData.data;
		var selections = [];
		// Remove the brush column as the brush column is used for knowing 
		// whether a given row is selected or not, not something that should be handled to chart
		if (columnsInfo && arrayData) {
			for (var c = 0; c < columnsInfo.length; c++) {
				if ((columnsInfo[c].usage) && (columnsInfo[c].usage === "brush")) {
					// brush column: remove the column info
					columnsInfo.splice(c,1);
					// for each row of data, check the bush column for indication of row selection
					for (var r = 0; r < arrayData.length; r++) {
						if (arrayData[r][c] !== 0) {
							// row r has been selected
							selections.push({row: r});
						}
						// remove the value of the brush column from the row being processed
						arrayData[r].splice(c,1);
					}
				}				
			}
		}
		return selections;
	};
	
	if (!window.va)
		window.va = {};
    window.va.contentUtil = contentUtil;

})(window);