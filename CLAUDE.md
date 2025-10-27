# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` — Start Vite dev server at http://localhost:55173
- `npm run build` — Type-check with TypeScript, then build to `dist/`
- `npm run preview` — Serve production build locally at http://localhost:55173
- `npm run lint` — Run ESLint with auto-fix
- `npm run pretty` — Format all files in `src/` with Prettier

## Architecture Overview

### Multi-Track DAW Architecture

This is a professional multi-track DAW with Ableton Live/FL Studio-style interface and workflow.

### Audio System (Singleton Pattern)

The audio architecture uses Web Audio API with per-track synthesis and mixing:

- **AudioEngine** (`src/audio/AudioEngine.ts`) - Singleton that manages the audio context, voice pool (polyphonic synthesis), master effects chain, and per-track audio routing. Subscribes to track selection changes and automatically routes voices through the selected track.
- **TrackManager** (`src/audio/TrackManager.ts`) - Singleton managing all tracks, their patches, notes, and state. Emits events for track creation, deletion, selection, and updates. Persists to localStorage.
- **TrackAudioNode** (`src/audio/TrackAudioNode.ts`) - Per-track audio processing chain (Input → Gain → Pan → Analyser → Output) with volume, pan, mute, solo controls and real-time metering.
- **SynthPatch** (`src/audio/SynthPatch.ts`) - Event-emitting state container for all synth parameters (oscillators, filters, envelopes, effects, modulation). Each track has its own independent SynthPatch instance.
- **SynthVoice** (`src/audio/SynthVoice.ts`) - Single voice with 3 oscillators, filter, amplitude envelope, and LFO routing. AudioEngine maintains a pool of 8 voices for polyphony with voice stealing.
- **Transport** (`src/audio/Transport.ts`) - Singleton managing playback state, BPM, and sequencer timing. Emits tick events for step sequencing.

### Multi-Track Audio Routing

```
Piano/MIDI Input → AudioEngine.noteOn()
                  → SynthVoice (applies selected track's patch)
                  → TrackAudioNode (volume/pan/meters)
                  → Master Chain (reverb/delay/compressor)
                  → Speakers
```

Each track maintains:
- Independent SynthPatch (oscillators, filter, envelope, modulation)
- Audio routing node (volume, pan, solo, mute)
- Note sequence (stored in piano roll)
- UI state (color, name, armed status)

### State Flow Pattern

Per-track synthesis flow:
1. User selects a track in TrackList
2. TrackManager emits 'trackSelected' event
3. AudioEngine subscribes to event and:
   - Routes voice pool through selected track's TrackAudioNode
   - Unsubscribes from previous track's patch
   - Subscribes to new track's patch
   - Applies new track's patch to all voices
4. DeviceChain loads and displays the selected track's patch UI
5. User modifies synth parameters → track's SynthPatch updates → voices update

### DAW UI Layout (src/components/csd-daw-shell/)

```
┌────────────────────────────────────────────────────┐
│  Transport Bar (play/stop, BPM, position)         │
├──────────┬─────────────────────────┬───────────────┤
│          │                         │               │
│  Track   │    Piano Roll           │  Device Chain │
│  List    │    (Note Editor)        │  (Synth UI)   │
│          │                         │               │
│  • Track │    Grid with notes      │  • Oscillators│
│  • Track │    Zoom controls        │  • Filter     │
│  • Track │    Draw/edit notes      │  • Envelope   │
│          │                         │  • Effects    │
│          │                         │  • Modulation │
├──────────┴─────────────────────────┴───────────────┤
│  Mixer (Volume faders, pan, peak meters, S/M)     │
└────────────────────────────────────────────────────┘
```

### Key UI Components

