import { AudioEngine } from '../audio/AudioEngine';
import { Drum } from './Drum';
import midiToFrequency from './midi-to-frequency';

export class MidiApi {
  audioEngine: AudioEngine = AudioEngine.getInstance();
  oscilators: Array<Drum>;

  constructor() {
    // if (navigator.requestMIDIAccess) {
    //   navigator
    //     .requestMIDIAccess({ sysex: false })
    //     .then(this.onMIDISuccess, this.onMIDIFailure);
    // } else {
    //   // WebMIDI is not supported in this browser
    // }
    const permissionName = 'midi' as PermissionName;
    // const sysexPermissionDescripton = true as PermissionDescriptor;
    navigator.permissions.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') {
        // Access granted.
        console.warn('MIDI access granted');
      } else if (result.state === 'prompt') {
        console.warn('MIDI access requires prompt');
        // Using API will prompt for permission
      }
      // Permission was denied by user prompt or permission policy
    });

    this.oscilators = [];
  }

  onMIDISuccess = (midiAccess: MIDIAccess): void => {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = (e): void => {
        this.getMIDIMessage(e);
      };
    }
  };

  getMIDIMessage(message: MIDIMessageEvent): void {
    if (!message.data) {
      return;
    }

    const command = message.data[0]; // The first byte is the command number
    const midiKey = message.data[1]; // The second byte is the note number
    const velocity = message.data[2]; // The third byte is the velocity

    console.warn('MIDI message received:', { midiKey, message });

    let drum = this.oscilators[midiKey];

    if (command >= 144 && command <= 159 && velocity > 0) {
      // Note-on event with velocity greater than 0
      if (!drum) {
        // If the drum doesn't exist, create a new one and add it to the oscilators array
        drum = new Drum(midiToFrequency(midiKey), 'square', 0.1, 0.1);
        this.oscilators[midiKey] = drum;
      }

      // Play the drum sound
      drum.play();
    }

    if (command >= 128 && command <= 143) {
      console.warn('Note-off or channel mode message:', midiKey);
    }
  }
  onMIDIFailure(): void {
    console.warn('Could not access your MIDI devices.');
  }
}
