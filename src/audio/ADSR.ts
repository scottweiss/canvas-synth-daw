export type Adsr = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export class ADSR {
  private static instance: ADSR;
  #adsr: Adsr;

  private constructor() {
    this.#adsr = {
      attack: 0.15,
      decay: 0.5,
      sustain: 0.7,
      release: 0.4,
    };
  }

  set adsr(adsr: Adsr) {
    this.#adsr = adsr;
  }

  get adsr(): Adsr {
    return this.#adsr;
  }

  public static getInstance(): ADSR {
    if (!ADSR.instance) {
      ADSR.instance = new ADSR();
    }
    return ADSR.instance;
  }
}
