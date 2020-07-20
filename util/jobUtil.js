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

    var jobUtil = {};
	
	window.jq = window.parent.$;
	
    // Treat string missing values, date, and datetime values received from VA so that SAS jobs can better process the data.
	// No 1:1 mapping of VA number/date/datetime formats to SAS number/date/datetime formats: exceptions treated here.
	// String: 
	// 		* missing values come as "(missing)". Must be modified to "".
	// 		* corresponding type for SAS jobs is CHARACTER.
	// Number: 
	// 		* missing values come as ".". No transformation necessary.
	// 		* corresponding type for SAS jobs is NUMERIC.
	// Date: 
	//		* missing values come as "." No transformation necessary.
	// 		* corresponding type for SAS jobs is NUMERIC.
	// 		* come as formatted strings according to their date formats. They must be transformed to
	// 		  their corresponding SAS date numbers expressed as number of days since January 1st, 1960.
	// Datetime: 
	//		* missing values come as "." No transformation necessary.
	// 		* corresponding type for SAS jobs is NUMERIC.
	// 		* come as formatted strings according to their datetime formats. They must be transformed to
	// 		  their corresponding SAS datetime numbers expressed as number of seconds since January 1st, 1960.
	jobUtil.PrepareVADataForSASJobs = function(resultData) {
		if (!resultData)
			return;
		
		if (resultData.hasOwnProperty('processed'))
		    return;
		
		resultData.processed = true;
		
		const sasDateBaseline = Date.parse('1960-01-01T00:00:00.000Z');
		const numMillisecInADay = 1000*60*60*24;
		const getMonthNumber = function(month) {
			return new Date(Date.parse(month+" 1, 2000")).getMonth()+1;
		}
		
		var columnsInfo = resultData.columns;
		var arrayData = resultData.data;
		
		for (var c = 0; c < columnsInfo.length; c++) {
			var colInfo = columnsInfo[c];
			if (colInfo.type == "string") {
				colInfo.type4job = "CHARACTER"; // corresponding type for SAS job
				for (var r = 0; r < arrayData.length; r++) {
					if (arrayData[r][c] == "(missing)") arrayData[r][c] = "";
				}
			}
			else if (colInfo.type == "number") {
				colInfo.type4job = "NUMERIC"; // corresponding type for SAS job
				if (!colInfo.format)
					continue;
				colInfo.format.name4job = colInfo.format.name;
				colInfo.format.width4job = colInfo.format.width;
				colInfo.format.precision4job = colInfo.format.precision;
				if (colInfo.format.name == "POUND") { // Using international format: change to local currency format
					colInfo.format.name4job = 'NLMNLGBP';
				}
				if (colInfo.format.name == "EURO") { // Using international format: change to local currency format
					colInfo.format.name4job = 'NLMNLEUR';
				}
				else if (colInfo.format.name == "WON") { // Using international format: change to local currency format
					colInfo.format.name4job = 'NLMNLKRW';
				}
				else if (colInfo.format.name == "YEN") { // Using international format: change to local currency format
					colInfo.format.name4job = 'NLMNLJPY';
				}
				else if (colInfo.format.name == "TIME" ||
						 colInfo.format.name == "HOUR" ||
						 colInfo.format.name == "HHMM" ||
						 colInfo.format.name == "MMSS") { // Expand width (fixed in VA) to prevent bigger values from being truncated
					colInfo.format.width4job = 20;
				}
			}
			else if (colInfo.type == "date") {
				colInfo.type4job = "NUMERIC"; // corresponding type for SAS job
				if (!colInfo.format)
					continue;
				colInfo.format.name4job = colInfo.format.name;
				colInfo.format.width4job = colInfo.format.width; 
				colInfo.format.precision4job = colInfo.format.precision; // always 0 for dates
				// One of the Date() constructors accept dates as strings in ISO format as input, such as:
				// "02/12/2012", "Feb/12/2012", "February 12, 2012", "12Feb2012", "Sunday, February 12, 2012",
				// "Sunday, Feb 12, 2012", "2012/02/12", etc. You can also append time information to those dates, 
				// e.g.: "3:45:39 PM", "15:45:39", "3:45:39.875 PM", "15:45:39.875", etc.
				// (support for some of those formats may be browser vendor and version dependent).
				// It does NOT accept Julian neither DD/MM/YYYY formats for example. In those cases, a transformation is necessary
				// to put the date string in a supported format for the Date object.
				// The code below determines what transformations must be performed depending on the column type and format.
				// There is room for a lot of improvement here.
				if (colInfo.format.formatString == "DATE9") { // DDMMMYYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = dateStr.substr(0,2)+'-'+dateStr.substr(2,3)+'-'+dateStr.substr(5)+' 00:00:00.000Z'; // = DD MMM YY 00:00:00.000Z
							dateStr = dateStr.substr(5,4)+'-'+getMonthNumber(dateStr.substr(2,3))+'-'+dateStr.substr(0,2)+' 00:00:00.000Z'; // = DD MMM YY 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DATEN9"  || // MM/DD/YYYY
						 colInfo.format.formatString == "MMDDYY8") { // MM/DD/YYYY
					// These date formats are one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = dateStr+' 00:00:00.000Z'; // = MM/DD/YYYY 00:00:00.000Z
							dateStr = dateStr.substr(6)+'-'+dateStr.substr(0,2)+'-'+dateStr.substr(3,2)+' 00:00:00.000Z'; // = MM/DD/YYYY 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'MMDDYY';
					colInfo.format.width4job = 10;
				}
				else if (colInfo.format.formatString == "YYMMDD8") { // YYYY/MM/DD
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = dateStr+' 00:00:00.000Z'; // = YYYY/MM/DD 00:00:00.000Z
							dateStr = dateStr.replace(/\//g, '-')+' 00:00:00.000Z'; // = YYYY/MM/DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'YYMMDDS';
					colInfo.format.width4job = 10;
				}
				else if (colInfo.format.formatString == "WEEKDATE28") { // Wednesday, September 23, 2020
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = dateStr+' 00:00:00.000Z'; // = Wednesday, September 23, 2020 00:00:00.000Z
							dateStr = dateStr.substr(dateStr.indexOf(',')+1).trim(); // = September 23, 2020
							var month = dateStr.substr(0,dateStr.indexOf(' ')); // = September
							dateStr = dateStr.substr(dateStr.indexOf(' ')+1).trim(); // = 23, 2020
							var day = dateStr.substr(0,dateStr.indexOf(',')); // = 23
							var year = dateStr.substr(dateStr.indexOf(' ')+1).trim(); // = 2020
							dateStr = year+'-'+getMonthNumber(month)+'-'+day+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'WEEKDATE'; // has not changed, just for clarity
					colInfo.format.width4job = 29;
				}
				else if (colInfo.format.formatString == "WORDDATE28") { // September 23, 2020
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = dateStr+' 00:00:00.000Z'; // = September 23, 2020 00:00:00.000Z
							var month = dateStr.substr(0,dateStr.indexOf(' ')); // = September
							dateStr = dateStr.substr(dateStr.indexOf(' ')+1).trim(); // = 23, 2020
							var day = dateStr.substr(0,dateStr.indexOf(',')); // = 23
							var year = dateStr.substr(dateStr.indexOf(' ')+1).trim(); // = 2020
							dateStr = year+'-'+getMonthNumber(month)+'-'+day+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'WORDDATE'; // has not changed, just for clarity
					colInfo.format.width4job = 18;
				}
				else if (colInfo.format.formatString == "DDMMYY8") { // DD/MM/YYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = dateStr.substr(6)+'-'+dateStr.substr(3,2)+'-'+dateStr.substr(0,2)+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'DDMMYY'; // has not changed, just for clarity
					colInfo.format.width4job = 10;
				}
				else if (colInfo.format.formatString == "DATE11") { // MMM/DD/YYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = dateStr.substr(7,4)+'-'+getMonthNumber(dateStr.substr(0,3))+'-'+dateStr.substr(4,2)+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					// cannot reproduce the original format: it will be displayed as DD-MMM-YYYY
				}
				else if (colInfo.format.formatString == "DAY9") { // DD
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = '1960-01-'+dateStr+' 00:00:00.000Z'; // = 1960-01-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DOWNAME11" || colInfo.format.formatString == "WEEKDATE9") { // Sunday..Saturday
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = (dateStr=="Sunday"    ? '1960-01-03 00:00:00.000Z' :
									  (dateStr=="Monday"    ? '1960-01-04 00:00:00.000Z' :
									  (dateStr=="Tuesday"   ? '1960-01-05 00:00:00.000Z' :
									  (dateStr=="Wednesday" ? '1960-01-06 00:00:00.000Z' :
									  (dateStr=="Thursday"  ? '1960-01-07 00:00:00.000Z' :
									  (dateStr=="Friday"    ? '1960-01-08 00:00:00.000Z' : 
															  '1960-01-09 00:00:00.000Z'
							))))));
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DOWNAME1" || colInfo.format.formatString == "WEEKDATE3") { // Sun..Sat
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = (dateStr=="Sun" ? '1960-01-03 00:00:00.000Z' :
									  (dateStr=="Mon" ? '1960-01-04 00:00:00.000Z' :
									  (dateStr=="Tue" ? '1960-01-05 00:00:00.000Z' :
									  (dateStr=="Wed" ? '1960-01-06 00:00:00.000Z' :
									  (dateStr=="Thu" ? '1960-01-07 00:00:00.000Z' :
									  (dateStr=="Fri" ? '1960-01-08 00:00:00.000Z' : 
														'1960-01-09 00:00:00.000Z'
							))))));
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					if (colInfo.format.formatString == "DOWNAME1") {
						colInfo.format.name4job = 'DOWNAME'; // has not changed, just for clarity
						colInfo.format.width4job = 3;
					}
				}
				else if (colInfo.format.formatString == "JULIAN7") { // YYYYddd
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							var sasDateOnJanFirstYYYY = (Date.parse(dateStr.substr(0,4)+'-01-01 00:00:00.000Z')-sasDateBaseline)/numMillisecInADay;
							var sasDateOnYYYYddd = sasDateOnJanFirstYYYY + parseInt(dateStr.substr(4))-1;
							arrayData[r][c] = sasDateOnYYYYddd; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "MONYY7") { // MmmYYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = '01 '+dateStr.substr(0,3)+' '+dateStr.substr(3)+' 00:00:00.000Z'; // = 01 Mnn YYYY 00:00:00.000Z
							dateStr = dateStr.substr(3)+'-'+getMonthNumber(dateStr.substr(0,3))+'-'+'01'+' 00:00:00.000Z'; // = YYYY-MM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "MMYY8") { // MM/YYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = dateStr.substr(3)+'-'+dateStr.substr(0,2)+'-01 00:00:00.000Z'; // = YYYY-MM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'MMYYS';
					colInfo.format.width4job = 8; // has not changed, just for clarity
				}
				else if (colInfo.format.formatString == "MONTH7"    || // MMMMMMMMM
						 colInfo.format.formatString == "MONTH3"    || // MMM
						 colInfo.format.formatString == "WORDDATE9" || // MMMMMMMMM
						 colInfo.format.formatString == "WORDDATE3") { // MMM
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							//dateStr = '1960-'+dateStr+'-01 00:00:00.000Z'; // = 1960-MMMMMM-01 00:00:00.000Z
							dateStr = '1960-'+getMonthNumber(dateStr)+'-01 00:00:00.000Z'; // = 1960-MMMMMM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					if (colInfo.format.formatString == "MONTH7") {
						colInfo.format.name4job = 'MONNAME';
						colInfo.format.width4job = 9;
					}
					else if (colInfo.format.formatString == "MONTH3") {
						colInfo.format.name4job = 'MONNAME';
						colInfo.format.width4job = 3; // has not changed, just for clarity
					}
				}
				else if (colInfo.format.formatString == "MONTH2") { // MM as number
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = '1960-'+dateStr+'-01 00:00:00.000Z'; // = 1960-MM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "QTR4" || // Qn  
						 colInfo.format.formatString == "QTR6") { // 2nd quarter  
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = (dateStr=="Q1" || dateStr=="1st quarter" ? '1960-01-01 00:00:00.000Z' :
									  (dateStr=="Q2" || dateStr=="2nd quarter" ? '1960-04-01 00:00:00.000Z' :
									  (dateStr=="Q3" || dateStr=="3rd quarter" ? '1960-07-01 00:00:00.000Z' :
																				 '1960-10-01 00:00:00.000Z'
							)));
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'QTR'; // has not changed, just for clarity
					colInfo.format.width4job = 1; // cannot reproduce the original format: returns only the quarter number
				}
				else if (colInfo.format.formatString == "YYQC5") { // Qnd quarter YYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							var qtr=dateStr.substr(0,1);
							var MM=(qtr=='1'?'01':(qtr=='2'?'04':(qtr=='3'?'07':'10')));
							dateStr = dateStr.substr(12)+'-'+MM+'-01 00:00:00.000Z'; // = YYYY-MM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "YEAR4") { // YYYY
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = dateStr+'-01-01 00:00:00.000Z'; // = YYYY-01-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "YYMM8") { // YYYY/MM
					for (var r = 0; r < arrayData.length; r++) {
						var dateStr = arrayData[r][c].trim();
						if (dateStr != '.') {
							dateStr = dateStr.substr(0,4)+'-'+dateStr.substr(5,2)+'-01 00:00:00.000Z'; // = YYYY-MM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
						}
					}
					colInfo.format.name4job = 'YYMMS';
					colInfo.format.width4job = 8; // has not changed, just for clarity
				}
                else if (colInfo.format.formatString == "JULDAY1" || // ddd
						 colInfo.format.formatString == "WEEKV2"  || // nn
						 colInfo.format.formatString == "WEEKV3"  || // Wnn
						 colInfo.format.formatString == "WEEKV5"  || // yyWww
						 colInfo.format.formatString == "WEEKV7"  || // yyWwwnn
						 colInfo.format.formatString == "WEEKV9"  || // yyyyWwwnn
						 colInfo.format.formatString == "WEEKV0") {  // yyyy-Www-nn
					// Cannot accurately create the date.
					// Other formats such as DAY9, DOWNAME11, DOWNAME1, WEEKDATE9, WEEKDATE3, MONYY7,
					// MMYY8, MONTH7, MONTH3, MONTH2, WORDDATE9, WORDDATE3, QTR4, QTR6, YYQC5, YEAR4,
					// YYMM8 could fall in the same category, but they were treated above by 
					// making up day and month values.
					// The following formats could potentially be resolved, but would require extra  
					// coding and verification on how VA counts weeks: WEEKV5, WEEKV7, WEEKV9, WEEKV0
					for (var r = 0; r < arrayData.length; r++) {
	                    arrayData[r][c] = '.';
                	}	
					console.log("WARNING: Columns formated as JULDAY1, WEEKV2, WEEKV3, WEEKV5, WEEKV7, WEEKV9, WEEKV0 are not supported: values set to missing.");
                }
				// Other transformations should be added here as needed.
				//else {  
				//	// The actual date format must be one of those already supported by Date object: no transformation needed
				//	// E.g.: DATE11, WORDDATE28
				//	for (var r = 0; r < arrayData.length; r++) {
				//		var dateStr = arrayData[r][c].trim();
				//		if (dateStr != '.') {
				//			dateStr = dateStr+' 00:00:00.000Z';
				//			arrayData[r][c] = (Date.parse(dateStr)-sasDateBaseline)/numMillisecInADay; // number of days from Jan 1st 1960
				//		}
				//	}	
				//}
			}
			else { // colInfo.type == "datetime"
				colInfo.type4job = "NUMERIC"; // corresponding type for SAS job
				if (!colInfo.format)
					continue;
				colInfo.format.name4job = colInfo.format.name;
				colInfo.format.width4job = colInfo.format.width; 
				colInfo.format.precision4job = colInfo.format.precision; // almost always 0 for datetime
				if (colInfo.format.formatString == "DTDATE11") {  // MMM/DD/YYYY
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = datetimeStr+' 00:00:00.000Z'; // = MMM/DD/YYYY 00:00:00.000Z
							datetimeStr = datetimeStr.substr(7,4)+'-'+getMonthNumber(datetimeStr.substr(0,3))+'-'+datetimeStr.substr(4,2)+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
					colInfo.format.width4job = 9;
				}
				else if (colInfo.format.formatString == "DTDATE9") {  // DDMMMYYYY
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = datetimeStr+' 00:00:00.000Z'; // = MMM/DD/YYYY 00:00:00.000Z
							datetimeStr = datetimeStr.substr(5,4)+'-'+getMonthNumber(datetimeStr.substr(2,3))+'-'+datetimeStr.substr(0,2)+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DATETIME0"    ||  // MMMMMM DD, YYYY HH:mm:SS AM/PM
						 colInfo.format.formatString == "DATETIME10"   ||  // MMM DD, YYYY HH:mm:SS AM/PM
						 colInfo.format.formatString == "DATETIME19"   ||  // WWWWWW, MMMMMM DD, YYYY HH:mm:SS AM/PM
						 colInfo.format.formatString == "DATETIME0.3"  ||  // MMMMMM DD, YYYY HH:mm:SS.zzz AM/PM
						 colInfo.format.formatString == "DATETIME19.3") {  // WWWWWW, MMMMMM DD, YYYY HH:mm:SS.zzz AM/PM
					// This datetime format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = datetimeStr+' Z'; // = <WWWWWW> MMM<MMMMMM> DD, YYYY HH:mm:SS<.zzz> AM/PM Z
							var firstSpace = datetimeStr.indexOf(' ');
							if (datetimeStr.substr(firstSpace-1,1) == ',') datetimeStr = datetimeStr.substr(firstSpace+1).trim();  // = MMM<MMMMMM> DD, YYYY HH:mm:SS<.zzz> AM/PM
							var month = datetimeStr.substr(0,datetimeStr.indexOf(' ')); // = MMM<MMMMMM>
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = DD, YYYY HH:mm:SS<.zzz> AM/PM
							var day = datetimeStr.substr(0,datetimeStr.indexOf(',')); // = DD
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = YYYY HH:mm:SS<.zzz> AM/PM
							var year = datetimeStr.substr(0,datetimeStr.indexOf(' ')); // = YYYY
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = HH:mm:SS<.zzz> AM/PM
							var hour = datetimeStr.substr(0,datetimeStr.indexOf(':')); // = HH
							var ampm = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = AM/PM
							if (ampm == "PM") hour = parseInt(hour,10)+12;
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(':')+1,datetimeStr.indexOf(' ')-datetimeStr.indexOf(':')-1).trim(); // = mm:SS<.zzz>
							if (datetimeStr.length == 5) datetimeStr = datetimeStr + ".000";
							datetimeStr = year+'-'+getMonthNumber(month)+'-'+day+' '+hour+':'+datetimeStr+'Z'; // = YYYY-MM-DD HH:mm:SS<.zzz>Z
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
					colInfo.format.width4job = 22;
				}
				else if (colInfo.format.formatString == "DTWKDATX28") {  // WWWWWW, MMMMMM DD, YYYY
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = datetimeStr+' 00:00:00.000Z'; // = WWWWWW, MMMMMM DD, YYYY 00:00:00.000Z
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(',')+1).trim(); // = September 23, 2020
							var month = datetimeStr.substr(0,datetimeStr.indexOf(' ')); // = September
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = 23, 2020
							var day = datetimeStr.substr(0,datetimeStr.indexOf(',')); // = 23
							var year = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = 2020
							datetimeStr = year+'-'+getMonthNumber(month)+'-'+day+' 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DTMONYY7") {  // MMMYYYY
					// This date format is one of those already supported by Date object: no transformation needed
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = datetimeStr+' 00:00:00.000Z'; // = MMMYYYY 00:00:00.000Z
							datetimeStr = datetimeStr.substr(3)+'-'+getMonthNumber(datetimeStr.substr(0,3))+'-01 00:00:00.000Z'; // = YYYY-MM-DD 00:00:00.000Z
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DTWKDATX3"  || // WWW
						 colInfo.format.formatString == "DTWKDATX9") {  // WWWWWW
					// Cannot accurately create the datetime. 
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							datetimeStr = (datetimeStr.substr(0,3)=="Sun" ? '1960-01-03 00:00:00.000Z' :
										  (datetimeStr.substr(0,3)=="Mon" ? '1960-01-04 00:00:00.000Z' :
										  (datetimeStr.substr(0,3)=="Tue" ? '1960-01-05 00:00:00.000Z' :
										  (datetimeStr.substr(0,3)=="Wed" ? '1960-01-06 00:00:00.000Z' :
										  (datetimeStr.substr(0,3)=="Thu" ? '1960-01-07 00:00:00.000Z' :
										  (datetimeStr.substr(0,3)=="Fri" ? '1960-01-08 00:00:00.000Z' : 
																			'1960-01-09 00:00:00.000Z'
							))))));
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "DTYYQC5") { // Qnd quarter YYYY
					// Cannot accurately create the datetime. 
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							var qtr=datetimeStr.substr(0,1);
							var MM=(qtr=='1'?'01':(qtr=='2'?'04':(qtr=='3'?'07':'10')));
							datetimeStr = datetimeStr.substr(12)+'-'+MM+'-01 00:00:00.000Z'; // = YYYY-MM-01 00:00:00.000Z
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
				}
				else if (colInfo.format.formatString == "TIMEAMPM5" ||  // HH:MM AM/PM
						 colInfo.format.formatString == "TIMEAMPM8") {  // HH:MM:SS AM/PM
					// Cannot accurately create the datetime. 
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = 'Jan 1960 '+datetimeStr+' Z'; // = MMM YYYY HH:MM AM/PM Z *OR* MMM YYYY HH:MM:SS AM/PM Z 
							var hour = datetimeStr.substr(0,datetimeStr.indexOf(':')); // = HH
							var ampm = datetimeStr.substr(datetimeStr.indexOf(' ')+1).trim(); // = AM/PM
							if (ampm == "PM") hour = parseInt(hour,10)+12;
							datetimeStr = datetimeStr.substr(datetimeStr.indexOf(':')+1,datetimeStr.indexOf(' ')-datetimeStr.indexOf(':')-1).trim(); // = MM *OR* MM:SS
							if (datetimeStr.length == 2) datetimeStr = datetimeStr + ":00";
							datetimeStr = '1960-01-01 '+hour+':'+datetimeStr+'.000Z'; // = 1960-01-01 HH:MM:00.000Z *OR* 1960-01-01 HH:MM:SS.000Z 
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
					colInfo.format.width4job = (colInfo.format.formatString == "TIMEAMPM5" ? 8 : 11);
				}
				else if (colInfo.format.formatString == "TIMEAMPM2") { // HH
					// Cannot accurately create the datetime. 
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = 'Jan 1960 '+datetimeStr+':00:00.000Z'; // = Jan 1960 HH:00:00.000Z 
							datetimeStr = '1960-01-01 '+datetimeStr+':00:00.000Z'; // = 1960-01-01 HH:00:00.000Z 
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
					colInfo.format.width4job = 5; 
				}
				else if (colInfo.format.formatString == "DTYEAR10") { // YYYY
					// Cannot accurately create the datetime. 
					for (var r = 0; r < arrayData.length; r++) {
						var datetimeStr = arrayData[r][c].trim();
						if (datetimeStr != '.') {
							//datetimeStr = 'Jan '+datetimeStr+' 00:00:00.000Z'; // = Jan YYYY 00:00:00.000Z 
							datetimeStr = datetimeStr+'-01-01 00:00:00.000Z'; // = YYYY-01-01 00:00:00.000Z 
							arrayData[r][c] = (Date.parse(datetimeStr)-sasDateBaseline)/1000; // number of seconds from Jan 1st 1960
						}
					}
					colInfo.format.width4job = 4; 
				}
			}
		}
	};
	
	
	jobUtil.pingApp = function(app) {
		jq.ajax({
			url: ("/"+app+"/keepalive"), 
			method: "GET"
		})
		.then(function (data) {
			// do nothing
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			console.error('******ERROR:pingApp******');
			console.log("jqXHR: ",jqXHR);
			console.log("textStatus: ",textStatus);
			console.log("errorThrown: ",errorThrown);
		});
	};
	
	
	jobUtil.keepAppAlive = function(app) {
		setInterval(function(){
			jobUtil.pingApp(app);
		}, 1000 * 60);
	};

	if (!window.va)
		window.va = {};
    window.va.jobUtil = jobUtil;

})(window);