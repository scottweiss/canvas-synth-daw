import { AudioEngine } from "../../audio/AudioEngine";
import { CanvasController } from "../../canvas/CanvasController";
import { Drum } from "../../midi/Drum";
import { Timer } from "../../Timer";
import styles from "./index.scss?inline";


export class CsdSequencer extends HTMLElement {

  audioEngine: AudioEngine = AudioEngine.getInstance();
  canvasController: CanvasController = new CanvasController();
  canvas: HTMLCanvasElement = this.canvasController.getCanvasElement();;
  context: CanvasRenderingContext2D | null;
  frame: number = 0;
  beat: number = 0;
  timer: Timer = new Timer();
  kick: Drum;
  snare: Drum;
  play: boolean = false;

  constructor() {
    super();
    this.context = this.canvasController.getCtx();
    this.kick = new Drum(700, "triangle", 0.1, 0.1);
    this.snare = new Drum(600, "triangle", 0.1, 0.1);
    // add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets.push(sheet);


    const checkbox = document.createElement('button');
    checkbox.innerText = "Start";
    checkbox.onclick = () => {
      this.play = !this.play;
      checkbox.innerText = `${this.play ? 'Stop' : 'Start'}`;
    }

    shadowRoot.append(checkbox,  this.canvasController.getCanvasElement());
  }

  connectedCallback() {
    this.canvasController.resize();
    this.canvasController.draw(0, this.draw.bind(this));

    this.timer.draw(0, this.beatCallback.bind(this));
  }

  private draw() {
    if (!this.context) {
      return;
    }

    this.context.save();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.frame % 2) {
      this.context.fillStyle = "#333433";
    } else {
      this.context.fillStyle = "#333433";
    }



    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.restore();
    this.frame++;
    this.drawRetangle(0);
    this.drawRetangle(1);
    this.drawRetangle(2);
    this.drawRetangle(3);

  
  }

  drawRetangle(number: number): void {
    if (!this.context) {
      return;
    }
    const xPosition = this.canvas.width / 4 *  (number  );

    if (((this.beat - number) % 4)  !== 1) {
      this.context.fillStyle = "orchid";
    } else {
      this.context.fillStyle = "orange";
    }
    this.context.fillRect(xPosition, 0, this.canvas.width / 4 + xPosition, this.canvas.height );
  }

  beatCallback(): void {
    // console.log(e )
    if (!this.play) return;
    if (this.beat % 4 === 0){
      this.kick.play();
    } else {
      this.snare.play();
    }
    
   
    this.beat++;
  }


  
}

// Define the new element
customElements.define("csd-sequencer", CsdSequencer);
