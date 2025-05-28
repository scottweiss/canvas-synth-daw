export interface IAdsr {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export class ADSR {
  private static instance: ADSR;
  #adsr: IAdsr;

  private constructor() {
    this.#adsr = {
      attack: 0.15,
      decay: 0.5,
      sustain: 0.7,
      release: 0.4,
    };
  }

  set adsr(adsr: IAdsr) {
    this.#adsr = adsr;
  }

  get adsr(): IAdsr {
    return this.#adsr;
  }

  public static getInstance(): ADSR {
    if (!ADSR.instance) {
      ADSR.instance = new ADSR();
    }
    return ADSR.instance;
  }
}
