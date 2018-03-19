(function (window) {
    'use strict';

    var contentUtil = {};
	
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
	
	if (!window.va)
		window.va = {};
    window.va.contentUtil = contentUtil;

})(window);