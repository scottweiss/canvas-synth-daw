class AudioEngine {
  constructor(canvasElement) {
    this.canvasElement = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.sampleRate = 44100;
    this.bufferSize = 1024;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.source = this.audioContext.createBufferSource();
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.isPlaying = false;

    // Define the button's position and size
    this.buttonX = 10;
    this.buttonY = 10;
    this.buttonWidth = 100;
    this.buttonHeight = 50;

    // Draw a button on the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(this.buttonX, this.buttonY, this.buttonWidth, this.buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Play', this.buttonX + 50, this.buttonY + 25);

    // Add event listener to the button
    canvas.addEventListener('mousedown', (event) => {
      if (
        this.buttonX < event.clientX &&
        event.clientX < this.buttonX + this.buttonWidth &&
        this.buttonY < event.clientY &&
        event.clientY < this.buttonY + this.buttonHeight
      ) {
        if (!this.isPlaying) {
          this.playNote(440);
          this.isPlaying = true;
        } else {
          this.stop();
          this.isPlaying = false;
        }
      }
    });
  }

  // Create a buffer and start playing
  playNote(frequency) {
    const outputBuffer = this.audioContext.createBuffer(1, this.bufferSize, this.sampleRate);
    const channel = outputBuffer.getChannelData(0);
    for (let i = 0; i < this.bufferSize; i++) {
      channel[i] = Math.sin(Math.PI * frequency * i / this.sampleRate) + 1;
    }
    this.analyser.getByteTimeDomainData(this.frequencyData);
    this.source.connect(this.analyser);
    this.source.start();
  }

  // Add an oscillator to the audio engine
  addOscillator(oscillator) {
    const outputBuffer = new Float32Array(this.bufferSize);
    oscillator.play(outputBuffer, this.sampleRate);
    this.source.buffer = this.audioContext.createBuffer(1, this.bufferSize, this.sampleRate).copyToChannel(
      outputBuffer,
      0,
      0
    );
  }

  // Stop the audio
  stop() {
    this.analyser.disconnect();
    this.source.stop();
  }
}