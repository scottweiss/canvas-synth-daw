import './style.css'
import './components/csd-piano/csd-piano.ts'
import './components/csd-synth/csd-synth.ts'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main>


    <csd-synth></csd-synth>

  </main>
`