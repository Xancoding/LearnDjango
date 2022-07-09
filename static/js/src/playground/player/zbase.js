class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;
        
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;

        this.move_length = 0;
        this.radius = radius;
        this.speed = speed;
        this.color = color;
        this.character = character;
        this.eps = 0.01;
        this.friction = 0.9;  //摩擦力
        this.fireballs = [];

        this.usernaem = username;
        this.photo = photo;

        this.cur_skill = null;

        if (this.character !== "robot") {
            this.img = new Image();
            this.img.src = this.photo;
        }

        if (this.character === "me") {
            this.fireball_coldtime = 3;  //单位：s
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";
            
            this.blink_coldtime = 5;
            this.blink_img = new Image();
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start() {
        this.playground.player_count ++;
        this.playground.notice_board.write("已就绪：" + this.playground.player_count + "人");

        if (this.playground.player_count >= 3) {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }

        if (this.character === "me") {
            this.add_listening_events();
        } else if (this.character === "robot"){
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random();
            this.move_to(tx, ty);
        }

        this.cold_time = 3;  //冷静期，开局3s不能攻击
    }

    add_listening_events() {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function() {
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function(e) {  //鼠标点击事件
            if (outer.playground.state !== "fighting")
                return true;

            const rect = outer.ctx.canvas.getBoundingClientRect();
            if (e.which === 3) {  //鼠标右键
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                outer.move_to(tx, ty);

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_move_to(tx, ty);
                }
            } else if (e.which === 1) {  //鼠标左键
                
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                if (outer.cur_skill === "fireball") {
                    if (outer.fireball_coldtime > outer.eps)
                        return false;
                
                    let fireball = outer.shoot_fireball(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                    }
                } else if (outer.cur_skill === "blink") {
                    if (outer.blink_coldtime > outer.eps)
                        return false;

                    outer.blink(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_blink(tx, ty);
                    }
                }

                outer.cur_skill = null;
            }
        });

        this.playground.game_map.$canvas.keydown(function(e) {  //键盘点击事件
           if (e.which === 13) {  //Enter
                if (outer.playground.mode === "multi mode") {
                    outer.playground.chat_field.show_input();  //打开聊天框
                    return false;
                } else if (e.which === 27) {  //Esc
                    if (outer.playground.mode === "multi mode")
                        outer.playground.chat_field.hide_input();  //关闭聊天框
                }
           }

            if (outer.playground.state !== "fighting")
                return true;


            if (e.which === 81) {  //Q键
                if (outer.fireball_coldtime > outer.eps)
                    return true;

                outer.cur_skill = "fireball";
                return false;
            } else if (e.which === 70) {  //F键
                if (outer.blink_coldtime > outer.eps)
                    return true;

                outer.cur_skill = "blink";
                return false;
            }
        });
    }

    shoot_fireball(tx, ty) {
        let scale = this.playground.scale;
        let x = this.x, y = this.y;
        let radius = 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = 0.5;
        let move_length = 1;

        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
        this.fireballs.push(fireball);

        this.fireball_coldtime = 3;  //重置技能CD

        return fireball;
    }

    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i++) {
            let fireball = this.fireballs[i];
            if (fireball.uuid === uuid) {
                fireball.destroy();
                break;
            }
        }
    }

    blink(tx, ty) {
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.8);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5; //重置CD
        this.move_length = 0;  // 闪现完停下来
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 -x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty) {
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let dx = tx - this.x, dy = ty - this.y;
        let angle = Math.atan2(dy, dx);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    is_attacked(angle, damage) {
        this.explode_particle();  //粒子爆发

        this.radius -= damage;
        if (this.radius < this.eps) {
            this.destroy();
            return false;
        }

        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;
    }

    receive_attack(x, y, angle, damage, ball_uuid, attacker) {
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }

    explode_particle() {
        for (let i = 0; i < 10 + Math.random() * 5; i++) {  //粒子数
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.3;
            let angle = Math.PI * 2 * Math.random();  //随机方向
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;

            new Particle(this.playground, x, y, radius, vx, vy, color, speed);
        }

    }

    render() {
        let scale = this.playground.scale;
        if (this.character !== "robot") {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if (this.character === "me" && this.playground.state === "fighting") {
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime() {
        let x = 1.5, y = 0.9, r = 0.04;
        let scale = this.playground.scale;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.fireball_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, false);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(123, 123, 123, 0.6)";
            this.ctx.fill();
        }

        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.blink_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 5) - Math.PI / 2, false);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(123, 123, 123, 0.6)";
            this.ctx.fill();

        }
    }

        update_move() {  //更新玩家移动
            if (this.damage_speed > this.eps) {
                this.vx = this.vy = 0;
                this.move_length = 0;
                this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
                this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
                this.damage_speed *= this.friction;
            } else {
                if (this.move_length < this.eps) {
                    this.move_length = 0;
                    this.vx = this.vy = 0;

                    if (this.character === "robot") {
                        let tx = Math.random() * this.playground.width / this.playground.scale;
                        let ty = Math.random();
                        this.move_to(tx, ty);
                    }
                } else {
                    let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                    this.x += this.vx * moved;
                    this.y += this.vy * moved;
                    this.move_length -= moved;
                }
            }
        }

        update() {
            this.update_AI_shoot_fireball();

            if (this.character === "me" && this.playground.state === "fighting") {
                this.update_coldtime();
            }

            this.update_move();
            this.render()
        }

        update_coldtime() {  //技能冷却时间
            this.fireball_coldtime -= this.timedelta / 1000;
            this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);
            this.blink_coldtime -= this.timedelta / 1000;
            this.blink_coldtime = Math.max(this.blink_coldtime, 0);

        }

        update_AI_shoot_fireball() {
            this.cold_time -= this.timedelta / 1000;
            if (this.character === "robot" && this.cold_time < 0 && Math.random() < 1 / 180.0) {  //每隔一定时间攻击一次
                //let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
                let player = this.playground.players[0];
                //预判0.3s后的位置以进行攻击
                let tx = player.x + player.speed * this.vx * this.timedelta / 1000 * 0.3;
                let ty = player.y + player.speed * this.vy * this.timedelta / 1000 * 0.3;
                this.shoot_fireball(tx, ty);
            }
        }

        on_destroy() {
            if (this.character === "me") {
                this.playground.state = "over";
            }

            for (let i = 0; i < this.playground.players.length; i++) {
                if (this.playground.players[i] === this) {
                    this.playground.players.splice(i, 1);
                    break;
                }
            }
        }
    }
