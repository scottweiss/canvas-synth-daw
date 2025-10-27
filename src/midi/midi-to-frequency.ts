export default function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function midiToNote(midiNote: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  
  if (midiNote === 60) {
    return `${noteName}${octave} (Middle C)`;
  }
  
  return `${noteName}${octave}`;
}

export const keyboardKeyArray = [
  'a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 
  'k', 'o', 'l', 'p', ';', "'", ']'
];
