class Starfield {
    constructor() {
        this.canvas = document.getElementById('starfield');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.stars = [];
        this.starCount = 150;
        this.speed = 0.5;
        this.mouse = { x: this.width / 2, y: this.height / 2 };

        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.2, // Slight horizontal drift
                speedY: Math.random() * 0.5 + 0.5,   // Falling down
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`
            });
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    update() {
        this.stars.forEach(star => {
            // Basic movement
            star.y += star.speedY * this.speed * 2;
            star.x += star.speedX * this.speed;

            // Mouse interaction (Parallax / repulsion)
            const dx = star.x - this.mouse.x;
            const dy = star.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Warp effect / Reactivity: Stars move faster/away when close to mouse
            if (dist < 200) {
                const force = (200 - dist) / 200;
                star.x += (dx / dist) * force * 2;
                star.y += (dy / dist) * force * 2;
            }

            // Wrap around screen
            if (star.y > this.height) star.y = 0;
            if (star.x > this.width) star.x = 0;
            if (star.x < 0) star.x = this.width;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw stars as simple pixels/circles to keep retro feel
        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            // Use rect for pixel feel, or arc for round
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
            this.ctx.fill();
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Starfield();
});
