export interface IAdsr {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export class ADSR {
  private static instance: ADSR;
  public adsr: IAdsr;

  private constructor() {
    this.adsr = {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.4,
      release: 0.2,
    };
  }

  public static getInstance(): ADSR {
    if (!ADSR.instance) {
      ADSR.instance = new ADSR();
    }
    return ADSR.instance;
  }

  setAdsr(adsr: IAdsr): void {
    this.adsr = adsr;
  }

  getAdsr(): IAdsr {
    return this.adsr;
  }
}
