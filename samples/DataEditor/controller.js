class Controller {
  constructor(model, view) {
    this.model = model
    this.view = view

    this.view.bindDataReceived(this.handleDataReceived);
    this.view.bindToggleInsert(this.handleToggleInsert);
    this.view.bindSubmit(this.handleSubmit);
    this.model.bindValuesChanged(this.onValuesChanged);

  }

  handleDataReceived = (resultData) => {
    console.log(resultData);
    var _resultName = resultData.resultName;
    this.model.selections = va.contentUtil.initializeSelections(resultData);
    console.log(this.model.selections);
  
    if (!this.model.caslib || !this.model.castab || !this.model.id_columns) {
      var msg = 	"Check URL input parameters for:\n" +
            "caslib = source table CAS library\n" +
            "castab = source table\n" +
            "id_columns = column(s) containing unique id of row to be updated (column name, not label)";
      va.messagingUtil.postInstructionalMessage(_resultName, msg);
      this.view.disableDataEntry();
      return;
    }

    if (resultData.columns.length <= 1 ) {
      var msg = 	"This object requires at least one role assignment:\n" +
            "1. unique id of row to be updated";
      va.messagingUtil.postInstructionalMessage(_resultName, msg);
      this.view.disableDataEntry();
      return;
    }
  
    if (this.model.selections.length !== 1) {
      console.log("There is no row selected (or more than one was selected)");
      // var textarea = document.getElementById('text-input');
      // textarea.innerHTML = "Please, select one row";
      this.view.disableDataEntry();
      return;
    }
    if (this.model.currentSessionId) {
      this.view.enableDataEntry();
      this.view.insert.checked=false;
      this.model.initializeData(resultData);
    }
  }

  onValuesChanged = (responseVals) => {
    this.view.displayInputs(responseVals);
  }

  handleToggleInsert = (insert) => {
    this.model.toggleInsert(insert);
  }

  handleSubmit = () => {
    this.model.responseVals.forEach((item, index) => {
      if (this.model.responseVals[index].visible == true ) {
        this.model.responseVals[index].value = this.view.inputs.querySelector("[id='" + item.name + "']").value;
      }
    });
    this.model.submit()
    .then(response => {
      this.view.textarea.innerHTML = "Updated at " + new Date().toLocaleString();
      va.messagingUtil.postSelectionMessage(this.model.resultData.resultName,[]);
        
      // re-selects the data in the source object after 1 second (timer needed to allow VA to refresh - empyric)
      setTimeout(va.messagingUtil.postSelectionMessage(this.model.resultData.resultName, this.model.selections), 1000);
    })
  }
}

const app = new Controller(new Model(), new View());
app.model.init();