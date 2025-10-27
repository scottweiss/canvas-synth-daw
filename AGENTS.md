# Repository Guidelines

## Project Structure & Module Organization
- `src/main.ts` bootstraps the Vite app by registering the synth and sequencer components.
- `src/components/csd-*` stores Web Components; each folder keeps its template, styles, and element class for a specific UI panel.
- `src/audio` holds DSP logic such as `AudioEngine`, `SynthVoice`, and filter envelopes; treat these as the single source of audio truth.
- `src/canvas`, `src/midi`, `src/assets`, and `Timer.ts` cover rendering utilities, MIDI helpers, shared graphics, and timing primitives.
- `public/` serves static assets at build time, while `dist/` is generated output—never edit `dist/` directly.

## Build, Test, and Development Commands
- `npm run dev` — launch the Vite dev server with hot module reload at `http://localhost:5173`.
- `npm run build` — run `tsc` for type checks, then emit the production bundle to `dist/`.
- `npm run preview` — serve the latest build locally; always run after `npm run build` when validating production output.
- `npm run lint` — execute ESLint with project rules; fixes safe issues in place.
- `npm run pretty` — format all sources in `src/` with Prettier.

## Coding Style & Naming Conventions
- TypeScript is strict; favor explicit types and avoid `any` unless guarded.
- Stick to two-space indentation, PascalCase classes, and interface names prefixed with `I`, matching the enforced ESLint naming convention.
- Web Component files stay kebab-case (`csd-*.ts`) to mirror their custom element tags; group imports by domain (`audio`, `components`, `midi`).
- Run Prettier before committing and confirm ESLint passes to prevent CI friction.

## Testing Guidelines
- Automated tests are not yet configured—perform manual smoke tests via `npm run dev`, focusing on audio rendering, envelope response, and MIDI input.
- When adding tests, colocate specs beside the source (e.g., `src/audio/AudioEngine.spec.ts`) and document any required tooling updates in the PR.
- Record manual test notes or short clips in pull requests whenever UI or sound changes are involved.

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages (`Add piano roll UI`, `Refactor filter envelope`), mirroring the existing history.
- Squash noisy WIP commits; keep the final summary under ~72 characters and describe the observable change.
- PRs should outline the motivation, link related issues, attach UI or audio evidence, and list manual verification steps.
- Confirm `npm run build` and `npm run lint` succeed before requesting review; surface new configuration or dependency changes in the description.
