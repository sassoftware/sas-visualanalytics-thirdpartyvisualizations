# SAS Visual Analytics third party visualizations

This project contains code samples that can be used as data-driven content within a SAS Visual Analytics (VA) report. For additional information, see [Programming Considerations for Data-Driven Visualizations](http://go.documentation.sas.com/?cdcId=vacdc&cdcVersion=8.2&docsetId=varef&docsetTarget=n109mqtyl6quiun1mwfgtcn2s68b.htm&locale=en).

The JavaScript content for your third-party visualizations must be stored on a web server. One approach to hosting is to use Node.js. For more information about using Node.js for data-driven content, see [Deploy a custom web application in the cloud for Data-Driven Content object in SAS Viya 4](https://communities.sas.com/t5/SAS-Communities-Library/Deploy-a-custom-web-application-in-the-cloud-for-Data-Driven/ta-p/687141).

## RECENTLY ADDED - the Data-driven Content (DDC) Server!

In addition to accessing [samples](./samples/) from the given folder, users may also like to refer to this new section - a [DDC Server](./ddc-server/), which pre-packages these sample files in an easily accessible web application that can be deployed alongside SAS Viya! **In addition**, users will also be able to upload their own custom DDCs to their deployed instance of the DDC Server.  Check this [folder](./ddc-server/) and [README](./ddc-server/README.md) out in order to learn more.


---
## util/messagingUtil.js

It contains the functions you need to send/receive messages to/from SAS Visual Analytics. You must include the following line in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="../util/messagingUtil.js"></script>
```
### setOnDataReceivedCallback

Sets a callback function to handle messages received from VA.

_Usage:_
```javascript
va.messagingUtil.setOnDataReceivedCallback(callback)
```
* `callback` is the callback function name that you must define.

### postSelectionMessage

Sends back to VA a message containing selections made in the third-party visualization. VA will use that information to either filter or select (brush) other report objects, depending on the Actions defined between the data-driven object and other VA report objects. It leverages function `postMessage` internally.

_Usage:_
```javascript
va.messagingUtil.postSelectionMessage(resultName, selectedRows)
```
* `resultName`is the name of the associated query result, which is obtained from the message received from VA (event.data.resultName).
* `selectedRows` is an array of numbers (e.g. `[0, 3, 4]`) or objects (e.g. `[{row: 0}, {row: 3}, {row: 4}]`) that contains the indexes of the selected rows, as they appear in event.data.data.

### postInstructionalMessage

Sends back to VA an instructional message. This message is displayed in the data-driven content object in the VA report and is useful for sending text messages back to report authors informing required roles, their assignment order, types, etc. It leverages function `postMessage` internally.

_Usage:_
```javascript
va.messagingUtil.postInstructionalMessage(resultName, strMessage)
```
* `resultName`is the name of the associated query result, which is obtained from the message received from VA (event.data.resultName).
* `strMessage` is the text message to be sent.

### postMessage

Sends back a message to VA.

_Usage:_
```javascript
va.messagingUtil.postMessage(objMessage)
```
* `objMessage` is an object that contains either the selection or the instructional message to be sent to VA. Functions  `postSelectionMessage` and `postInstructionalMessage` are wrappers for this function.   
Example of selection message:   
`{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`resultName: "dd46",`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`selections: [0, 3, 4]`   
`}`   
Example of instructional message:   
`{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`resultName: "dd34",`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`message: "Please, assign
proper roles"`   
`}`

### getUrlParams

Extracts parameter values assigned directly in the Data-Driven Content URL.

_Usage:_
```javascript
value = va.messagingUtil.getUrlParams(name)
```
* `name` is the optional parameter name.
* Possible return values:
If `name` is an existing parameter, returns it's value
If `name`is not an existing parameter, returns `null`
If `name`is not informed, returns and object with all parameters name-value pairs: `{name1:value1, name2:value2, name3:value3, ...}`

---
## util/contentUtil.js

It contains the functions you need to validate the data received from VA. You must include the following line in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="../util/contentUtil.js"></script>
```
### setupResizeListener

Sets a callback function to handle window resizing events.

_Usage:_
```javascript
va.contentUtil.setupResizeListeners(callback)
```
* `callback` is the callback function name that you must define. That's normally the function that re-draws the chart.

### validateRoles

Checks if the data received from VA have all the columns (number, sequence, and type) required for the visualization.

_Usage:_
```javascript
isValid = va.contentUtil.validateRoles(resultData, expectedTypes, optionalTypes)
```
* `resultData` is the message received from VA (event.data).
* `expectedTypes` is an array describing the types of the columns that are required. The order is important and indicates the sequence that columns are assigned in the Roles tab in VA. Example: ["string", "number", "number"]. Valid types are "string", "number", and "date".
* `optionalTypes` is an array describing the types of the columns that are optional. The order is important and indicates the sequence that columns are assigned in the Roles tab in VA, after the required columns. Example: ["string", "number", "number"]. Because they are optional, the **number** of optional columns and optional types provided don't need to match. Type comparison will be made while there is still a column and a type to be compared, and the rest will be ignored. One or more optional columns of same type can be represented as a single type instead of an array, for example: "number" indicates that all optional columns, if existent, must be numeric columns. An empty array [] indicates their types can be anything. A value null indicates no optional columns are accepted. Valid types are "string", "number", and "date".
* Returns _true_ or _false_.

### initializeSelections

Uses the message received from VA to extract information about selections made in VA objects. After extracting selection information, the "brush" column is removed from the message.

_Usage:_
```javascript
selections = va.contentUtil.initializeSelections(resultData)
```
* `resultData` is the message received from VA (event.data).
* Returns `selections`, an array of objects containing the indexes of the selected rows (e.g. `[{row: 2}, {row: 5}]`)

### convertDateColumns

Transforms the message received from VA so that date values (represented as strings) are converted to Date objects. This standardizes date representation and might be helpful to support further transformations and formatting on dates.

_Usage:_
```javascript
va.contentUtil.convertDateColumns(resultData)
```
* `resultData` is the message received from VA (event.data).

### getVAParameters

Extracts parameter information from message received from VA.

_Usage:_
```javascript
parameters = va.messagingUtil.getVAParameters(resultData)
```
* `resultData` is the message received from VA (event.data).
* Returns `parameters`, an object containing each parameter name and value (e.g. `{<param_label_1>:<param_value_1>, ... , <param_label_n>:<param_value_n>}`). If a certain `<param_label>` contains multiple values, its `<param_value>` is an array.

---
## thirdPartyHelpers/google.js

It contains helper functions you most likely need with Google Charts. You must include the following lines in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<script type="text/javascript" src="../thirdPartyHelpers/google.js"></script>
```
### createDataTable

Uses the `data` and `columns` keys from the VA message to create a DataTable object. Google Charts take DataTable as input data for its charts, but in addition to that, DataTable offers a series of methods that can help with table manipulation. More information on DataTable can be found [here](https://developers.google.com/chart/interactive/docs/reference#DataTable).

_Usage:_
```javascript
dataTable = va.googleHelper.createDataTable(resultData)
```
* `resultData` is the message received from VA (event.data).
* Returns `dataTable`, the input data as a DataTable object.

### formatData

Uses the columns metadata within the message received from VA to update column formats in a DataTable object. Only numeric and date columns are affected. Supported formats are: DOLLAR, COMMA, F, BEST, and PERCENT for numeric, and MONYY, MMYY, MMDDYY, DATE, DDMMYY, WORDDATE, YYMMDD, and DATETIME for dates. Other column formats are kept unchanged.

_Usage:_
```javascript
va.googleHelper.formatData(dataTable, resultData)
```
* `dataTable` is the input data as a DataTable object.
* `resultData` is the message received from VA (event.data).

### formatAxis

Uses the columns metadata within the message received from VA to update/add a vAxis.format or a hAxis.format in the Google Charts options variable. Only numeric columns are affected. Supported VA formats are: DOLLAR, COMMA, F, BEST, and PERCENT. Other column formats are kept unchanged.

_Usage:_
```javascript
va.googleHelper.formatAxis(axis, options, resultData)
```
* `axis` is a string that indicates a vertical or horizontal axis. Valid axis values are `'vAxis'` and `'hAxis'`.
* `options` is the JSON object that holds Google Charts options.
* `resultData` is the message received from VA (event.data).
---
## thirdPartyHelpers/d3.js

It contains helper functions you most likely need with D3 charts. You must include the following line in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="../thirdPartyHelpers/d3.js"></script>
```
### configureFormatter

Uses the columns metadata within the message received from VA to configure D3 formats. Only numeric columns are affected. Supported VA formats are: DOLLAR, COMMA, F, BEST, and PERCENT. Other columns formats are kept unchanged.

_Usage:_
```javascript
formatter = va.d3Helper.configureFormatter(resultData)
```
* `resultData` is the message received from VA (event.data).
* Returns `formatter`, an object containing key/value pairs where the key is the column label and the value is a d3.format function for each one of the supported numeric columns (e.g. `{'Average Sales': d3.format('$6,.2f'), 'Percent Comparison': d3.format('4,.1%')}` )

### configureAxisFormatter

Uses the columns metadata within the message received from VA to configure D3 formats. This function is similar to `va.d3Helper.configureFormatter`, but the format returned doesn't have any decimal places. Only numeric columns are affected. Supported VA formats are: DOLLAR, COMMA, F, BEST, and PERCENT. Other columns formats are kept unchanged.

_Usage:_
```javascript
axisFormatter = va.d3Helper.configureAxisFormatter(resultData)
```
* `resultData` is the message received from VA (event.data).
* Returns `axisFormatter`, an object containing key/value pairs where the key is the column label and the value is a d3.format function for each one of the supported numeric columns (e.g. `{'Average Sales': d3.format('$6,f'), 'Percent Comparison': d3.format('4,%')}` )
---
## thirdPartyHelpers/c3.js

It contains helper functions you most likely need with C3 charts. You must include the following line in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="../thirdPartyHelpers/c3.js"></script>
```
### configureChartData

Uses the `data` and `columns` keys from the VA message to create the chart data JSON object, necessary to draw the C3 chart. If necessary, this function also sets the appropriate configuration to unload the existing chart prior to re-drawing it.

_Usage:_
```javascript
chartData = va.c3Helper.configureChartData(resultData, chartType, previousConfig)
```
* `resultData` is the message received from VA (event.data).
* `chartType` is the chart type string as defined in C3 [documentation](http://c3js.org/reference.html#data-type).
* `previousConfig` is the previous `chartData` JSON object that was assigned to the `data`key in function `c3.generate({... , data: , ...})` to draw the C3 chart. Information from `previousConfig` is compared with the information from `resultData` to determine if the existing chart must be unload due to changes in the new data received from VA. `null` indicates there is no previous configuration (chart was never drawn).
* Returns `chartData`, a JSON object to be assigned to the `data` key when calling the function `c3.generate({... , data: chartData, ...})` to draw the C3 chart. It has the following structure:    
`{`   
&nbsp;&nbsp;`type: <chartType parameter>,`   
&nbsp;&nbsp;`x: <label of category column>,`   
&nbsp;&nbsp;`rows:[`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`<array of column labels>,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`<array of row1 values>,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`... ,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`<array of rowN values>`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`]`   
&nbsp;&nbsp;`keys:{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`x: <label of category column>,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`value: <array of all numeric columns labels>`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`}`   
`}`

---
## util/casUtil.js

It contains the functions you need to create CAS sessions and execute CAS actions from SAS Visual Analytics. Those functions were designed and tested with VA 8.3  (SAS Viya 3.4) and above, up to VA 8.5 (SAS Viya 3.5). Internal implementation and REST APIs used may differ depending the the SAS Viya version. Decisions are made based on the VA version detected. You must include the following line in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="../util/casUtil.js"></script>
```
### startCasSession

Leverages SAS Viya REST API to create a CAS session that you can use to execute CAS actions. It uses the following endpoints internally:
VA 8.3 and above on SAS Viya 3.4:
`/casManagement/servers` and `/casProxy/servers/<serverName>/cas/sessions`   
VA 8.5 on SAS Viya 3.5:
`/casManagement/servers` and `/casManagement/servers/<serverName>/sessions`

_Usage:_
```javascript
va.casUtil.startCasSession().then(function(sessionInfo){...})
```
* Alias: `startSession`
* Uses `getCasServerName` and `getAppVersion` internally
* Returns a promise for `sessionInfo`, an object containing CAS server name, CSRF token of the service used to create the session (casManagement or casProxy, depending on the VA version), session id, and session owner user id. For example:   
`{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`casServerName: 'cas-shared-default',`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`csrfToken: 'f00cc954-040b-4407-b5ac-75a22df56ca3',`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`sessionId: '233c1c87-2016-1a41-8e99-461233aa306f',`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`userId: 'sasxyz'`   
`}`

_Note:_
If you have more than one server, it returns the first one on the list.

### casAction

Leverages SAS Viya REST API to execute CAS actions by using the following endpoint: `/casProxy/servers/<serverName>/cas/sessions/<sessId>/actions/<action>`

_Usage:_
```javascript
va.casUtil.casAction(serverName, sessId, action, data).then(function(response){...})
```
* `serverName` is the SAS Viya server name (e.g. 'cas-shared-default')
* `sessId` is the CAS session ID (e.g. '233c1c87-2016-1a41-8e99-461233aa306f')
* `action` is the CAS action (e.g. 'update', 'fetch', etc.)
* `data` is the CAS action dependent payload as an object or in stringified JSON format. E.g. for a fetch action:   
`{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"table": {`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"name": "CARS",`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"caslib": "Public",`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"where": "Origin='Asia'"`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`},`    
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`"fetchVars": [`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`{"name": "Invoice"}`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`]`   
`}`
* Returns a promise for `response`, an object containing the data for the action called. See documentation for specific CAS action in [developers.sas.com](https://developer.sas.com/home.html).

### getCasServerName

Leverages SAS Viya REST API to obtain the CAS server name. It uses the following endpoint internally:
`/casManagement/servers`

_Usage:_
```javascript
va.casUtil.getCasServerName().then(function(serverInfo){...})
```
* Returns a promise for `serverInfo`, an object containing CAS server name and CSRF token of the service used to create the session. For example:   
`{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`casServerName: 'cas-shared-default',`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`csrfToken: 'f00cc954-040b-4407-b5ac-75a22df56ca3'`   
`}`

_Note:_
If you have more than one server, it returns the first one on the list.

### getCsrfToken

Leverages SAS Viya REST API to obtain the CSRF token for a specified service. It uses the following endpoint internally:
`/<service>/`

_Usage:_
```javascript
va.casUtil.getCsrfToken(service).then(function(token){...})
```
* `service` is the name of the service you want to obtain the CSRF token for, e.g. 'casProxy'.
* Returns a promise for `token`, a string containing the CSRF token of the service, e.g. `'f00cc954-040b-4407-b5ac-75a22df56ca3'`.

_Note:_
Token values for each service are cached internally for future calls to this function.

### getAppVersion

Leverages SAS Viya REST API to obtain the version for a specified application. It uses the following endpoint internally:
`/<app>/apiMeta`

_Usage:_
```javascript
va.casUtil.getAppVersion(app).then(function(version){...})
```
* `app` is the name of the application you want to obtain the version for, e.g. `'SASVisualAnalytics'`.
* Returns a promise for `version`, a string containing the application version, e.g. `'8.5'`.

---
## util/jobUtil.js

It contains utility functions to support easier integration between SAS Visual Analytics and SAS Jobs. You must include the following line in the _\<head\>_ of the web page:
```html
<script type="text/javascript" src="../util/jobUtil.js"></script>
```
### PrepareVADataForSASJobs

Transforms the data received from VA and adds extra format information for SAS Jobs to use.

_Usage:_
```javascript
va.jobUtil.PrepareVADataForSASJobs(resultData)
```
* `resultData` is the message received from VA (event.data) that will be transformed.

_Notes:_
* Modifications performed on `resultData.data` depend on the data type:
	* String:
		* missing values come as "(missing)" and are modified to "".
	* Date:
		* values come as formatted strings according to their date formats. They are transformed to their corresponding SAS date numbers expressed as number of days since January 1st, 1960.
		* The following date formats are not supported (generate missing values):
			* Day of Year (JULDAY1). E.g.: 176
			* Week (WEEKV2). E.g.: 26
			* Week (WEEKV3). E.g.: W26
			* Year, Week (WEEKV5). E.g.: 15W26
			* Year, Week, Day (WEEKV7). E.g.: 15W2604
			* Year, Week, Day (WEEKV9). E.g.: 2015W2604
			* Year, Week, Day (WEEKV0). E.g.: 2015-W26-04
		* Some date string representations cannot accurately be mapped to one specific date. The formats below are treated by making up day, month, and year values as needed:
			* Day of Month (DAY9). E.g.: 25
			* Day of Week (DOWNAME11). E.g.: Thursday
			* Day of Week (DOWNAME1). E.g.: Thu
			* Day, Date (WEEKDATE9). E.g.: Thursday
			* Day, Date (WEEKDATE3). E.g.: Thu
			* MMMYYYY (MONYY7). E.g.: Jun2015
			* MMYYYY (MMYY8). E.g.: 06/2015
			* Month (MONTH7). E.g.: June
			* Month (MONTH3). E.g.: Jun
			* Month (MONTH2). E.g.: 6
			* Month, Day, Year (WORDDATE9). E.g.: June
			* Month, Day, Year (WORDDATE3). E.g.: Jun
			* Quarter (QTR4). E.g.: Q2
			* Quarter (QTR6). E.g.: 2nd quarter
			* Quarter, Year (YYQC5). E.g.: 2nd quarter 2015
			* Year (YEAR4). E.g.: 2015
			* YYYYMM (YYMM8). E.g.: 2015/06
	* Datetime:
		* values come as formatted strings according to their datetime formats. They are transformed to their corresponding SAS datetime numbers expressed as number of seconds since January 1st, 1960.
		* Some datetime string representations cannot accurately be mapped to one specific datetime. The formats below are treated by making up day, month, and year values as needed:
			* Day, Date (DTWKDATX3). E.g.: Thu
			* Day, Date (DTWKDATX9). E.g.: Thursday
			* Quarter, Year (DTYYQC5). E.g.: 2nd quarter 2015
			* Time (TIMEAMPM5). E.g.: 03:42 PM
			* Time (TIMEAMPM8). E.g.: 03:42:12 PM
			* Time (TIMEAMPM2). E.g.: 15
			* Year (DTYEAR10). E.g.: 2015

* Formats in VA for number/date/datetime are slightly different compared to SAS Jobs. Job-specific format information is added under `resultData.columns` and depends on the data type and VA format:   
`{`   
&nbsp;&nbsp;`... ,`   
&nbsp;&nbsp;`columns: [`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`{`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`... ,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`name4job: <format_name>,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`type4job: <format_type>,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`width4job: <format_width>,`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`precision4job: <format_precision>`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`},`   
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`...`   
&nbsp;&nbsp;`],`   
&nbsp;&nbsp;`... `   
`}`

### pingApp

Pings the app to keep it alive.

_Usage:_
```javascript
va.jobUtil.pingApp(app)
```
* `app` is the name of the application, e.g. `'SASJobExecution'`.
* Returns a promise.

### keepAppAlive

Calls pingApp on 1 minute intervals to keep the application alive.

_Usage:_
```javascript
va.jobUtil.keepAppAlive(app)
```
* `app` is the name of the application, e.g. `'SASJobExecution'`.
