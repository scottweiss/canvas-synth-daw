# Canvas Synth DAW - Roadmap to Ableton Live-Style DAW

## Vision
Build a browser-based DAW inspired by Ableton Live with Session View (clip launcher), Arrangement View (timeline), comprehensive mixing, effects, and MIDI capabilities.

---

## Current State (What's Built) ✅

### Audio Engine & Core
- ✅ **AudioEngine** - Polyphonic voice management (8 voices)
- ✅ **SynthVoice** - 3 oscillators, filter, ADSR, LFO per voice
- ✅ **Multi-track system** - TrackManager with per-track patches
- ✅ **Transport** - BPM-based playback, tick system
- ✅ **Effects** - Reverb, Delay (master send effects)
- ✅ **Test coverage** - 168 tests, 88.79% audio coverage

### UI Components
- ✅ **Track List** (left sidebar) - View/select tracks
- ✅ **Piano Roll** (center) - Note editing on grid
- ✅ **Device Chain** (right sidebar) - Oscillators, filter, ADSR, effects, modulation
- ✅ **Mixer** (bottom) - Per-track volume, pan, mute, solo
- ✅ **Transport Bar** (top) - Play/stop, BPM control
- ✅ **Piano Keyboard** - Exists but not integrated into layout
- ✅ **Sequencer** - Step sequencer component
- ✅ **Drum Kit** - Percussion/drum sounds

### Synthesis & Sound Design
- ✅ Oscillators (3 per voice: saw, square, sine, triangle)
- ✅ Filter (lowpass, highpass, bandpass, notch)
- ✅ ADSR envelope
- ✅ LFO with routing (pitch, filter)
- ✅ Modulation matrix

---

## Phase 1: Essential Integration (Quick Wins) 🎯

### 1.1 Integrate Piano Keyboard
**Priority:** HIGH
**Effort:** Low (1-2 hours)
- [ ] Add `csd-piano` to device chain area (collapsible section)
- [ ] Wire up keyboard events to play notes on selected track
- [ ] Add keyboard shortcuts (e.g., 'K' to toggle keyboard)

### 1.2 Enhance Piano Roll (Arrangement View)
**Priority:** HIGH
**Effort:** Medium (4-8 hours)
- [ ] Add horizontal scrolling/zoom for longer compositions
- [ ] Add snap-to-grid settings (1/4, 1/8, 1/16 notes)
- [ ] Implement note selection & editing (drag, resize, delete)
- [ ] Add copy/paste functionality
- [ ] Show track lanes for multiple tracks
- [ ] Add playhead cursor during playback

### 1.3 Session View Toggle
**Priority:** HIGH
**Effort:** Low (2-4 hours)
- [ ] Add tab/button to switch between Arrangement and Session views
- [ ] Save view preference to localStorage
- [ ] Update layout to accommodate both views

---

## Phase 2: Session View (Clip Launcher) 🎬

### 2.1 Core Session View
**Priority:** HIGH
**Effort:** High (16-24 hours)
- [ ] Create `csd-session-view` component
- [ ] Implement clip slots grid (tracks × scenes)
- [ ] Create `csd-clip` component (visual representation)
- [ ] Implement clip triggering/stopping
- [ ] Add scene launch functionality
- [ ] Clip recording (MIDI notes)

### 2.2 Clip Management
**Priority:** MEDIUM
**Effort:** Medium (8-12 hours)
- [ ] Clip looping controls (start, end, loop points)
- [ ] Clip warping (time-stretching)
- [ ] Clip duplication
- [ ] Drag & drop clips between slots
- [ ] Clip names & colors
- [ ] Follow actions (what plays after clip ends)

---

## Phase 3: Browser & Preset Management 📚

### 3.1 Sound Browser
**Priority:** MEDIUM
**Effort:** High (12-16 hours)
- [ ] Create `csd-browser` component
- [ ] Preset browser (synth patches)
- [ ] Category/tag system
- [ ] Search/filter presets
- [ ] Drag & drop presets to tracks
- [ ] Preview sounds

### 3.2 Preset Management
**Priority:** MEDIUM
**Effort:** Medium (6-8 hours)
- [ ] Save/load synth patches
- [ ] Preset metadata (name, category, tags, author)
- [ ] Factory presets
- [ ] User preset library
- [ ] Import/export presets (JSON)

---

## Phase 4: Advanced Features 🚀

### 4.1 Automation
**Priority:** MEDIUM
**Effort:** High (16-20 hours)
- [ ] Automation lanes in Arrangement View
- [ ] Parameter automation recording
- [ ] Automation point editing (draw, delete)
- [ ] Automation curves (linear, exponential)
- [ ] Clip automation vs track automation

