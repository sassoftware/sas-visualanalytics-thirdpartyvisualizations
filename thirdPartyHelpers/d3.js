(function (window) {
    'use strict';

    var d3Helper = {};
	
	d3Helper.configureFormatter = function(resultData, formatter)
	{
		if (!resultData || !formatter)
			return;
			
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
						else if (colInfo.format.name == "F")
							formatter[colInfo.label] = d3.format(colInfo.format.width + "." + colInfo.format.precision + "f");
						else if (colInfo.format.name == "PERCENT")
							formatter[colInfo.label] = d3.format(colInfo.format.width + ",." + colInfo.format.precision + "%");
					}
				}
			}
		}
	};
		
	if (!window.va)
		window.va = {};
    window.va.d3Helper = d3Helper;

})(window);