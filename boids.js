"use strict";
var Vector2D = /** @class */ (function () {
    function Vector2D(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    Object.defineProperty(Vector2D.prototype, "absoluteValue", {
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        enumerable: true,
        configurable: true
    });
    Vector2D.prototype.plus = function (another) {
        return new Vector2D(this.x + another.x, this.y + another.y);
    };
    Vector2D.prototype.plusEqual = function (another) {
        this.x += another.x;
        this.y += another.y;
    };
    Vector2D.prototype.minus = function (another) {
        return new Vector2D(this.x - another.x, this.y - another.y);
    };
    Vector2D.prototype.minusEqual = function (another) {
        this.x -= another.x;
        this.y -= another.y;
    };
    Vector2D.prototype.multiply = function (value) {
        return new Vector2D(this.x * value, this.y * value);
    };
    Vector2D.prototype.innerProduct = function (another) {
        return new Vector2D(this.x * another.x, this.y * another.y);
    };
    Vector2D.prototype.divideBy = function (value) {
        return new Vector2D(this.x / value, this.y / value);
    };
    Vector2D.prototype.divideByEqual = function (value) {
        this.x /= value;
        this.y /= value;
    };
    Vector2D.prototype.getDistance = function (another) {
        return this.minus(another).absoluteValue;
    };
    return Vector2D;
}());
var Boid = /** @class */ (function () {
    function Boid(position, velocity, color) {
        if (position === void 0) { position = new Vector2D(); }
        if (velocity === void 0) { velocity = new Vector2D(); }
        if (color === void 0) { color = "black"; }
        this.size = 5;
        this.position = position;
        this.velocity = velocity;
        this.color = color;
    }
    Object.defineProperty(Boid.prototype, "speed", {
        get: function () {
            return this.velocity.absoluteValue;
        },
        enumerable: true,
        configurable: true
    });
    Boid.prototype.draw = function (ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, Math.PI * 2, false);
        ctx.fill();
    };
    Boid.prototype.move = function () {
        this.position.plusEqual(this.velocity);
    };
    Boid.prototype.getDistance = function (another) {
        return this.position.getDistance(another.position);
    };
    return Boid;
}());
var Boids = /** @class */ (function () {
    function Boids() {
        this.maximumSpeed = 7;
        this.cohesionValue = 100;
        this.separationValue = 10;
        this.alignmentValue = 8;
        this.boids = [];
    }
    Boids.prototype.append = function (boid) {
        this.boids.push(boid);
    };
    Boids.prototype.move = function (size) {
        for (var index = 0, length_1 = this.boids.length; index < length_1; index++) {
            var boid = this.boids[index];
            var speed = boid.speed;
            this.cohesion(index);
            this.separation(index);
            this.alignment(index);
            if (speed >= this.maximumSpeed)
                boid.velocity = boid.velocity.multiply(this.maximumSpeed / speed);
            if (boid.position.x < 0 && boid.velocity.x < 0 || boid.position.x > size.x && boid.velocity.x > 0)
                boid.velocity.x *= -1;
            if (boid.position.y < 0 && boid.velocity.y < 0 || boid.position.y > size.y && boid.velocity.y > 0)
                boid.velocity.y *= -1;
            boid.move();
        }
    };
    Boids.prototype.cohesion = function (index) {
        var center = new Vector2D();
        var boidCount = this.boids.length;
        for (var i = 0; i < boidCount; i++) {
            if (i === index)
                continue;
            center.plusEqual(this.boids[i].position);
        }
        center.divideByEqual(boidCount - 1);
        this.boids[index].velocity.plusEqual(center.minus(this.boids[index].position).divideBy(this.cohesionValue));
    };
    Boids.prototype.separation = function (index) {
        for (var i = 0, length_2 = this.boids.length; i < length_2; i++) {
            if (i === index)
                continue;
            if (this.boids[i].getDistance(this.boids[index]) < this.separationValue)
                this.boids[index].velocity.minusEqual(this.boids[i].position.minus(this.boids[index].position));
        }
    };
    Boids.prototype.alignment = function (index) {
        var average = new Vector2D();
        var boidCount = this.boids.length;
        for (var i = 0; i < boidCount; i++) {
            if (i === index)
                continue;
            average.plusEqual(this.boids[i].velocity);
        }
        average.divideByEqual(boidCount - 1);
        this.boids[index].velocity.plusEqual(average.minus(this.boids[index].velocity).divideBy(this.alignmentValue));
    };
    return Boids;
}());
var View = /** @class */ (function () {
    function View() {
        this.canvas = document.querySelector("#canvas");
        this.ctx = this.canvas.getContext("2d");
        this.size = new Vector2D();
    }
    View.prototype.update = function () {
        this.size.x = this.canvas.width = window.innerWidth;
        this.size.y = this.canvas.height = window.innerHeight;
    };
    View.prototype.drawBoids = function (boids) {
        this.drawAllBoid(boids.boids);
    };
    View.prototype.drawAllBoid = function (boids) {
        this.ctx.clearRect(0, 0, this.size.x, this.size.y);
        for (var index = 0, length_3 = boids.length; index < length_3; index++)
            boids[index].draw(this.ctx);
        this.drawCount(boids.length);
    };
    View.prototype.drawCount = function (count) {
        this.ctx.fillStyle = "#444";
        this.ctx.font = "16px sans-serif";
        this.ctx.fillText("count : " + String(count), 20, 40);
    };
    return View;
}());
var Program = /** @class */ (function () {
    function Program() {
        var _this = this;
        this.initialBoidCount = 100;
        this.fps = 30;
        this.createTime = 10;
        this.startTime = 500;
        this.boids = new Boids();
        this.view = new View();
        this.appendTimer = 0;
        setTimeout(function () { return _this.initialize(); }, this.startTime);
    }
    Program.prototype.initialize = function () {
        this.bindEvents();
        this.view.update();
        this.appendBoids(this.initialBoidCount);
        setInterval(this.step.bind(this), 1000 / this.fps);
    };
    Program.prototype.bindEvents = function () {
        var _this = this;
        window.addEventListener("mousedown", function (e) { return _this.appendBoids(1, new Vector2D(e.pageX, e.pageY)); });
        window.addEventListener("mouseup", function () { return clearInterval(_this.appendTimer); });
        window.addEventListener("resize", function () { return _this.view.update(); });
    };
    Program.prototype.appendBoids = function (count, position) {
        var _this = this;
        var index = 0;
        this.appendTimer = setInterval(function () {
            if (count > 0 && index >= count) {
                clearInterval(_this.appendTimer);
                return;
            }
            _this.boids.append(_this.createBoid(position));
            index++;
        }, this.createTime);
    };
    Program.prototype.createBoid = function (position) {
        return new Boid(position || this.view.size.innerProduct(new Vector2D(Math.random(), Math.random())), new Vector2D(), this.getRandomColor());
    };
    Program.prototype.getRandomColor = function () {
        var colors = [0, 0, 0];
        colors = colors.map(function () {
            return Math.round(Math.random() * 0xff);
        });
        return "rgba(" + String(colors[0]) + ", " + String(colors[1]) + ", " + String(colors[2]) + ", " + String(Math.random()) + ")";
    };
    Program.prototype.step = function () {
        this.view.drawBoids(this.boids);
        this.boids.move(this.view.size);
    };
    return Program;
}());
document.addEventListener("DOMContentLoaded", function () { return new Program(); });
//# sourceMappingURL=boids.js.map