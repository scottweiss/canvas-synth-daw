import './style.css'
import './components/csd-range/csd-range.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <csd-range></csd-range>
  </div>
`