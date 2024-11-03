class MidiApi {
    constructor() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(this.onMIDISuccess, this.onMIDIFailure);
        } else {
            console.log('WebMIDI is not supported in this browser.');
        }
    }


    // onMIDISuccess(midiAccess) {
    //     console.log(midiAccess);

    //     var inputs = midiAccess.inputs;
    //     var outputs = midiAccess.outputs;
    // }

    onMIDISuccess(midiAccess) {
        for (var input of midiAccess.inputs.values()) {
            input.onmidimessage = this.getMIDIMessage;
        }
    }

    getMIDIMessage(midiMessage) {
        console.log(midiMessage);
    }

    onMIDIFailure() {
        console.log('Could not access your MIDI devices.');
    }
}