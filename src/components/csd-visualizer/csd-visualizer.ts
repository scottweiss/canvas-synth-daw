
import { AudioEngine } from '../../midi/AudioEngine';
import styles from './csd-visualizer.scss?inline'


export class CsdVisualizer extends HTMLElement {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D | null;
    private audioEngine: AudioEngine;
    private analyserNode: AnalyserNode;

    constructor() {
        super();

        this.audioEngine = AudioEngine.getInstance(); // get the singleton instance of AudioEngine

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        if (!this.context) {
            throw new Error('Could not get 2D rendering context from canvas.');
        }

        

        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(styles);
        
                
        const shadowRoot = this.attachShadow({ mode: 'open' });

        shadowRoot.adoptedStyleSheets.push(styleSheet);

        this.analyserNode = this.audioEngine.getAnalyser(); // use the audio context from AudioEngine
        this.analyserNode.fftSize = 2048;

        shadowRoot.appendChild(this.canvas);
    }

    connectedCallback() {
        this.resize();
        this.draw();
    }

    private draw() {
        // requestAnimationFrame(() => this.draw());
        if (!this.context) return;

        // this.analyserNode.getByteTimeDomainData(this.dataArray);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);


        // this.dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteTimeDomainData(this.audioEngine.getAudioData());

        this.context.fillStyle = "#222";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.lineWidth = 5;
        this.context.strokeStyle = "orange";

        this.context.beginPath();

        const sliceWidth =
            (this.canvas.width * 1.0) / this.analyserNode.frequencyBinCount;
        let x = 0;


        for (let i = 0; i < this.analyserNode.frequencyBinCount; i++) {
            const v = this.audioEngine.getAudioData()[i] / 128.0;
            const y = (v * this.canvas.height) / 2;

            if (i === 0) {
                this.context.moveTo(x, y);
            } else {
                this.context.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.context.lineTo(this.canvas.width, this.canvas.height / 2);
        this.context.stroke();
        requestAnimationFrame(() => this.draw());
    }


    private resize() {

        if (
            this.context == null
  
          ) {
            return;
          }



        const rect = this.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
}


customElements.define('csd-visualizer', CsdVisualizer);