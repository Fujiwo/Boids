﻿class Vector2D {
    x: number;
    y: number;

    get absoluteValue(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    plus(another: Vector2D): Vector2D {
        return new Vector2D(this.x + another.x, this.y + another.y);
    }

    plusEqual(another: Vector2D): void {
        this.x += another.x;
        this.y += another.y;
    }

    minus(another: Vector2D): Vector2D {
        return new Vector2D(this.x - another.x, this.y - another.y);
    }

    minusEqual(another: Vector2D): void {
        this.x -= another.x;
        this.y -= another.y;
    }

    multiply(value: number): Vector2D {
        return new Vector2D(this.x * value, this.y * value);
    }

    innerProduct(another: Vector2D): Vector2D {
        return new Vector2D(this.x * another.x, this.y * another.y);
    }

    divideBy(value: number): Vector2D {
        return new Vector2D(this.x / value, this.y / value);
    }

    divideByEqual(value: number): void {
        this.x /= value;
        this.y /= value;
    }

    getDistance(another: Vector2D): number {
        return this.minus(another).absoluteValue;
    }
}

class Boid {
    static size = 10;

    position     : Vector2D;
    velocity     : Vector2D;
    private color: string  ;

    get speed(): number {
        return this.velocity.absoluteValue;
    }

    constructor(position: Vector2D = new Vector2D(), velocity: Vector2D = new Vector2D(), color: string = "black") {
        this.position = position;
        this.velocity = velocity;
        this.color    = color   ;
    }

    draw(context: CanvasRenderingContext2D): void {
        Boid.drawCircle(context, this.position, Boid.size / 2, this.color);
    }

    move(): void {
        this.position.plusEqual(this.velocity);
    }

    getDistance(another: Boid): number {
        return this.position.getDistance(another.position);
    }

    private static drawCircle(context: CanvasRenderingContext2D, center: Vector2D, radius: number, color: string) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(center.x, center.y, radius, 0, Math.PI * 2, false);
        context.fill();
    }
}

class Boids {
    static maximumSpeed    =   7;
    static cohesionValue   = 100;
    static separationValue =  10;
    static alignmentValue  =   8;

    boids: Boid[] = [];

    append(boid: Boid): void {
        this.boids.push(boid);
    }

    move(size: Vector2D): void {
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

    private cohesion(index: number): void {
        let center = new Vector2D();
        let boidCount = this.boids.length;

        for (let i = 0; i < boidCount; i++) {
            if (i === index)
                continue;
            center.plusEqual(this.boids[i].position);
        }
        center.divideByEqual(boidCount - 1);
        this.boids[index].velocity.plusEqual(center.minus(this.boids[index].position).divideBy(Boids.cohesionValue));
    }

    private separation(index: number): void {
        for (let i = 0, length = this.boids.length; i < length; i++) {
            if (i === index)
                continue;
            if (this.boids[i].getDistance(this.boids[index]) < Boids.separationValue)
                this.boids[index].velocity.minusEqual(this.boids[i].position.minus(this.boids[index].position));
        }
    }

    private alignment(index: number): void {
        let average = new Vector2D();
        let boidCount = this.boids.length;

        for (let i = 0; i < boidCount; i++) {
            if (i === index)
                continue;
            average.plusEqual(this.boids[i].velocity);
        }
        average.divideByEqual(boidCount - 1);
        this.boids[index].velocity.plusEqual(average.minus(this.boids[index].velocity).divideBy(Boids.alignmentValue));
    }
}

class View {
    private canvas : HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    size           : Vector2D;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.querySelector("#canvas");
        this.context = <CanvasRenderingContext2D>this.canvas.getContext("2d");
        this.size = new Vector2D();
    }

    update(): void {
        this.size.x = this.canvas.width  = window.innerWidth ;
        this.size.y = this.canvas.height = window.innerHeight;
    }

    drawBoids(boids: Boids): void {
        this.drawAllBoid(boids.boids);
    }

    private drawAllBoid(boids: Boid[]): void {
        this.context.clearRect(0, 0, this.size.x, this.size.y);

        for (let index = 0, length = boids.length; index < length; index++)
            boids[index].draw(this.context);
        this.drawCount(boids.length);
    }

    private drawCount(count: number): void {
        this.context.fillStyle = "#444";
        this.context.font = "16px sans-serif";
        this.context.fillText("count : " + String(count), 20, 40);
    }
}

class Program {
    private static initialBoidCount = 100;
    private static fps              =  30;
    private static createTime       =  10;
    private static startTime        = 100;

    private boids = new Boids();
    private view = new View();
    private appendTimer: number = 0;

    constructor() {
        setTimeout(() => this.initialize(), Program.startTime);
        this.initialize();
    }

    private initialize(): void {
        this.bindEvents();
        this.view.update();
        this.appendBoids(Program.initialBoidCount);
        setInterval(this.step.bind(this), 1000 / Program.fps);
    }

    private bindEvents(): void {
        window.addEventListener("mousedown", e => this.appendBoids(1, new Vector2D(e.pageX, e.pageY)));
        window.addEventListener("mouseup", () => clearInterval(this.appendTimer));
        window.addEventListener("resize", () =>  this.view.update());
    }

    private appendBoids(count: number, position?: Vector2D): void {
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

    private static createBoid(areaSize: Vector2D ,position?: Vector2D) {
        return new Boid(position || areaSize.innerProduct(new Vector2D(Math.random(), Math.random())), new Vector2D(), this.getRandomColor());
    }

    private static getRandomColor() {
        let colors = [0, 0, 0];
        colors = colors.map(() => {
            return Math.round(Math.random() * 0xff);
        });
        return "rgba(" + String(colors[0]) + ", " + String(colors[1]) + ", " + String(colors[2]) + ", " + String(Math.random()) + ")";
    }

    private step(): void {
        this.view.drawBoids(this.boids);
        this.boids.move(this.view.size);
    }
}

onload = () => new Program();
//document.addEventListener("DOMContentLoaded", () => new Program());