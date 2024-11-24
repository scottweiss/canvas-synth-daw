import { ADSR } from "../../audio/ADSR";
import { AudioEngine } from "../../audio/AudioEngine";
import { Adsr, CsdAdsr } from "../csd-adsr/csd-adsr";
import { CsdDrumKit } from "../csd-drum-kit/csd-drum-kit";
import { CsdEqualizer } from "../csd-equalizer/csd-equalizer";
import { CsdPiano } from "../csd-piano/csd-piano";
import { CsdRadioButtonGroup } from "../csd-radio-button-group/csd-radio-button-group";
import { CsdVisualizer } from "../csd-visualizer/csd-visualizer";
import styles from "./csd-synth.scss?inline";

export class CsdSynth extends HTMLElement {
  waveType: OscillatorType;

  pianoRef: CsdPiano;
  adsrRef: CsdAdsr;
  adsr: Adsr;
  audioEngine: AudioEngine;
  visualizer: CsdVisualizer;
  equalizer: CsdEqualizer;
  drumKit: CsdDrumKit;

  constructor() {
    super();

    this.audioEngine = AudioEngine.getInstance();
    this.adsr = ADSR.getInstance().adsr;
    this.visualizer = new CsdVisualizer();
    this.equalizer = new CsdEqualizer();
    this.waveType = "sawtooth";
    this.drumKit = new CsdDrumKit();

    this.pianoRef = new CsdPiano({
      adsr: this.adsr,
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

    const waveSelect = new CsdRadioButtonGroup({
      id: "wave-select",
      legend: "wave type",
      options: [
        { id: "sawtooth", label: "sawtooth" },
        { id: "sine", label: "sine" },
        { id: "square", label: "square" },
        { id: "triangle", label: "triangle" },
      ],
      value: this.waveType,
    });
    waveSelect.value = this.waveType;
    waveSelect.addEventListener(
      "CsdRadioButtonGroupValueChange",
      (event: Event) => {
        this.waveType = (event as CustomEvent).detail.value;
        this.pianoRef.waveType = (event as CustomEvent).detail
          .value as OscillatorType;
      },
    );

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);

    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.adoptedStyleSheets.push(sheet);
    shadowRoot.append(
      this.renderSvg(),
      waveSelect,
      this.visualizer,
      this.equalizer,
      this.adsrRef,
      this.pianoRef,
      // this.drumKit,
    );
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
