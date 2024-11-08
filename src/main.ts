import './style.css'
import './components/csd-range/csd-range.ts'
import './components/csd-piano/csd-piano.ts'
import './components/csd-asdr/csd-asdr.ts'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main>
    <csd-asdr></csd-asdr>
    <div>the asdr does nothing!</div>
    <csd-piano></csd-piano>
  </main>
`