const midiNoteFrequencies = [
  { midi: 21, frequency: 27.5, note: 'A0' },
  { midi: 22, frequency: 29.14, note: 'A#0/Bb0' },
  { midi: 23, frequency: 30.87, note: 'B0' },
  { midi: 24, frequency: 32.7, note: 'C1' },
  { midi: 25, frequency: 34.65, note: 'C#1/Db1' },
  { midi: 26, frequency: 36.71, note: 'D1' },
  { midi: 27, frequency: 38.89, note: 'D#1/Eb1' },
  { midi: 28, frequency: 41.2, note: 'E1' },
  { midi: 29, frequency: 43.65, note: 'F1' },
  { midi: 30, frequency: 46.25, note: 'F#1/Gb1' },
  { midi: 31, frequency: 49.0, note: 'G1' },
  { midi: 32, frequency: 51.91, note: 'G#1/Ab1' },
  { midi: 33, frequency: 55.0, note: 'A1' },
  { midi: 34, frequency: 58.27, note: 'A#1/Bb1' },
  { midi: 35, frequency: 61.74, note: 'B1' },
  { midi: 36, frequency: 65.41, note: 'C2' },
  { midi: 37, frequency: 69.3, note: 'C#2/Db2' },
  { midi: 38, frequency: 73.42, note: 'D2' },
  { midi: 39, frequency: 77.78, note: 'D#2/Eb2' },
  { midi: 40, frequency: 82.41, note: 'E2' },
  { midi: 41, frequency: 87.31, note: 'F2' },
  { midi: 42, frequency: 92.5, note: 'F#2/Gb2' },
  { midi: 43, frequency: 98.0, note: 'G2' },
  { midi: 44, frequency: 103.83, note: 'G#2/Ab2' },
  { midi: 45, frequency: 110.0, note: 'A2' },
  { midi: 46, frequency: 116.54, note: 'A#2/Bb2' },
  { midi: 47, frequency: 123.47, note: 'B2' },
  { midi: 48, frequency: 130.81, note: 'C3' },
  { midi: 49, frequency: 138.59, note: 'C#3/Db3' },
  { midi: 50, frequency: 146.83, note: 'D3' },
  { midi: 51, frequency: 155.56, note: 'D#3/Eb3' },
  { midi: 52, frequency: 164.81, note: 'E3' },
  { midi: 53, frequency: 174.61, note: 'F3' },
  { midi: 54, frequency: 185.0, note: 'F#3/Gb3' },
  { midi: 55, frequency: 196.0, note: 'G3' },
  { midi: 56, frequency: 207.65, note: 'G#3/Ab3' },
  { midi: 57, frequency: 220.0, note: 'A3' },
  { midi: 58, frequency: 233.08, note: 'A#3/Bb3' },
  { midi: 59, frequency: 246.94, note: 'B3' },
  { midi: 60, frequency: 261.63, note: 'C4 (Middle C)' },
  { midi: 61, frequency: 277.18, note: 'C#4/Db4' },
  { midi: 62, frequency: 293.66, note: 'D4' },
  { midi: 63, frequency: 311.13, note: 'D#4/Eb4' },
  { midi: 64, frequency: 329.63, note: 'E4' },
  { midi: 65, frequency: 349.23, note: 'F4' },
  { midi: 66, frequency: 369.99, note: 'F#4/Gb4' },
  { midi: 67, frequency: 392.0, note: 'G4' },
  { midi: 68, frequency: 415.3, note: 'G#4/Ab4' },
  { midi: 69, frequency: 440.0, note: 'A4' },
  { midi: 70, frequency: 466.16, note: 'A#4/Bb4' },
  { midi: 71, frequency: 493.88, note: 'B4' },
  { midi: 72, frequency: 523.25, note: 'C5' },
  { midi: 73, frequency: 554.37, note: 'C#5/Db5' },
  { midi: 74, frequency: 587.33, note: 'D5' },
  { midi: 75, frequency: 622.25, note: 'D#5/Eb5' },
  { midi: 76, frequency: 659.25, note: 'E5' },
  { midi: 77, frequency: 698.46, note: 'F5' },
  { midi: 78, frequency: 739.99, note: 'F#5/Gb5' },
  { midi: 79, frequency: 783.99, note: 'G5' },
  { midi: 80, frequency: 830.61, note: 'G#5/Ab5' },
  { midi: 81, frequency: 880.0, note: 'A5' },
  { midi: 82, frequency: 932.33, note: 'A#5/Bb5' },
  { midi: 83, frequency: 987.77, note: 'B5' },
  { midi: 84, frequency: 1046.5, note: 'C6' },
  { midi: 85, frequency: 1108.73, note: 'C#6/Db6' },
  { midi: 86, frequency: 1174.66, note: 'D6' },
  { midi: 87, frequency: 1244.51, note: 'D#6/Eb6' },
  { midi: 88, frequency: 1318.51, note: 'E6' },
  { midi: 89, frequency: 1396.91, note: 'F6' },
  { midi: 90, frequency: 1479.98, note: 'F#6/Gb6' },
  { midi: 91, frequency: 1567.98, note: 'G6' },
  { midi: 92, frequency: 1661.22, note: 'G#6/Ab6' },
  { midi: 93, frequency: 1760.0, note: 'A6' },
  { midi: 94, frequency: 1864.66, note: 'A#6/Bb6' },
  { midi: 95, frequency: 1975.53, note: 'B6' },
  { midi: 96, frequency: 2093.0, note: 'C7' },
  { midi: 97, frequency: 2217.46, note: 'C#7/Db7' },
  { midi: 98, frequency: 2349.32, note: 'D7' },
  { midi: 99, frequency: 2489.02, note: 'D#7/Eb7' },
  { midi: 100, frequency: 2637.02, note: 'E7' },
  { midi: 101, frequency: 2793.83, note: 'F7' },
  { midi: 102, frequency: 2959.96, note: 'F#7/Gb7' },
  { midi: 103, frequency: 3135.96, note: 'G7' },
  { midi: 104, frequency: 3322.44, note: 'G#7/Ab7' },
  { midi: 105, frequency: 3520.0, note: 'A7' },
  { midi: 106, frequency: 3729.31, note: 'A#7/Bb7' },
  { midi: 107, frequency: 3951.07, note: 'B7' },
  { midi: 108, frequency: 4186.01, note: 'C8' },
];

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
