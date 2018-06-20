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

	/**
	* To be used with the c3 javascript library (http://c3js.org/)
	*/
	
    var c3Helper = {};
		
	/**
	* 
	*/
	c3Helper.configureChartData = function(resultData, chartType, previousConfig)
	{
		var chartData = {rows:[[]]};
		chartData.type = chartType;
		
		if (!resultData)
			return chartData;
		
		var columnInfo = resultData.columns;
        var values = [];
		var columnLabelsArray = [];
		
		if (columnInfo)
		{
			for (var i = 0; i < columnInfo.length; i++)
			{
				var colInfo = columnInfo[i];
				if (colInfo.type == "number")
				{
					values.push(colInfo.label);
				}
				else
				{
					if (!chartData.x)
						chartData.x = colInfo.label;
				}
					
				columnLabelsArray.push(colInfo.label);
			}
		}

        var shouldUnload = false;
		if (previousConfig)
		{
			if (previousConfig.x && previousConfig.x != chartData.x)
				shouldUnload = true;
			if (previousConfig.keys && previousConfig.keys.value)
			{
				if (previousConfig.keys.value.length != values.length)
					shouldUnload = true;
				else
				{
					for (var value of values)
					{
						if (previousConfig.keys.value.indexOf(value) == -1)
						{
							shouldUnload = true;
							break;
						}
					}
				}
			}
		}
		
		if (resultData.data)
		{
			chartData.rows = resultData.data;
			if (columnLabelsArray)
			{
				chartData.rows.splice(0, 0, columnLabelsArray);
			}
		}
		chartData.keys = {x: chartData.x, value: values};

		console.log("shouldUnload = " + shouldUnload);
        if (shouldUnload)
			chartData.unload = shouldUnload;
		
		return chartData;
	};
		
	if (!window.va)
		window.va = {};
    window.va.c3Helper = c3Helper;

})(window);