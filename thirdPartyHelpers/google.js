(function (window) {
    'use strict';

    var googleHelper = {};
	
	googleHelper.createDataTable = function(resultData)
	{
		var arrayData;
		if (resultData.data)
		{
			arrayData = resultData.data;
			if (resultData.columns)
			{
				arrayData.splice(0, 0, resultData.columns);
			}
		}
		return google.visualization.arrayToDataTable(arrayData);
	};

	googleHelper.formatData = function(dataTable, resultData)
	{
		if (!resultData || !dataTable)
			return;
			
		var columnInfo = resultData.columns;
		if (columnInfo)
		{
			for (var i = 0; i < columnInfo.length; i++)
			{
				var colInfo = columnInfo[i];
				if (colInfo.format)
				{
					if (colInfo.format.name == "DOLLAR")
					{
						var formatter = new google.visualization.NumberFormat({
							prefix: '$',
							fractionDigits: colInfo.format.precision
						});
						formatter.format(dataTable, i);
					}
					else if (colInfo.format.name == "COMMA")
					{
						var formatter = new google.visualization.NumberFormat({
							fractionDigits: colInfo.format.precision
						});
						formatter.format(dataTable, i);
					}
					else if (colInfo.format.name == "F" || colInfo.format.name == "BEST")
					{
						var formatter = new google.visualization.NumberFormat({
							groupingSymbol: '',
							fractionDigits: colInfo.format.precision
						});
						formatter.format(dataTable, i);
					}
					else if (colInfo.format.name == "PERCENT")
					{
						var pattern = '#,###';
						if (colInfo.format.precision > 0)
						{
							pattern += ".";
							for (var j = 0; j < colInfo.format.precision; j++)
								pattern += "#";
						}
						
						pattern += "%";
						var formatter = new google.visualization.NumberFormat({
							pattern: pattern
						});
						formatter.format(dataTable, i);
					}
				}
			}
		}		
	};
		
	googleHelper.formatAxis = function(axis, options, resultData)
	{
		if (!resultData || !options || !axis)
			return;
			
		var columnInfo = resultData.columns;
		if (columnInfo)
		{
			if (!options[axis]) options[axis] = {};
			for (var i = 0; i < columnInfo.length; i++)
			{
				var colInfo = columnInfo[i];
				if (colInfo.format)
				{
					if (colInfo.format.name == "DOLLAR")
					{
						options[axis].format = '$#,###';
					}
					else if (colInfo.format.name == "COMMA")
					{
						options[axis].format = '#,###';
					}
					else if (colInfo.format.name == "F" || colInfo.format.name == "BEST")
					{
						options[axis].format = '####';
					}
					else if (colInfo.format.name == "PERCENT")
					{
						options[axis].format = 'percent';
					}
				}
			}
		}
	};
	
	if (!window.va)
		window.va = {};
    window.va.googleHelper = googleHelper;

})(window);