import './style.css'
import './components/csd-piano/csd-piano.ts'
import './components/csd-adsr/csd-adsr.ts'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main>
    <csd-piano></csd-piano>
  </main>
`