### 4.2 Audio Recording
**Priority:** LOW
**Effort:** Very High (24-32 hours)
- [ ] Audio input routing
- [ ] Waveform recording
- [ ] Audio clip playback
- [ ] Waveform rendering
- [ ] Audio editing (trim, fade, normalize)

### 4.3 Additional Effects
**Priority:** MEDIUM
**Effort:** Medium (8-12 hours per effect)
- [ ] EQ (parametric, graphic)
- [ ] Compressor/limiter
- [ ] Distortion/saturation
- [ ] Chorus/flanger/phaser
- [ ] Reverb improvements (convolution)
- [ ] Effect racks (parallel/serial chains)

### 4.4 Advanced Sequencing
**Priority:** MEDIUM
**Effort:** Medium (8-12 hours)
- [ ] Step sequencer enhancements (velocity, probability)
- [ ] Arpeggiator
- [ ] MIDI effects (note delay, scale, chord)
- [ ] Groove/swing quantization

### 4.5 File Management
**Priority:** MEDIUM
**Effort:** Medium (6-10 hours)
- [ ] Project save/load improvements
- [ ] Export audio (WAV, MP3)
- [ ] Export MIDI
- [ ] Template projects
- [ ] Auto-save

---

## Phase 5: Polish & Performance 💎

### 5.1 UI/UX Improvements
**Priority:** MEDIUM
**Effort:** Medium (8-12 hours)
- [ ] Keyboard shortcuts guide
- [ ] Context menus (right-click)
- [ ] Tooltips & help text
- [ ] Undo/redo system
- [ ] Responsive layout for different screen sizes
- [ ] Dark/light theme toggle

### 5.2 Performance Optimization
**Priority:** MEDIUM
**Effort:** Medium (6-10 hours)
- [ ] Web Workers for audio processing
- [ ] Waveform caching
- [ ] Virtual scrolling for large projects
- [ ] Debounce/throttle UI updates
- [ ] Memory leak audits

### 5.3 Collaboration & Sharing
**Priority:** LOW
**Effort:** High (16-24 hours)
- [ ] Share project links
- [ ] Cloud save (backend required)
- [ ] Collaborative editing (real-time)
- [ ] Export project as standalone HTML

---

## Immediate Next Steps (Recommendation)

Based on your vision and current state, here's what I recommend working on next:

### Week 1: Quick Wins
1. **Integrate piano keyboard** - Get it visible in the UI
2. **Enhance piano roll** - Make note editing more robust
3. **Add Session/Arrangement view toggle** - Lay foundation for Session View

### Week 2-3: Session View MVP
4. **Build basic Session View** - Clip slots, trigger clips
5. **Clip recording** - Record MIDI notes into clips
6. **Scene launching** - Play full scenes

### Week 4+: Choose Your Adventure
- **Browser + Presets** (if sound design focus)
- **Automation** (if mixing/production focus)
- **Audio Recording** (if live recording focus)

---

## Architecture Notes

### Current Design Patterns ✅
- **Singleton pattern** for core systems (AudioEngine, Transport, TrackManager)
- **Event-driven** - Components subscribe to changes via `.on()` listeners
- **Shadow DOM** - All components use Shadow DOM for style encapsulation
- **Per-track patches** - Each track has independent synth settings

### Architectural Decisions for Future Features

**Session View:**
- Store clips in TrackManager (extend ITrack interface)
- Each clip has: notes[], patch snapshot, loop points, color
- Transport handles clip triggering logic

**Automation:**
- Store automation data with tracks/clips
- AutomationLane component for drawing
- Apply automation in AudioEngine during playback

**Browser:**
- JSON preset format
- IndexedDB for local storage
- Lazy load preset previews

---

## Technology Considerations

### Current Stack
- TypeScript + Vite
- Web Audio API
- Web Components (custom elements)
- Split.js (resizable panels)
- Canvas API (visualizations)

### Potential Additions
- **Tone.js** - Consider for advanced audio routing/effects
- **Web Workers** - Offload audio processing
- **IndexedDB** - Store presets/projects locally
- **WebRTC** - Collaboration features
- **WebAssembly** - CPU-intensive DSP (far future)

---

## Testing Strategy
- ✅ Core audio modules have 88%+ coverage
- Future: Add integration tests for UI workflows
- Future: End-to-end tests for complete user flows
- Consider: Visual regression testing for UI components

---

**Last Updated:** 2025-10-27
**Status:** Roadmap v1.0 - Open for feedback and iteration
