class Particle extends AcGameObject {
    constructor(playground, x, y, radius, vx, vy, color, speed) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.eps = 1;
    }

    start() {
        this.friction_speed = 0.8;
        this.friction_radius = 0.8;
    }

    update() {
        this.update_move();
        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    update_move() {
        if (this.speed < this.eps || this.radius < this.eps) {
            this.destroy();
            return false;
        }

        this.x += this.vx * this.speed * this.timedelta / 1000;
        this.y += this.vy * this.speed * this.timedelta / 1000;

        this.speed *= this.friction_speed;
        this.radius *= this.friction_radius;
    }

}
