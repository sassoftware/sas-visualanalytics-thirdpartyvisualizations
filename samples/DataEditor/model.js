class Model {
  /**
   * Create a model
   * @constructor
   */
  constructor() {
    this.serverName;
    this.currentSessionId;
    this.selections = [];
    this.caslib = va.messagingUtil.getUrlParams("caslib");
    this.castab = va.messagingUtil.getUrlParams("castab");
    this.id_column_name=va.messagingUtil.getUrlParams("id_column_name");
    this.id_columns;
    this.setIdColumns();
    this.idType;
    this.idFormat;
    this.idVal;
    this.target_columns = [];
    this.maptab = va.messagingUtil.getUrlParams("maptab");
    this.responseVals = [];
    this.lookupVals = [];
    this.insert = false;
    this.resultData = {};
    this.message = "";
    this.tempTable = "tmp";
    this.params;
    this.csvData;
  }

  /**
   * Initialize the backend - CAS Session and data lookups
   */
  init() {
    va.casUtil.startCasSession()
    .then(sessionInfo => {
      console.log("casServerName: "+sessionInfo.casServerName);
      console.log("sessionId: "+sessionInfo.sessionId);
      this.serverName = sessionInfo.casServerName
      this.currentSessionId = sessionInfo.sessionId;
      if (!this.currentSessionId) {
        alert("Unable to obtain the session ID.\nPlease refresh/re-open the report.");
        this.message = "Unable to obtain the session ID.\nPlease refresh/re-open the report.";
      }
    })
    .then(response => this.fetchData())
    .then(result => this.fetchMappings())
    .then(result2 => this.onValuesChanged(this.responseVals));;
  }

  setIdColumns() {
    this.id_columns = [];
    var idColString = va.messagingUtil.getUrlParams("id_columns");
    var id_columns = [];
    if (idColString != null) {
      id_columns = idColString.split(',');
      }
    else {
      id_columns = [this.id_column_name];
    }
    id_columns.forEach(col => {
      this.id_columns.push({"name": col});
    })
    console.log(this.id_columns);
  }
  /**
   * Binding for on VA Selection Change
   * @param {function} callback 
   */
  bindValuesChanged(callback) {
    this.onValuesChanged = callback
  }

  /**
   * Sets all data based on VA Selection
   * @param {Object} resultData 
   */
  initializeData(resultData) {
    this.resultData = resultData;
    this.setTargetColumns(resultData);
    this.setIdType(resultData);
    var rowId = this.selections[0].row;
    this.idVal = resultData.data[rowId][0];
    this.setIdVals();
    this.fetchData().then(this.onValuesChanged(this.responseVals));
  }

  /**
   * Sets Values for ID Variables
   */
  setIdVals() {
    var rowId = this.selections[0].row;
    this.idVals = [];
    this.id_columns.forEach(col => {
      var colId = this.resultData.columns.findIndex(element => element.label === col.name);
      if (colId == -1) {this.message = "Please assign role for " + col.name; console.log("this.message");}
      else {
        col.value = this.resultData.data[rowId][colId];
        col.type = this.resultData.columns[colId].type;
        col.format = this.resultData.columns[colId].format;
      }
    });
  }

  /**
   * Sets Target Columns based on VA Roles
   * @param {Object} resultData
   */
  setTargetColumns(resultData) {
    var target_columns = [];
    resultData.columns.forEach((item, index) => {
      if (!this.id_columns.find(element => element.name === item.label)) {
        target_columns.push({"name": item.label, "type": item.type, "format": item.format})
      }
      this.target_columns = target_columns;
    })
  }

/**
 * Sets ID Column Type 
 * @param {Object} resultData 
 */
  setIdType(resultData) {
    this.idType = resultData.columns[0].type;
    if (this.idType != "string") {
      // only non-string data have formats
      this.idFormat = this.resultData.columns[0].format.formatString;	
    }
  }



  /**
   * Change visibility of Columns based on whether insert is requested
   * @param {Boolean} insert 
   */
  toggleInsert(insert) {
    this.insert = insert;
    if (this.responseVals.length != 0) {
      if (insert) {
        console.log("checked")
        this.responseVals.forEach((item, index) => {
          if (index > 0) this.responseVals[index].visible = true;
        });
      } else {
        console.log("unchecked")
        this.responseVals.forEach((item, index) => {
          this.responseVals[index].visible = this.responseVals[index].target;
        });
      }
      this.onValuesChanged(this.responseVals);
    }
  }

  applyLookups() {
    this.lookupVals.forEach(lookup => {
      if (this.responseVals.some(element => element.name === lookup.name)) {
        var index = this.responseVals.findIndex(element => element.name === lookup.name);
        this.responseVals[index].lookups=lookup;
      }
    });
  }

  /**
   * Fetches the contents of a CAS Table based on JSON parameters
   * @param {Object} actionPostData 
   * @returns {Promise}
   */
  fetchCasTab(actionPostData) {
    if (this.currentSessionId) {
      return va.casUtil.casAction(this.serverName, this.currentSessionId, "fetch", JSON.stringify(actionPostData))
      .then(response => {
        if (response.status != 0) {
          console.log("Fetch failed:", response);
          return response;	
        }
        if (response.results.Fetch.rows.length == 0)  {
          console.log("Fetch failed (no data returned):", response);
          return response;	
        }
        console.log("Fetched data:", response);
        return response;
      });
    }
  }

  fetchMappings() {
    if (this.currentSessionId && this.maptab) {
      var actionPostData = {
        "table": {
          "name":this.maptab, 
          "caslib":this.caslib
        }
      };
      return this.fetchCasTab(actionPostData)
      .then(response => {
        response.results.Fetch.rows.forEach(item => {
          var lookupName = item[1];
          var actionPostData = {"table":{"name":item[2], "caslib":this.caslib}, "fetchVars":[item[3], item[4]]};
          // console.log(actionPostData);
          this.fetchCasTab(actionPostData)
          .then(response => {
            var lookup = {"name": lookupName, "values":[], "labels":[]}
            response.results.Fetch.rows.forEach(item => {
              lookup.values.push(item[1]);
              lookup.labels.push(item[2]);
            });
            this.lookupVals.push(lookup);
          });
        });
        console.log(this.responseVals);
      });
    }
  }

  fetchData() {
    if (this.currentSessionId) {
      // console.log(this.idVal);
      var whereExpression = this.createWhere();
    
      var actionPostData = {
        "table": {
          "name":this.castab, 
          "caslib":this.caslib, 
          "where": whereExpression
        }
      };
      console.log("actionPostData:", actionPostData);
      // console.log(this);
      return this.fetchCasTab(actionPostData)
      .then(response => {
        // console.log(response.results.Fetch.schema);
        // console.log("Target Columns:", this.target_columns);
        this.responseVals = response.results.Fetch.schema;
        response.results.Fetch.rows[0].forEach((item, index) => {
          this.responseVals[index].value = item;
          if (this.target_columns.some(element => element.name === this.responseVals[index].name)) {
            this.responseVals[index].target = true;
          }
          else this.responseVals[index].target = false;
        });
        this.toggleInsert(false);
        this.applyLookups();
      })
      .then(response => {
        // console.log(this.responseVals);
        this.onValuesChanged(this.responseVals);
      });
    }
  }

  insertData() {
    return va.casUtil.casAction(this.serverName, this.currentSessionId, 'table.dropTable', JSON.stringify({'caslib':this.caslib, 'name':this.tempTable, 'quiet': true}))
    .then(data => va.casUtil.getCsrfToken('casProxy'))
    .then(proxyToken => {
      var vars = [];
      var inData = "";
      this.responseVals.forEach((item, index) => {
        if (index > 1) inData = inData + ",";
        if (index > 0) {
          if (item.type=="string") vars[(index - 1)] = {'name': item.name, 'length': item.width, 'type': 'char'};
          else vars[(index - 1)] = {'name': item.name, 'type': item.type};
  
          var fmtValue = ((item.type=='string')?(item.value):
                    ((item.type=='date')?("'" + item.value + "'d"):
                    ((item.type=='datetime')?("'" + item.value + "'dt"):
                    (item.value))))
          inData = inData + fmtValue;
        }
      });
      var params = {
        'casout':{'caslib': this.caslib, 'name': 'tmp', 'promote': true},
        'importOptions':{'fileType':'CSV', 'vars':vars, 'getNames':false}
      }
      var requestHeaders = {
        'X-CSRF-TOKEN': proxyToken,
        'JSON-Parameters': JSON.stringify(params)
      };
      return jq.ajax({
        url: ("/casProxy/servers/" + this.serverName + "/cas/sessions/" + this.currentSessionId + "/actions/table.upload"),
        method: "PUT",
        contentType: 'text/csv',
        headers: requestHeaders,
        data: inData
      })
    })
    .then(data => {
      var dsCode = 'Data ' + this.caslib + '.' + this.castab + ' (append=yes); set ' + this.caslib + '.tmp; run;';
      return va.casUtil.casAction(this.serverName, this.currentSessionId, 'dataStep.runCode', JSON.stringify({'code': dsCode}));
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.error('******ERROR:casAction******');
      console.log("jqXHR: ",jqXHR);
      console.log("textStatus: ",textStatus);
      console.log("errorThrown: ",errorThrown);
      return null;
    })
  }

  updateData() {
    var whereExpression = this.createWhere();
    var setVars = [];
    this.responseVals.forEach(item => {
      if (item.target==true) {
        var fmtValue = ((item.type=='string')?("'" + item.value + "'"):
                ((item.type=='date')?("'" + item.value + "'d"):
                ((item.type=='datetime')?("'" + item.value + "'dt"):
                ("'" + item.value + "'"))))
        setVars.push({"var": item.name, "value":fmtValue});
      }
    });
    var actionPostData = {
      "table": {
        "name":this.castab, 
        "caslib":this.caslib, 
        "where": whereExpression
      }, 
      "set": setVars
    };
    console.log("actionPostData (update):", actionPostData);
    return va.casUtil.casAction(this.serverName, this.currentSessionId, "update", JSON.stringify(actionPostData))
  }

  submit() {
    if (this.insert==true) {
      return this.insertData().then(this.onValuesChanged(this.responseVals))
    } else {
      return this.updateData().then(this.onValuesChanged(this.responseVals))
    }
  }

  createWhere() {
    var whereExpression = '';
    if (this.idVal) {
      this.id_columns.forEach((item, index) => {
        if (index > 0) {whereExpression += " and "}
        whereExpression += (item.name + ' = ' + this.getSASStandardConstantValue (item.type, item.format, item.value));
      });
    }
    return whereExpression;
  }

  getSASStandardConstantValue (type, informat, value) {
    var constValue;
    if (type == "string") {
      constValue="'"+value+"'";
    }
    // One of the Date() constructors accept input dates as strings in ISO format, short, and long date formats, such as:
    // "02/22/2012", "02-22-2012" (not Firefox), 
    // "Feb/22/2012", "February/22/2012", "February 22, 2012", "Feb 22, 2012", "February 22 2012", "Feb 22 2012", 
    // "22February2012", "22Feb2012", "22 February 2012", "22 Feb 2012", 
    // "Wednesday, February 22, 2012", "2012/02/22", "2012-02-22" (ISO), 
    // "Feb2012" (not Firefox), "Feb 2012" (not Firefox), "February2012"(not Firefox), "February 2012" (not Firefox)
    // Support for formats other than ISO may be browser and version dependent.
    // It does NOT accept Julian, DD/MM/YYYY, MM/YYYY, MMMMMMM formats. In those cases, a transformation is necessary
    // to put the date string in a supported format.
    // https://www.w3schools.com/js/js_date_formats.asp
    else if (type == "date") {
      // There is room for a lot of improvement here.
      if (informat == "DDMMYY8") { // DD/MM/YYYY
        value = value.substr(6)+'/'+value.substr(3,2)+'/'+value.substr(0,2); // = YYYY/MM/DD
      }
      else if (informat == "DATE9") { // DDMMMYYYY
        value = value.substr(0,2)+value.substr(2,3)+value.substr(5); // = DDMMMYYYY
      }
      else if (informat == "MMYY8") { // MM/YYYY
        value = value.substr(3)+'/'+value.substr(0,2)+'/01'; // = YYYY/MM/01
      }
      else if (informat == "MONTH7" || // MMMYYYY
           informat == "MMYY8") {  // MM/YYYY
        value = '01 '+value; // = 01 MMMYYYY or 01 MM/YYYY
      }
      else if (informat == "MONYY7" || informat == "WORDDATE9" || // MMMMMMMMM -> this format should not be used because it's too much guessing (year and day) to form the date
           informat == "MONTH3" || informat == "WORDDATE3") { // MMM       -> this format should not be used because it's too much guessing (year and day) to form the date
        value = value+' 01 1960'; // = MMM<MMMMMM> 01 1960
      }
      else if (informat == "DAY9") { // DD
        value = '1960/01/'+value; // = 1960/01/DD
      }
      else if (informat == "MONTH2") { // MM
        value = '1960/'+value+'/01'; // = YYYY/MM/01
      }
      else if (informat == "YEAR4") { // YYYY
        value = value+'/01/01'; // = YYYY/01/01
      }
      else if (informat == "YYMM8") { // YYYY/MM
        value = value+'/01'; // = YYYY/MM/01
      }
      // Other transformations should be added here as needed.
      // For example: DOWNAME11, DOWNAME1, JULDAY1, WEEKDATE9, WEEKDATE3, JULIAN7,
      // QTR4, QTR6, YYQC5, WEEKV2, WEEKV3, WEEKV5, WEEKV7, WEEKV9, WEEKV0
      
      var dateTime = new Date(value);
      var dateStr= dateTime.toDateString(); // "Mon Jul 15 2019"
      constValue = "'"+dateStr.substr(8,2)+dateStr.substr(4,3)+dateStr.substr(11,4)+"'d"; // = 'DDMMMYYYY'd = '15Jul2019'd
    }
    else if (type == "datetime") {
      // This generic transformation willl not work for every datetime format.
      // Format specific transformations should be added here as needed.
      var dateTime = new Date(value);
      var dateStr= dateTime.toString(); // "Mon Jul 15 2019 15:46:00 GMT-0500 (Eastern Standard Time)"
      constValue = "'"+dateStr.substr(8,2)+dateStr.substr(4,3)+dateStr.substr(11,4)+":"+dateStr.substr(16,8)+"'dt"; // = 'DDMMMYYYY:HH:MM:SS'dt = '15Jul2019:20:45:00'dt
    }
    else constValue=value; // columns formatted as Time have type equals to number and don't need any transformation
    
    return constValue; 
  }
}