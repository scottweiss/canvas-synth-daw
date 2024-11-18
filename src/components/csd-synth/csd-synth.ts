import { ADSR } from "../../midi/ADSR";
import { AudioEngine } from "../../midi/AudioEngine";
import { Adsr, CsdAdsr } from "../csd-adsr/csd-adsr";
import { CsdPiano } from "../csd-piano/csd-piano";
import { CsdVisualizer } from "../csd-visualizer/csd-visualizer";
import styles from "./csd-synth.scss?inline";

export class CsdSynth extends HTMLElement {
  waveType: OscillatorType;

  pianoRef: CsdPiano;
  adsrRef: CsdAdsr;
  adsr: Adsr;
  audioEngine: AudioEngine;
  visualizer: CsdVisualizer;

  constructor() {
    super();

    this.audioEngine = AudioEngine.getInstance();
    this.adsr = ADSR.getInstance().adsr;
    this.visualizer = new CsdVisualizer();
    this.waveType = "sawtooth";

    this.pianoRef = new CsdPiano({
      adsr: this.adsr,
      // audioEngine: this.audioEngine,
    });
    this.adsrRef = new CsdAdsr({ adsr: this.adsr });

    this.adsrRef.addEventListener("CsdAdsr", (event) => {
      const adsrValue = (event as CustomEvent).detail.adsr;
      if (adsrValue) {
        ADSR.getInstance().adsr = adsrValue;
        this.adsr = adsrValue;
        this.pianoRef.adsr = this.adsr;
      }
    });

    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = "Wave type";

    fieldset.append(
      legend,
      this.renderRadio("sawtooth"),
      this.renderRadio("sine"),
      this.renderRadio("square"),
      this.renderRadio("triangle"),
    );

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(
      this.renderSvg(),
      fieldset,
      this.visualizer,
      this.adsrRef,
      this.pianoRef,
    );
  }

  renderRadio(labelText: string): HTMLLabelElement {
    const label = document.createElement("label");
    const labelSpan = document.createElement("span");
    labelSpan.textContent = labelText;
    const radio = document.createElement("input");
    radio.name = "waveType";
    radio.type = "radio";
    radio.value = labelText;
    radio.checked = this.waveType === labelText;

    radio.addEventListener("click", (event) => {
      console.log(event);
      this.pianoRef.waveType = labelText as OscillatorType;
    });
    label.append(radio, labelSpan);

    return label;
  }
  renderSelectOption(label: string, value: string): HTMLElement {
    const option = document.createElement("option");
    option.text = label;
    option.value = value;
    return option;
  }

  renderSvg(): SVGSVGElement {
    const svgRef = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter",
    );
    const turbulence = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feTurbulence",
    );
    const lighting = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feDiffuseLighting",
    );
    const distantLight = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feDistantLight",
    );
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    svgRef.setAttribute("width", "100%");
    svgRef.setAttribute("height", "100%");

    filter.setAttribute("id", "plasticTexture");
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "0%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");

    turbulence.setAttribute("type", "fractalNoise");
    turbulence.setAttribute("baseFrequency", "1.2");
    turbulence.setAttribute("result", "noise");
    turbulence.setAttribute("numOctaves", "8");

    lighting.setAttribute("in", "noise");
    lighting.setAttribute("lighting-color", "#333");
    lighting.setAttribute("surfaceScale", "2");

    distantLight.setAttribute("azimuth", "45");
    distantLight.setAttribute("elevation", "60");

    lighting.append(distantLight);

    filter.append(turbulence, lighting);

    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    rect.setAttribute("filter", "url(#plasticTexture)");
    rect.setAttribute("fill", "none");

    svgRef.append(filter, rect);

    return svgRef;
  }
}

// Define the new element
customElements.define("csd-synth", CsdSynth);