- **CsdDawShell** - Main layout with resizable Split.js panels
- **CsdTransportBar** - Playback controls, BPM, position display, spacebar shortcut
- **CsdTrackList** - Track browser with add/delete, solo/mute, selection
- **CsdPianoRoll** - Canvas-based MIDI note editor with zoom, draw, playback
- **CsdDeviceChain** - Collapsible synth parameter panels (oscillators, filter, ADSR, effects, modulation)
- **CsdMixer** - Professional mixer with faders, peak meters, pan knobs, S/M buttons
- **CsdMixerChannel** - Single channel strip (fader, meter, pan, buttons)
- **CsdFader** - Vertical volume control with dB display
- **CsdPeakMeter** - Canvas-based audio level visualization (green/yellow/red zones)
- **CsdKnob** - Rotary knob control for parameters
- **CsdFilter**, **CsdAdsr**, **CsdOscillatorPanel**, **CsdModulationMatrix** - Synth parameter controls

### Component Communication Pattern

1. User clicks track in CsdTrackList
2. TrackManager.selectTrack(id) called
3. TrackManager emits 'trackSelected' event
4. Multiple subscribers react:
   - CsdDeviceChain loads track's patch and updates all controls
   - CsdPianoRoll redraws with track's notes and color
   - AudioEngine routes voices through track's audio node
   - CsdTrackList updates UI to show selection

### Important Singletons

These classes use getInstance() pattern and should never be instantiated directly:

- `AudioEngine.getInstance()` - Audio processing and voice management
- `TrackManager.getInstance()` - Multi-track state and persistence
- `Transport.getInstance()` - Playback and timing
- `ADSR.getInstance()` - Envelope settings (legacy, now per-patch)

## Complete Multi-Track Workflow

### Creating and Editing Tracks

1. Click "+" in track list to create a new track
2. Click any track to select it (shows with accent color)
3. Edit track name by clicking the name input field
4. Delete track with "×" button (requires confirmation)

### Recording and Editing Notes

1. Select a track to record to
2. Draw notes in piano roll by clicking and dragging
3. Delete notes by clicking on them
4. Clear all notes with "Clear" button
5. Use H-Zoom/V-Zoom to adjust view

### Synthesis and Sound Design

1. Select a track
2. Device chain displays that track's synth settings
3. Modify oscillators (3 per track, independent type/detune/octave/level)
4. Adjust filter (type, frequency, resonance, envelope amount)
5. Shape envelope (ADSR controls)
6. Add effects (reverb, delay - global)
7. Apply modulation (LFO rate, waveform, pitch/filter amount)
8. Each track maintains completely independent synthesis

### Mixing

1. Adjust track volume faders (displays in dB)
2. Pan tracks left/right with pan knobs
3. Watch peak meters for levels (green/yellow/red zones)
4. Solo tracks with "S" button (mutes all non-soloed)
5. Mute tracks with "M" button
6. Adjust master volume for overall output

### Playback

1. Draw or record notes in piano roll
2. Press Play button or spacebar to start transport
3. Notes play with each track's unique synth sound
4. Peak meters show real-time audio activity
5. Position display shows current beat
6. Press Stop button to reset to beginning

### Keyboard Shortcuts

- **Space** - Play/Pause transport
- Track selection automatically updates synth UI and audio routing

### File Organization

- `src/audio/` - All DSP logic, synthesis, effects, and audio routing
- `src/components/csd-*/` - Web Components with co-located TypeScript, SCSS, and templates
- `src/midi/` - MIDI utilities, drum triggers, oscillator wrappers
- `src/canvas/` - Canvas rendering controller for visualizations
- `Timer.ts` - Timing utility for BPM-based scheduling

## TypeScript Configuration

- Strict mode enabled with `noImplicitAny`, `strictNullChecks`, etc.
- Experimental decorators enabled (for future Web Component decorators)
- ESLint enforces:
  - Interface names must start with `I` (e.g., `IAdsr`)
  - Class names must be PascalCase
  - Explicit return types required (warning level)
  - `no-explicit-any` as warning (avoid when possible)

## Testing

No automated test framework is configured. Manually test via `npm run dev`:

- Audio playback via on-screen piano or sequencer
- ADSR envelope response (attack/decay/sustain/release)
- Filter sweeps and resonance
- LFO modulation of pitch and filter
- BPM changes and sequencer sync

