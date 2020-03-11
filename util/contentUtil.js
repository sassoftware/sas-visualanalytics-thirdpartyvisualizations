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
	
	contentUtil.convertDateColumns = function(resultData) {
		if (!resultData)
			return;
		
		var columnsInfo = resultData.columns;
		var arrayData = resultData.data;
		for (var c = 0; c < columnsInfo.length; c++) {
			var colInfo = columnsInfo[c];
			if (colInfo) { // <--- just to be safe
				if (colInfo.type == "date") {
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						
						// One of the Date() constructors accept dates as strings in ISO format as input, such as:
						// "02/12/2012", "Feb/12/2012", "February 12, 2012", "12Feb2012", "Sunday, February 12, 2012", "2012/02/12"
						// (support for some of those formats may be browser vendor and version dependent).
						// It does NOT accept Julian neither DD/MM/YYYY formats. In those cases, a transformation is necessary
						// to put the date string in a supported format.
						
						// There is room for a lot of improvement here.
						if (colInfo.format && colInfo.format.formatString == "DDMMYY8") {
							dateStr = dateStr.substr(6)+'-'+dateStr.substr(3,2)+'-'+dateStr.substr(0,2); // = YYYY-MM-DD (international standard)
						}
						else if (colInfo.format && colInfo.format.formatString == "JULIAN7") {
							// This is just a placeholder. Need code for this transformation.
						}
                        else if (colInfo.format && colInfo.format.formatString == "DATE9") { //DDMMMYY
                            dateStr = dateStr.substr(0,2)+' '+dateStr.substr(2,3)+' '+dateStr.substr(5); // = DD MMM YY
                        }
						// Other transformations should be added here as needed.
						
						arrayData[r][c] = new Date(dateStr);
					}
				}
			}
		}
	};
	
	// Returns the object: {<param_label_1>:<param_value_1>, ... , <param_label_n>:<param_value_n>}
	// If <parameter_label> has multiple values, <param_value> is an array
    contentUtil.getVAParameters = function(resultData) {
		var parameters = {};
		if (resultData.parameters) {
			resultData.parameters.forEach(function (parameter, index) {
				parameters[parameter.label] = parameter.value;
			});
		}
		return parameters;
    };
	
	if (!window.va)
		window.va = {};
    window.va.contentUtil = contentUtil;

})(window);