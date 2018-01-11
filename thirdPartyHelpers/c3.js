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
	}
		
	if (!window.va)
		window.va = {};
    window.va.c3Helper = c3Helper;

})(window);