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

    var d3Helper = {};
	
	d3Helper.configureFormatter = function(resultData)
	{
		if (!resultData)
			return;
			
		var formatter = {};
		var columnInfo = resultData.columns;
		if (columnInfo)
		{
			for (var i = 0; i < columnInfo.length; i++)
			{
				var colInfo = columnInfo[i];
				if (colInfo.type == "number")
				{
					if (colInfo.format)
					{
						if (colInfo.format.name == "DOLLAR")
							formatter[colInfo.label] = d3.format("$" + colInfo.format.width + ",." + colInfo.format.precision + "f");
						else if (colInfo.format.name == "COMMA")
							formatter[colInfo.label] = d3.format(colInfo.format.width + ",." + colInfo.format.precision + "f");
						else if (colInfo.format.name == "F" || colInfo.format.name == "BEST")
							formatter[colInfo.label] = d3.format(colInfo.format.width + "." + colInfo.format.precision + "f");
						else if (colInfo.format.name == "PERCENT")
							formatter[colInfo.label] = d3.format(colInfo.format.width + ",." + colInfo.format.precision + "%");
					}
				}
			}
		}
		return formatter;
	};
		
	d3Helper.configureAxisFormatter = function(resultData)
	{
		if (!resultData)
			return;
			
		var formatter = {};
		var columnInfo = resultData.columns;
		if (columnInfo)
		{
			for (var i = 0; i < columnInfo.length; i++)
			{
				var colInfo = columnInfo[i];
				if (colInfo.type == "number")
				{
					if (colInfo.format)
					{
						if (colInfo.format.name == "DOLLAR")
							formatter[colInfo.label] = d3.format("$" + colInfo.format.width + "," + "f");
						else if (colInfo.format.name == "COMMA")
							formatter[colInfo.label] = d3.format(colInfo.format.width + "," + "f");
						else if (colInfo.format.name == "F" || colInfo.format.name == "BEST")
							formatter[colInfo.label] = d3.format(colInfo.format.width + "f");
						else if (colInfo.format.name == "PERCENT")
							formatter[colInfo.label] = d3.format(colInfo.format.width + "," + "%");
					}
				}
			}
		}		
		return formatter;
	};
	
	if (!window.va)
		window.va = {};
    window.va.d3Helper = d3Helper;

})(window);