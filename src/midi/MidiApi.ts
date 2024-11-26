import { AudioEngine } from "../audio/AudioEngine";
import { Drum } from "./Drum";
import midiToFrequency from "./midi-to-frequency";

export class MidiApi {
  audioEngine: AudioEngine = AudioEngine.getInstance();
  oscilators: Array<Drum>;

  constructor() {
    if (navigator.requestMIDIAccess ) {
      navigator
        .requestMIDIAccess({ sysex: false })
        .then(this.onMIDISuccess, this.onMIDIFailure);
    } else {
      console.log("WebMIDI is not supported in this browser.");
    }

    this.oscilators = [];
  }

  onMIDISuccess = (midiAccess: MIDIAccess) => {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = (e) => {
        this.getMIDIMessage(e);
      };
    }
  };

  getMIDIMessage(message: MIDIMessageEvent) {
    if (!message.data) {
      return;
    }

    const command = message.data[0]; // The first byte is the command number
    const midiKey = message.data[1]; // The second byte is the note number
    const velocity = message.data[2]; // The third byte is the velocity

    console.log(midiKey, message);

    let drum = this.oscilators[midiKey];

    if (command >= 144 && command <= 159 && velocity > 0) {
      // Note-on event with velocity greater than 0
      if (!drum) {
        // If the drum doesn't exist, create a new one and add it to the oscilators array
        drum = new Drum(midiToFrequency(midiKey), "square", 0.1, 0.1);
        this.oscilators[midiKey] = drum;
      }

      // Play the drum sound
      drum.play();
    }

    if (command >= 128 && command <= 143) {
      console.log(midiKey);
    }
  }
  onMIDIFailure() {
    console.log("Could not access your MIDI devices.");
  }
}
