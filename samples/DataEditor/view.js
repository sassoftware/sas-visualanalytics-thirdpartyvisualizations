class View {
  constructor() {
    this.app = this.getElement('#root');
    this.inputs = this.getElement('#inputs');
    this.textarea = this.getElement('#text-input');
    this.button = this.getElement('#submit-button');
    this.insert = this.getElement('#insert-button');
    this.insert.checked = false;
  }

  // Create an element with an optional CSS class
  createElement(tag, className) {
    const element = document.createElement(tag)
    if (className) element.classList.add(className)

    return element
  }

  // Retrieve an element from the DOM
  getElement(selector) {
    const element = document.querySelector(selector)

    return element
  }

  disableDataEntry() {
    this.textarea.disabled = true;
    this.button.disabled = true;
  }

  enableDataEntry() {
    this.textarea.disabled = false;
    this.button.disabled = false;
  }

  displayInputs(responseVals) {
    while (this.inputs.firstChild) {
      this.inputs.removeChild(this.inputs.firstChild)
    }

    console.log("responseVals: ", responseVals);
    if (responseVals.length === 0) {
      const p = this.createElement('p');
      p.textContent = "No Data";
      this.inputs.append(p);
    } else {
      responseVals.forEach(item => {
        if (item.visible==true) {
          const div = this.createElement('div', 'col');
          const label = this.createElement('label', 'form-label');
          label.for = item.name;
          label.textContent = item.name;

          if (item.hasOwnProperty('lookups')) {
            const input = this.createElement('select', 'form-control');
            input.id = item.name;
            input.value = item.value;
            item.lookups.values.forEach((option,index) => {
              const opt = this.createElement('option');
              opt.textContent = option;
              opt.label = option + ": " + item.lookups.labels[index];
              if (option === item.value) {opt.selected=true};
              input.append(opt);
            })
            div.append(label, input);
          } else {
            const input = this.createElement('input', 'form-control');
            input.id = item.name;
            input.value = item.value;
            div.append(label, input);
          }
                    
          this.inputs.append(div);
        }
      });
    }
  }

  bindDataReceived(handler) {
    va.messagingUtil.setOnDataReceivedCallback(handler)
  }

  bindToggleInsert(handler) {
    this.insert.addEventListener('click', event => {
      console.log(this.insert.checked);
      handler(this.insert.checked);
    })
  }

  bindSubmit(handler) {
    this.button.addEventListener('click', event => {
      console.log("submitted");
      handler();
    })
  }
}