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
        this.mouse = { element: this.width / 2, response: this.height / 2 };

        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        for (let pos = 0; pos < this.starCount; pos++) {
            this.stars.push({
                element: Math.random() * this.width,
                response: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: Math.random() * 0.5 + 0.5,
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
            this.mouse.element = e.clientX;
            this.mouse.response = e.clientY;
        });
    }

    update() {
        this.stars.forEach(star => {

            star.response += star.speedY * this.speed * 2;
            star.element += star.speedX * this.speed;

            const dx = star.element - this.mouse.element;
            const dy = star.response - this.mouse.response;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200) {
                const force = (200 - dist) / 200;
                star.element += (dx / dist) * force * 2;
                star.response += (dy / dist) * force * 2;
            }

            if (star.response > this.height) star.response = 0;
            if (star.element > this.width) star.element = 0;
            if (star.element < 0) star.element = this.width;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();

            this.ctx.fillRect(star.element, star.response, star.size, star.size);
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
