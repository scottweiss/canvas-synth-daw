import './style.css'
import './components/csd-range/csd-range.ts'
import './components/csd-piano/csd-piano.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main>
    <csd-piano></csd-piano>
  </main>
`