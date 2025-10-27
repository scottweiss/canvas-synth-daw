import { ITrack } from '../../audio/TrackManager';
import { CsdFader } from '../csd-fader/csd-fader';
import { CsdPeakMeter } from '../csd-peak-meter/csd-peak-meter';
import { CsdKnob } from '../csd-knob/csd-knob';
import styles from './csd-mixer-channel.scss?inline';

export interface ICsdMixerChannelProps {
  track: ITrack;
  isMaster?: boolean;
}

export class CsdMixerChannel extends HTMLElement {
  private track: ITrack;
  private isMaster: boolean;
  private fader: CsdFader;
  private peakMeter: CsdPeakMeter;
  private panKnob: CsdKnob;
  private soloButton: HTMLButtonElement;
  private muteButton: HTMLButtonElement;
  private trackNameInput: HTMLInputElement;

  constructor(props: ICsdMixerChannelProps) {
    super();

    this.track = props.track;
    this.isMaster = props.isMaster ?? false;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets.push(sheet);

    const container = document.createElement('div');
    container.className = `mixer-channel ${this.isMaster ? 'master' : ''}`;

    // Track name/label
    if (this.isMaster) {
      const label = document.createElement('div');
      label.className = 'channel-label';
      label.textContent = 'Master';
      container.appendChild(label);
    } else {
      this.trackNameInput = document.createElement('input');
      this.trackNameInput.type = 'text';
      this.trackNameInput.className = 'channel-name';
      this.trackNameInput.value = this.track.name;
      container.appendChild(this.trackNameInput);
    }

    // Color indicator (not for master)
    if (!this.isMaster) {
      const colorIndicator = document.createElement('div');
      colorIndicator.className = 'color-indicator';
      colorIndicator.style.backgroundColor = this.track.color;
      container.appendChild(colorIndicator);
    }

    // Controls section
    const controlsSection = document.createElement('div');
    controlsSection.className = 'controls-section';

    // Pan knob
    this.panKnob = new CsdKnob({
      label: 'Pan',
      min: -1,
      max: 1,
      value: 0
    });
    controlsSection.appendChild(this.panKnob);

    container.appendChild(controlsSection);

    // Meters and fader section
    const metersSection = document.createElement('div');
    metersSection.className = 'meters-section';

    // Peak meter
    this.peakMeter = new CsdPeakMeter();
    metersSection.appendChild(this.peakMeter);

    // Fader
    this.fader = new CsdFader({
      label: 'Vol',
      value: 0.75
    });
    metersSection.appendChild(this.fader);

    container.appendChild(metersSection);

    // Buttons section (not for master)
    if (!this.isMaster) {
      const buttonsSection = document.createElement('div');
      buttonsSection.className = 'buttons-section';

      this.soloButton = document.createElement('button');
      this.soloButton.className = 'solo-button';
      this.soloButton.textContent = 'S';
      this.soloButton.title = 'Solo';

      this.muteButton = document.createElement('button');
      this.muteButton.className = 'mute-button';
      this.muteButton.textContent = 'M';
      this.muteButton.title = 'Mute';

      buttonsSection.append(this.soloButton, this.muteButton);
      container.appendChild(buttonsSection);
    }

    shadowRoot.appendChild(container);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Fader changes
    this.fader.addEventListener('change', ((e: CustomEvent) => {
      this.dispatchEvent(new CustomEvent('volumeChange', {
        detail: {
          trackId: this.track?.id,
          volume: e.detail.value
        }
      }));
    }) as EventListener);

    // Pan changes
    this.panKnob.addEventListener('change', ((e: CustomEvent) => {
      this.dispatchEvent(new CustomEvent('panChange', {
        detail: {
          trackId: this.track?.id,
          pan: e.detail.value
        }
      }));
    }) as EventListener);

    if (!this.isMaster) {
      // Track name changes
      this.trackNameInput?.addEventListener('change', () => {
        this.dispatchEvent(new CustomEvent('nameChange', {
          detail: {
            trackId: this.track.id,
            name: this.trackNameInput.value
          }
        }));
      });

      // Solo button
      this.soloButton?.addEventListener('click', () => {
        const isSolo = this.soloButton.classList.toggle('active');
        this.dispatchEvent(new CustomEvent('soloChange', {
          detail: {
            trackId: this.track.id,
            solo: isSolo
          }
        }));
      });

      // Mute button
      this.muteButton?.addEventListener('click', () => {
        const isMuted = this.muteButton.classList.toggle('active');
        this.dispatchEvent(new CustomEvent('muteChange', {
          detail: {
            trackId: this.track.id,
            mute: isMuted
          }
        }));
      });
    }
  }

  public updateLevel(level: number): void {
    this.peakMeter.setLevel(level);
  }

  public setMute(muted: boolean): void {
    if (this.muteButton) {
      if (muted) {
        this.muteButton.classList.add('active');
      } else {
        this.muteButton.classList.remove('active');
      }
    }
  }

  public setSolo(solo: boolean): void {
    if (this.soloButton) {
      if (solo) {
        this.soloButton.classList.add('active');
      } else {
        this.soloButton.classList.remove('active');
      }
    }
  }
}

customElements.define('csd-mixer-channel', CsdMixerChannel);
