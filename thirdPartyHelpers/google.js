(function (window) {
    'use strict';

    var googleHelper = {};
	
	googleHelper.setupResizeListeners = function(callback)
	{
		//create trigger to resizeEnd event     
		$(window).resize(function() {
			if (this.resizeTO) 
				clearTimeout(this.resizeTO);
			this.resizeTO = setTimeout(function() {
				$(this).trigger('resizeEnd');
			}, 25);
		});

		//redraw graph when window resize is completed  
		$(window).on('resizeEnd', function() {
			callback();
		});
	}

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
	}

	googleHelper.initializeSelections = function(dataTable, resultData)
	{
		if (!resultData || !dataTable)
			return null;
			
		var columnInfo = resultData.columns;
		var selections = [];
		//remove the brush column as the brush column is used for knowing 
		//whether a given row is selected or not, not something that should be handed to chart
		if (columnInfo && columnInfo.length > 0 && columnInfo[columnInfo.length - 1].usage == "brush")
		{
			var brushIndex = columnInfo.length - 1;
			for (var i = 0; i < dataTable.getNumberOfRows(); i++)
			{
				if (dataTable.getValue(i, brushIndex) > 0)
					selections.push({row:i});
			}
		
			//brush column, remove it
			dataTable.removeColumn(brushIndex);
		}		
		return selections;
	}	
	
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
					else if (colInfo.format.name == "F")
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
	}	
		
	if (!window.va)
		window.va = {};
    window.va.googleHelper = googleHelper;

})(window);