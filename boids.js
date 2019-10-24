"use strict";
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    get absoluteValue() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    plus(another) {
        return new Vector2D(this.x + another.x, this.y + another.y);
    }
    plusEqual(another) {
        this.x += another.x;
        this.y += another.y;
    }
    minus(another) {
        return new Vector2D(this.x - another.x, this.y - another.y);
    }
    minusEqual(another) {
        this.x -= another.x;
        this.y -= another.y;
    }
    multiply(value) {
        return new Vector2D(this.x * value, this.y * value);
    }
    innerProduct(another) {
        return new Vector2D(this.x * another.x, this.y * another.y);
    }
    divideBy(value) {
        return new Vector2D(this.x / value, this.y / value);
    }
    divideByEqual(value) {
        this.x /= value;
        this.y /= value;
    }
    getDistance(another) {
        return this.minus(another).absoluteValue;
    }
}
class Boid {
    constructor(position = new Vector2D(), velocity = new Vector2D(), color = "black") {
        this.position = position;
        this.velocity = velocity;
        this.color = color;
    }
    get speed() {
        return this.velocity.absoluteValue;
    }
    draw(context) {
        Boid.drawCircle(context, this.position, Boid.size / 2, this.color);
    }
    move() {
        this.position.plusEqual(this.velocity);
    }
    getDistance(another) {
        return this.position.getDistance(another.position);
    }
    static drawCircle(context, center, radius, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(center.x, center.y, radius, 0, Math.PI * 2, false);
        context.fill();
    }
}
Boid.defaultSize = 10;
Boid.size = Boid.defaultSize;
class Boids {
    constructor() {
        this.boids = [];
    }
    append(boid) {
        this.boids.push(boid);
    }
    move(size) {
        for (let index = 0, length = this.boids.length; index < length; index++) {
            let boid = this.boids[index];
            let speed = boid.speed;
            this.cohesion(index);
            this.separation(index);
            this.alignment(index);
            if (speed >= Boids.maximumSpeed)
                boid.velocity = boid.velocity.multiply(Boids.maximumSpeed / speed);
            if (boid.position.x < 0 && boid.velocity.x < 0 || boid.position.x > size.x && boid.velocity.x > 0)
                boid.velocity.x *= -1;
            if (boid.position.y < 0 && boid.velocity.y < 0 || boid.position.y > size.y && boid.velocity.y > 0)
                boid.velocity.y *= -1;
            boid.move();
        }
    }
    cohesion(index) {
        let center = new Vector2D();
        let boidCount = this.boids.length;
        for (let i = 0; i < boidCount; i++) {
            if (i === index)
                continue;
            center.plusEqual(this.boids[i].position);
        }
        center.divideByEqual(boidCount - 1);
        this.boids[index].velocity.plusEqual(center.minus(this.boids[index].position).divideBy(Boids.cohesionParameter));
    }
    separation(index) {
        for (let i = 0, length = this.boids.length; i < length; i++) {
            if (i === index)
                continue;
            if (this.boids[i].getDistance(this.boids[index]) < Boids.separationParameter)
                this.boids[index].velocity.minusEqual(this.boids[i].position.minus(this.boids[index].position));
        }
    }
    alignment(index) {
        let average = new Vector2D();
        let boidCount = this.boids.length;
        for (let i = 0; i < boidCount; i++) {
            if (i === index)
                continue;
            average.plusEqual(this.boids[i].velocity);
        }
        average.divideByEqual(boidCount - 1);
        this.boids[index].velocity.plusEqual(average.minus(this.boids[index].velocity).divideBy(Boids.alignmentParameter));
    }
}
Boids.defaultInitialBoidCount = 100;
Boids.defaultMaximumSpeed = 7;
Boids.defaultCohesionParameter = 100;
Boids.defaultSeparationParameter = 10;
Boids.defaultAlignmentParameter = 8;
Boids.initialBoidCount = Boids.defaultInitialBoidCount;
Boids.maximumSpeed = Boids.defaultMaximumSpeed;
Boids.cohesionParameter = Boids.defaultCohesionParameter;
Boids.separationParameter = Boids.defaultSeparationParameter;
Boids.alignmentParameter = Boids.defaultAlignmentParameter;
class View {
    constructor() {
        this.canvas = document.querySelector("#canvas");
        this.context = this.canvas.getContext("2d");
        this.size = new Vector2D();
    }
    update() {
        this.size.x = this.canvas.width = Math.round(window.innerWidth * View.sizeRate);
        this.size.y = this.canvas.height = Math.round(window.innerHeight * View.sizeRate);
    }
    drawBoids(boids) {
        this.drawAllBoid(boids.boids);
    }
    drawAllBoid(boids) {
        this.context.clearRect(0, 0, this.size.x, this.size.y);
        for (let index = 0, length = boids.length; index < length; index++)
            boids[index].draw(this.context);
        this.drawCount(boids.length);
    }
    drawCount(count) {
        this.context.fillStyle = "gray";
        this.context.font = "14px";
        this.context.fillText("Boids: " + String(count), 20, 20);
    }
}
View.sizeRate = 0.9;
class Settings {
    static get() {
        return {
            boidSize: Boid.size,
            initialBoidCount: Boids.initialBoidCount,
            maximumSpeed: Boids.maximumSpeed,
            cohesionParameter: Boids.cohesionParameter,
            separationParameter: Boids.separationParameter,
            alignmentParameter: Boids.alignmentParameter
        };
    }
    static set(boidSize, initialBoidCount, maximumSpeed, cohesionParameter, separationParameter, alignmentParameter) {
        Boid.size = boidSize;
        Boids.initialBoidCount = initialBoidCount;
        Boids.maximumSpeed = maximumSpeed;
        Boids.cohesionParameter = cohesionParameter;
        Boids.separationParameter = separationParameter;
        Boids.alignmentParameter = alignmentParameter;
    }
    static reset() {
        Boid.size = Boid.defaultSize;
        Boids.initialBoidCount = Boids.defaultInitialBoidCount;
        Boids.maximumSpeed = Boids.defaultMaximumSpeed;
        Boids.cohesionParameter = Boids.defaultCohesionParameter;
        Boids.separationParameter = Boids.defaultSeparationParameter;
        Boids.alignmentParameter = Boids.defaultAlignmentParameter;
    }
    static save() {
        if (!window.localStorage)
            return false;
        window.localStorage.setItem(Settings.key, JSON.stringify(Settings.get()));
        return true;
    }
    static load() {
        if (!window.localStorage)
            return false;
        var jsonText = window.localStorage.getItem(Settings.key);
        if (jsonText == null)
            return false;
        var data = JSON.parse(jsonText);
        if (data == null)
            return false;
        Settings.set(data.boidSize, data.initialBoidCount, data.maximumSpeed, data.cohesionParameter, data.separationParameter, data.alignmentParameter);
        return true;
    }
}
Settings.key = "ShoBoids";
class Program {
    constructor() {
        this.boids = new Boids();
        this.view = new View();
        this.appendTimer = 0;
        Settings.load();
        setTimeout(() => this.initialize(), Program.startTime);
    }
    initialize() {
        this.bindEvents();
        this.view.update();
        this.appendBoids(Boids.initialBoidCount);
        setInterval(() => this.step(), 1000 / Program.fps);
        Program.initializeForm();
    }
    static getMousePosition(element, e) {
        var rect = element.getBoundingClientRect();
        return new Vector2D(e.clientX - rect.left, e.clientY - rect.top);
    }
    bindEvents() {
        this.view.canvas.addEventListener("mousedown", e => this.appendBoids(1, Program.getMousePosition(this.view.canvas, e)));
        this.view.canvas.addEventListener("mouseup", () => clearInterval(this.appendTimer));
        window.addEventListener("resize", () => this.view.update());
    }
    appendBoids(count, position) {
        let index = 0;
        this.appendTimer = setInterval(() => {
            if (count > 0 && index >= count) {
                clearInterval(this.appendTimer);
                return;
            }
            this.boids.append(Program.createBoid(this.view.size, position));
            index++;
        }, Program.createTime);
    }
    static createBoid(areaSize, position) {
        return new Boid(position || areaSize.innerProduct(new Vector2D(Math.random(), Math.random())), new Vector2D(), this.getRandomColor());
    }
    static getRandomColor() {
        let colors = [0, 0, 0];
        colors = colors.map(() => {
            return Math.round(Math.random() * 0xff);
        });
        return "rgba(" + String(colors[0]) + ", " + String(colors[1]) + ", " + String(colors[2]) + ", " + String(Math.random()) + ")";
    }
    step() {
        this.view.drawBoids(this.boids);
        this.boids.move(this.view.size);
    }
    static onFormSubmit() {
        let settingForm = document.settingForm;
        Settings.set(Number(settingForm.boidSizeTextBox.value), Number(settingForm.initialBoidCountTextBox.value), Number(settingForm.maximumSpeedTextBox.value), Number(settingForm.cohesionParameterTextBox.value), Number(settingForm.separationParameterTextBox.value), Number(settingForm.alignmentParameterTextBox.value));
        Settings.save();
    }
    static onReset() {
        Settings.reset();
        Settings.save();
        Program.initializeForm();
    }
    static initializeForm() {
        let settings = Settings.get();
        Program.setToInput("boidSizeTextBox", settings.boidSize);
        Program.setToInput("initialBoidCountTextBox", settings.initialBoidCount);
        Program.setToInput("maximumSpeedTextBox", settings.maximumSpeed);
        Program.setToInput("cohesionParameterTextBox", settings.cohesionParameter);
        Program.setToInput("separationParameterTextBox", settings.separationParameter);
        Program.setToInput("alignmentParameterTextBox", settings.alignmentParameter);
    }
    static setToInput(inputName, value) {
        let elements = document.getElementsByName(inputName);
        if (elements.length > 0)
            (elements[0]).value = String(value);
    }
}
Program.fps = 30;
Program.createTime = 10;
Program.startTime = 100;
onload = () => new Program();
//# sourceMappingURL=boids.js.map