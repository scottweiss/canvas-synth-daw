import "./style.css";
import "./components/csd-sequencer/csd-sequencer.ts";
import "./components/csd-synth/csd-synth.ts";
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main>
    <csd-synth></csd-synth>
  </main>
`;
