export type Adsr = {
    attack: number,
    decay: number,
    sustain: number,
    release: number
  };

export class ADSR {
    private static instance: ADSR;
     #adsr : Adsr;

    private constructor() {
        this.#adsr = {
            attack: .5,
            decay: .5,
            sustain: .5,
            release: .5
          }
    }

    set adsr(adsr: Adsr) {
        this.#adsr = adsr;
    }

    get adsr(): Adsr {
        return this.#adsr;
    }

 

    public static getInstance() : ADSR {
        if (!ADSR.instance) {
            ADSR.instance = new ADSR();
        }
        return ADSR.instance;
    }

}