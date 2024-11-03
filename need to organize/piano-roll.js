// piano-roll.js
class PianoRollGrid {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
  
      // Draw the piano roll grid
      ctx.beginPath();
      ctx.rect(this.x + 10, this.y + 10, this.w - 20, this.h - 20);
      ctx.strokeStyle = 'black';
      ctx.stroke();
  
      for (let i = 0; i < this.h / 50 + 1; i++) {
        const x2 = this.x + 10;
        const y2 = this.y + 10 + i * 50;
  
        // Draw grid lines
        ctx.beginPath();
        ctx.moveTo(x2, this.y + 10);
        ctx.lineTo(this.x + this.w - 20, y2);
        ctx.strokeStyle = 'black';
        ctx.stroke();
  
        for (let j = 0; j < this.w / 50 + 1; j++) {
          const x3 = this.x + 10 + j * 50;
          const y3 = this.y + 10;
  
          // Draw grid lines
          ctx.beginPath();
          ctx.moveTo(this.x + 10, y3);
          ctx.lineTo(x3, this.y + this.h - 20);
          ctx.strokeStyle = 'black';
          ctx.stroke();
  
        }
  
      }
    }
  
    draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Draw the piano roll grid
      ctx.beginPath();
      ctx.rect(this.x + 10, this.y + 10, this.w - 20, this.h - 20);
      ctx.strokeStyle = 'black';
      ctx.stroke();
  
      for (let i = 0; i < this.h / 50 + 1; i++) {
        const x2 = this.x + 10;
        const y2 = this.y + 10 + i * 50;
  
        // Draw grid lines
        ctx.beginPath();
        ctx.moveTo(x2, this.y + 10);
        ctx.lineTo(this.x + this.w - 20, y2);
        ctx.strokeStyle = 'black';
        ctx.stroke();
  
        for (let j = 0; j < this.w / 50 + 1; j++) {
          const x3 = this.x + 10 + j * 50;
          const y3 = this.y + 10;
  
          // Draw grid lines
          ctx.beginPath();
          ctx.moveTo(this.x + 10, y3);
          ctx.lineTo(x3, this.y + this.h - 20);
          ctx.strokeStyle = 'black';
          ctx.stroke();
  
        }
  
      }
    }
  }
  
  export default PianoRollGrid;