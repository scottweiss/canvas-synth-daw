import { AudioEngine } from '../audio/AudioEngine';
import { Drum } from './Drum';
import midiToFrequency from './midi-to-frequency';

export class MidiApi {
  private midiAccess: MIDIAccess | null = null;
  private inputs: Map<string, MIDIInput> = new Map();
  audioEngine: AudioEngine = AudioEngine.getInstance();
  oscilators: Array<Drum>;

  constructor() {
    this.initializeMidi();
    this.oscilators = [];
  }

  private async initializeMidi(): Promise<void> {
    try {
      if (navigator.requestMIDIAccess) {
        this.midiAccess = await navigator.requestMIDIAccess();
        this.setupMidiInputs();
      } else {
        console.warn('Web MIDI API not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to get MIDI access:', error);
    }
  }

  private setupMidiInputs(): void {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input) => {
      this.inputs.set(input.id, input);
      input.addEventListener('midimessage', this.handleMidiMessage.bind(this));
    });

    this.midiAccess.addEventListener('statechange', (event) => {
      const port = (event as MIDIConnectionEvent).port;
      if (port?.type === 'input') {
        if (port.state === 'connected') {
          this.inputs.set(port.id, port as MIDIInput);
          port.addEventListener('midimessage', this.handleMidiMessage.bind(this));
        } else if (port.state === 'disconnected') {
          this.inputs.delete(port.id);
        }
      }
    });
  }

  private handleMidiMessage(event: Event): void {
    const midiEvent = event as MIDIMessageEvent;
    const [status, note, velocity] = midiEvent.data;

    // Emit custom events for MIDI messages
    const midiCustomEvent = new CustomEvent('midi-message', {
      detail: { status, note, velocity },
      bubbles: true,
    });

    window.dispatchEvent(midiCustomEvent);

    let drum = this.oscilators[note];

    if (status >= 144 && status <= 159 && velocity > 0) {
      // Note-on event with velocity greater than 0
      if (!drum) {
        // If the drum doesn't exist, create a new one and add it to the oscilators array
        drum = new Drum(midiToFrequency(note), 'square', 0.1, 0.1);
        this.oscilators[note] = drum;
      }

      // Play the drum sound
      drum.play();
    }

    if (status >= 128 && status <= 143) {
      console.warn('Note-off or channel mode message:', note);
    }
  }

  getInputs(): MIDIInput[] {
    return Array.from(this.inputs.values());
  }
}
