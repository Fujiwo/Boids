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
    Vector2D.prototype.clone = function () {
        return new Vector2D(this.x, this.y);
    };
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
    Boid.prototype.draw = function (context) {
        //Boid.drawCircle(context, this.position, Boid.size / 2, this.color);
        this.drawShape(context, this.position, Boid.size, this.color);
    };
    Boid.prototype.move = function () {
        this.velocity.plusEqual(Boid.getRandomVector());
        this.position.plusEqual(this.velocity);
    };
    Boid.prototype.getDistance = function (another) {
        return this.position.getDistance(another.position);
    };
    // private static drawCircle(context: CanvasRenderingContext2D, center: Vector2D, radius: number, color: string) {
    //     context.fillStyle = color;
    //     context.beginPath();
    //     context.arc(center.x, center.y, radius, 0, Math.PI * 2, false);
    //     context.fill();
    // }
    Boid.prototype.drawShape = function (context, center, size, color) {
        var halfVelocity = this.velocity.multiply(size / 2);
        var point1 = this.position.plus(halfVelocity);
        var middlePoint = this.position.minus(halfVelocity);
        var unitVelocity = this.velocity.multiply(size / this.velocity.absoluteValue);
        var point2 = middlePoint.plus(new Vector2D(unitVelocity.y, -unitVelocity.x));
        var point3 = middlePoint.plus(new Vector2D(-unitVelocity.y, unitVelocity.x));
        Boid.drawPolygon(context, [point1, point2, point3], color);
    };
    Boid.drawPolygon = function (context, polygon, color) {
        var polygonLength = polygon.length;
        if (polygonLength < 2)
            return;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(polygon[0].x, polygon[0].y);
        for (var index = 1; index < polygonLength; index++)
            context.lineTo(polygon[index].x, polygon[index].y);
        context.fill();
    };
    Boid.getRandomVector = function () {
        return new Vector2D(Boid.getRandomDistance(), Boid.getRandomDistance());
    };
    Boid.getRandomDistance = function () {
        return Boid.maximumRandomDistance * (Math.random() + Math.random()) - Boid.maximumRandomDistance;
    };
    Boid.defaultSize = 3;
    Boid.defaultMaximumRandomDistance = 2;
    Boid.size = Boid.defaultSize;
    Boid.maximumRandomDistance = Boid.defaultMaximumRandomDistance;
    return Boid;
}());
var Boids = /** @class */ (function () {
    function Boids() {
        this.boids = [];
    }
    Boids.prototype.append = function (boid) {
        this.boids.push(boid);
    };
    Boids.prototype.move = function (size) {
        var sum = this.getSum();
        var boidCount = this.boids.length;
        for (var index = 0; index < boidCount; index++) {
            var boid = this.boids[index];
            var speed = boid.speed;
            this.cohesion(sum.position, boid);
            this.separation(index);
            this.alignment(sum.velocity, boid);
            if (speed >= Boids.maximumSpeed)
                boid.velocity = boid.velocity.multiply(Boids.maximumSpeed / speed);
            if (boid.position.x < 0 && boid.velocity.x < 0 || boid.position.x > size.x && boid.velocity.x > 0)
                boid.velocity.x *= -1;
            if (boid.position.y < 0 && boid.velocity.y < 0 || boid.position.y > size.y && boid.velocity.y > 0)
                boid.velocity.y *= -1;
            boid.move();
        }
        // for (let index = 0; index < boidCount; index++)
        //     this.boids[index].move();
    };
    Boids.prototype.getSum = function () {
        var sum = new Boid();
        var boidCount = this.boids.length;
        for (var index = 0; index < boidCount; index++) {
            sum.position.plusEqual(this.boids[index].position);
            sum.velocity.plusEqual(this.boids[index].velocity);
        }
        return sum;
    };
    Boids.prototype.cohesion = function (sum, boid) {
        var center = sum.clone();
        center.minusEqual(boid.position);
        center.divideByEqual(this.boids.length - 1);
        boid.velocity.plusEqual(center.minus(boid.position).divideBy(Boids.cohesionParameter));
    };
    Boids.prototype.separation = function (index) {
        for (var i = 0, length_1 = this.boids.length; i < length_1; i++) {
            if (i === index)
                continue;
            if (this.boids[i].getDistance(this.boids[index]) < Boids.separationParameter)
                this.boids[index].velocity.minusEqual(this.boids[i].position.minus(this.boids[index].position));
        }
    };
    Boids.prototype.alignment = function (sum, boid) {
        var average = sum.clone();
        average.minusEqual(boid.velocity);
        average.divideByEqual(this.boids.length - 1);
        boid.velocity.plusEqual(average.minus(boid.velocity).divideBy(Boids.alignmentParameter));
    };
    Boids.defaultInitialBoidCount = 250;
    Boids.defaultMaximumSpeed = 8;
    Boids.defaultCohesionParameter = 100;
    Boids.defaultSeparationParameter = 10;
    Boids.defaultAlignmentParameter = 7;
    Boids.initialBoidCount = Boids.defaultInitialBoidCount;
    Boids.maximumSpeed = Boids.defaultMaximumSpeed;
    Boids.cohesionParameter = Boids.defaultCohesionParameter;
    Boids.separationParameter = Boids.defaultSeparationParameter;
    Boids.alignmentParameter = Boids.defaultAlignmentParameter;
    return Boids;
}());
var View = /** @class */ (function () {
    function View() {
        this.size = new Vector2D();
        this.canvas = document.querySelector("#canvas");
        this.context = this.canvas.getContext("2d");
    }
    View.prototype.update = function () {
        var titleBar = document.getElementById("titleBar");
        var panel = document.getElementById("panel");
        this.size.x = this.canvas.width = Math.round(window.innerWidth * View.sizeRate);
        this.size.y = this.canvas.height = Math.round((window.innerHeight - (titleBar == null ? 0 : titleBar.clientHeight) - (panel == null ? 0 : panel.clientHeight)) * View.sizeRate);
    };
    View.prototype.drawBoids = function (boids) {
        this.drawAllBoid(boids.boids);
    };
    View.prototype.drawAllBoid = function (boids) {
        this.context.clearRect(0, 0, this.size.x, this.size.y);
        for (var index = 0, length_2 = boids.length; index < length_2; index++)
            boids[index].draw(this.context);
        this.drawCount(boids.length);
    };
    View.prototype.drawCount = function (count) {
        this.context.fillStyle = "gray";
        this.context.font = "14px";
        this.context.fillText("Boids: " + String(count), 20, 20);
    };
    View.sizeRate = 0.95;
    return View;
}());
var Settings = /** @class */ (function () {
    function Settings() {
    }
    Settings.get = function () {
        return {
            boidSize: Boid.size,
            randomParameter: Boid.maximumRandomDistance,
            initialBoidCount: Boids.initialBoidCount,
            maximumSpeed: Boids.maximumSpeed,
            cohesionParameter: Boids.cohesionParameter,
            separationParameter: Boids.separationParameter,
            alignmentParameter: Boids.alignmentParameter
        };
    };
    Settings.set = function (boidSize, randomParameter, initialBoidCount, maximumSpeed, cohesionParameter, separationParameter, alignmentParameter) {
        Boid.size = boidSize;
        Boid.maximumRandomDistance = randomParameter;
        Boids.initialBoidCount = initialBoidCount;
        Boids.maximumSpeed = maximumSpeed;
        Boids.cohesionParameter = cohesionParameter;
        Boids.separationParameter = separationParameter;
        Boids.alignmentParameter = alignmentParameter;
    };
    Settings.reset = function () {
        Boid.size = Boid.defaultSize;
        Boid.maximumRandomDistance = Boid.defaultMaximumRandomDistance;
        Boids.initialBoidCount = Boids.defaultInitialBoidCount;
        Boids.maximumSpeed = Boids.defaultMaximumSpeed;
        Boids.cohesionParameter = Boids.defaultCohesionParameter;
        Boids.separationParameter = Boids.defaultSeparationParameter;
        Boids.alignmentParameter = Boids.defaultAlignmentParameter;
    };
    Settings.save = function () {
        if (!window.localStorage)
            return false;
        window.localStorage.setItem(Settings.key, JSON.stringify(Settings.get()));
        return true;
    };
    Settings.load = function () {
        if (!window.localStorage)
            return false;
        var jsonText = window.localStorage.getItem(Settings.key);
        if (jsonText == null)
            return false;
        var data = JSON.parse(jsonText);
        if (data == null)
            return false;
        Settings.set(data.boidSize, data.randomParameter, data.initialBoidCount, data.maximumSpeed, data.cohesionParameter, data.separationParameter, data.alignmentParameter);
        return true;
    };
    Settings.key = "ShoBoids";
    return Settings;
}());
var Program = /** @class */ (function () {
    function Program() {
        var _this = this;
        this.boids = new Boids();
        this.view = new View();
        this.appendTimer = 0;
        Settings.load();
        setTimeout(function () { return _this.initialize(); }, Program.startTime);
    }
    Program.prototype.initialize = function () {
        var _this = this;
        this.bindEvents();
        this.view.update();
        this.appendBoids(Boids.initialBoidCount);
        setInterval(function () { return _this.step(); }, 1000 / Program.fps);
        Program.initializeForm();
    };
    Program.prototype.bindEvents = function () {
        var _this = this;
        this.view.canvas.addEventListener("mousedown", function (e) { return _this.appendBoids(1, Program.getMousePosition(_this.view.canvas, e)); });
        this.view.canvas.addEventListener("touchstart", function (e) { return _this.appendBoids(1, Program.getTouchPosition(_this.view.canvas, e)); });
        this.view.canvas.addEventListener("mouseup", function () { return clearInterval(_this.appendTimer); });
        this.view.canvas.addEventListener("touchend", function () { return clearInterval(_this.appendTimer); });
        window.addEventListener("resize", function () { return _this.view.update(); });
    };
    Program.getMousePosition = function (element, e) {
        var rect = element.getBoundingClientRect();
        return new Vector2D(e.clientX - rect.left, e.clientY - rect.top);
    };
    Program.getTouchPosition = function (element, e) {
        var rect = element.getBoundingClientRect();
        var touch = e.changedTouches[0];
        return new Vector2D(touch.clientX - rect.left, touch.clientY - rect.top);
    };
    Program.prototype.appendBoids = function (count, position) {
        var _this = this;
        var index = 0;
        this.appendTimer = setInterval(function () {
            if (count > 0 && index >= count) {
                clearInterval(_this.appendTimer);
                return;
            }
            _this.boids.append(Program.createBoid(_this.view.size, position));
            index++;
        }, Program.createTime);
    };
    Program.createBoid = function (areaSize, position) {
        return new Boid(position || areaSize.innerProduct(new Vector2D(Math.random(), Math.random())), new Vector2D(), this.getRandomColor());
    };
    Program.getRandomColor = function () {
        return "rgba(" + String(Program.getRandomColorValue()) + ", " + String(Program.getRandomColorValue()) + ", " + String(Program.getRandomColorValue()) + ", " + String(Program.getOpactiy()) + ")";
    };
    Program.getRandomColorValue = function () {
        return Math.round(Math.random() * Program.colorValueBase);
    };
    Program.getOpactiy = function () {
        return Math.round(Math.random() * (Program.opacityBase2 - Program.opacityBase1) + Program.opacityBase1);
    };
    Program.prototype.step = function () {
        this.view.drawBoids(this.boids);
        this.boids.move(this.view.size);
    };
    Program.onFormSubmit = function () {
        var settingForm = document.settingForm;
        Settings.set(Number(settingForm.boidSizeTextBox.value), Number(settingForm.randomParameterTextBox.value), Number(settingForm.initialBoidCountTextBox.value), Number(settingForm.maximumSpeedTextBox.value), Number(settingForm.cohesionParameterTextBox.value), Number(settingForm.separationParameterTextBox.value), Number(settingForm.alignmentParameterTextBox.value));
        Settings.save();
    };
    Program.onReset = function () {
        Settings.reset();
        Settings.save();
        Program.initializeForm();
    };
    Program.initializeForm = function () {
        var settings = Settings.get();
        Program.setToInput("boidSizeTextBox", settings.boidSize);
        Program.setToInput("randomParameterTextBox", settings.randomParameter);
        Program.setToInput("initialBoidCountTextBox", settings.initialBoidCount);
        Program.setToInput("maximumSpeedTextBox", settings.maximumSpeed);
        Program.setToInput("cohesionParameterTextBox", settings.cohesionParameter);
        Program.setToInput("separationParameterTextBox", settings.separationParameter);
        Program.setToInput("alignmentParameterTextBox", settings.alignmentParameter);
    };
    Program.setToInput = function (inputName, value) {
        var elements = document.getElementsByName(inputName);
        if (elements.length > 0)
            (elements[0]).value = String(value);
    };
    Program.fps = 30;
    Program.createTime = 10;
    Program.startTime = 100;
    Program.colorValueBase = 0xa0; // 0x00~0xff
    Program.opacityBase1 = 0.40; // 0.0~opacityBase2
    Program.opacityBase2 = 0.60; // opacityBase1~1.0
    return Program;
}());
onload = function () { return new Program(); };
//# sourceMappingURL=boids.js.map