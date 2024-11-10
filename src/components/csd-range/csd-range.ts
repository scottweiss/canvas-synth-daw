import styles from './csd-range.scss?inline';

export class CsdRange extends HTMLElement {
  // rangeDomReference;
  _value: string;
  rangeElement: HTMLInputElement
  inputElement: HTMLInputElement;
  min: number;
  max: number;

    constructor(props: any) {
      super();

      this._value = '0';
      this.min = props.min || .10;
      this.max = props.max || 1;
     

      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);

      const shadowRoot = this.attachShadow({mode: 'open'});

      this.rangeElement = this.renderRangeElement();
      this.inputElement= this.renderRangeValueDisplayElement();

      shadowRoot.adoptedStyleSheets.push(sheet);
      shadowRoot.appendChild(this.inputElement);
      shadowRoot.appendChild(this.rangeElement);

      if (props?.value != null) {
        this._value = props.value;
      }
    }

    set value(value: string){
      this._value = value;
      this.inputElement.value = value;
      this.rangeElement.value = value;

      requestAnimationFrame(() => {
        this.dispatchEvent(new CustomEvent("csdRange", {
          detail: { 
            value: this.value,
           }
        }));
      })
    }

    get value(): string {
      return this._value;
    }




  renderRangeValueDisplayElement(): HTMLInputElement {
    let rangeValueInput = document.createElement('input');
    rangeValueInput.setAttribute('type', 'text');
    rangeValueInput.value = this.value;

    rangeValueInput.addEventListener('input', (event) => {
      this.value = (event.target as any).value;
    });

    return rangeValueInput;
  }
    


    renderRangeElement(): HTMLInputElement {
      let rangeElement = document.createElement('input');
      rangeElement.setAttribute('type', 'range');
      rangeElement.setAttribute('min', String(this.min));
      rangeElement.setAttribute('max', String(this.max));
      rangeElement.setAttribute('step', '0.01')
      rangeElement.value = this.value;

      rangeElement.addEventListener('input', (event) => {
        this.value = (event.target as any).value;
      });
      return rangeElement;
    }


}

// Define the new element
customElements.define('csd-range', CsdRange);