import styles from "./csd-radio-button-group.scss?inline";

type CsdOption = {
    id: string,
    label: string
}

export type CsdRadioButtonGroupProps = {
    id: string;
    legend: string;
    options: Array<CsdOption>;
    value?: string;

}

export class CsdRadioButtonGroup extends HTMLElement {
    #value: string | undefined;

  constructor(props:  CsdRadioButtonGroupProps) {
    super();
    if (props.value) {
        this.value = props.value  
    }
   
    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);

    const fieldset = this.renderFieldset(props.legend);

    props.options.map((option) => {
        fieldset.append(this.renderRadio(option));
    })
    shadowRoot.append( 
        fieldset
    );
  }

  get value(): string | undefined {
    return this.#value;
  }

  set value(value: string) {
    this.#value = value;
  }

  renderFieldset(legend: string) {
    const fieldsetRef = document.createElement('fieldset');
    const legendRef = document.createElement('legend');
    legendRef.textContent = legend;

    fieldsetRef.appendChild(legendRef);
    return fieldsetRef;
  } 

  
  renderRadio(option: CsdOption): HTMLLabelElement {
    const label = document.createElement("label");
    const labelSpan = document.createElement("span");
    labelSpan.textContent = option.label;
    const radio = document.createElement("input");
    radio.name = "waveType";
    radio.type = "radio";
    radio.classList.add("sr-only");

    radio.checked = option.id == this.value;
    // radio.value = option;
    // radio.checked = this.waveType === labelText;

    radio.addEventListener("click", (event) => {
        console.log(event)
        this.value = option.id;
        this.dispatchEvent(new CustomEvent('CsdRadioButtonGroupValueChange', {
            detail: {
                value: this.value
            }
        }))
    })
    label.append(radio, labelSpan);

    return label;
  }

}

// Define the new element
customElements.define("csd-radio-button-group", CsdRadioButtonGroup);
