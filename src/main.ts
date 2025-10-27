import './style.css';
import './components/csd-daw-shell/csd-daw-shell.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <csd-daw-shell></csd-daw-shell>
`;