## Common Patterns

### Adding a New Audio Parameter (Per-Track)

1. Add parameter to appropriate interface in `src/audio/SynthPatch.ts` (e.g., `FilterPatch`)
2. Add to `defaultState` object
3. Add update method or extend existing (e.g., `updateFilter()`)
4. Update `AudioEngine.subscribeToTrackPatch()` to listen for the new parameter
5. Implement parameter handling in `SynthVoice` (e.g., `setFilterFrequency()`)
6. Create or update UI component in device chain to control parameter
7. Wire event handler in `CsdDeviceChain` to call track's patch update method
8. Changes automatically apply to all voices when track is selected

### Working with Tracks

```typescript
// Get track manager
const trackManager = TrackManager.getInstance();

// Create a new track
const track = trackManager.createTrack('My Track');

// Select a track (triggers audio routing update)
trackManager.selectTrack(trackId);

// Get selected track
const selected = trackManager.getSelectedTrack();

// Update track properties
trackManager.updateTrack(trackId, {
  name: 'New Name',
  volume: 0.8,
  pan: -0.5,
  muted: true
});

// Add notes to track
trackManager.addNote(trackId, {
  pitch: 60,
  start: 0,
  duration: 1,
  velocity: 100
});

// Get track's notes
const notes = trackManager.getNotes(trackId);

// Modify track's synth patch
const track = trackManager.getSelectedTrack();
if (track) {
  track.patch.updateOscillator(0, { type: 'sawtooth', level: 0.8 });
  track.patch.updateFilter({ frequency: 2000, resonance: 5 });
}
```

### Working with Per-Track Audio

```typescript
const audioEngine = AudioEngine.getInstance();

// Audio routing automatically follows track selection
// When user selects a track, AudioEngine:
// 1. Routes voice pool through that track's TrackAudioNode
// 2. Applies that track's SynthPatch to all voices
// 3. Subscribes to that track's patch changes

// Play notes (they use selected track's sound)
audioEngine.noteOn(60, 100);  // Routes through selected track
audioEngine.noteOff(60);

// Access track audio node
const trackNode = audioEngine.getTrackAudioNode(trackId);
if (trackNode) {
  const peakLevel = trackNode.getPeakLevel();
  const rmsLevel = trackNode.getRMSLevel();
}

// Master controls (global)
audioEngine.setMasterVolume(0.75);
const reverb = audioEngine.getMasterReverb();
reverb.setMix(0.3);
```

### Creating a New UI Component

1. Create directory in `src/components/csd-component-name/`
2. Add `csd-component-name.ts` (class extends HTMLElement)
3. Add `csd-component-name.scss` for Shadow DOM styles
4. Import styles with `?inline` suffix: `import styles from './csd-component-name.scss?inline'`
5. Use `attachShadow({ mode: 'open' })` and adopt stylesheets
6. Dispatch CustomEvents for parent communication
7. Register with `customElements.define('csd-component-name', ClassName)`
8. Import in parent component or `src/main.ts`

### Working with the Voice Pool

The voice pool is pre-allocated (8 voices) and voices are reused:

- Call `AudioEngine.noteOn(midiNote, velocity)` - engine finds available voice or steals oldest
- Call `AudioEngine.noteOff(midiNote)` - releases the voice playing that note
- Never call `SynthVoice` methods directly; always go through AudioEngine
- Voice stealing is automatic when all 8 voices are active
- Voices automatically use the selected track's patch and route through that track's audio node

## Build Output

- Production builds go to `dist/`
- Base path is `/canvas-synth-daw/` (configured in `vite.config.js`)
- SCSS uses modern compiler API
- Never edit `dist/` directly

## Known Patterns to Follow

- All components use Shadow DOM for style encapsulation
- SCSS files are imported as inline strings for CSSStyleSheet adoption
- Event handlers use arrow functions to preserve `this` context
- MIDI note numbers are converted via `midiToFrequency()` helper
- Timer uses `setTimeout` recursively (not `setInterval`) for better precision
