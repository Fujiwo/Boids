class Vector2D {
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
    private size = 5;

    position: Vector2D;
    velocity: Vector2D;
    private color   : string  ;

    get speed(): number {
        return this.velocity.absoluteValue;
    }

    constructor(position: Vector2D = new Vector2D(), velocity: Vector2D = new Vector2D(), color: string = "black") {
        this.position = position;
        this.velocity = velocity;
        this.color    = color   ;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.position.x,
            this.position.y,
            this.size / 2,
            0,
            Math.PI * 2,
            false
        );
        ctx.fill();
    }

    move(): void {
        this.position.plusEqual(this.velocity);
    }

    getDistance(another: Boid): number {
        return this.position.getDistance(another.position);
    }
}

class Boids {
    private maximumSpeed = 7;
    private cohesionValue = 100;
    private separationValue = 10;
    private alignmentValue = 8;

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

            if (speed >= this.maximumSpeed)
                boid.velocity = boid.velocity.multiply(this.maximumSpeed / speed);

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
        this.boids[index].velocity.plusEqual(center.minus(this.boids[index].position).divideBy(this.cohesionValue));
    }

    private separation(index: number): void {
        for (let i = 0, length = this.boids.length; i < length; i++) {
            if (i === index)
                continue;
            if (this.boids[i].getDistance(this.boids[index]) < this.separationValue)
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
        this.boids[index].velocity.plusEqual(average.minus(this.boids[index].velocity).divideBy(this.alignmentValue));
    }
}

class View {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    size: Vector2D;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.querySelector("#canvas");
        this.ctx = <CanvasRenderingContext2D>this.canvas.getContext("2d");
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
        this.ctx.clearRect(0, 0, this.size.x, this.size.y);

        for (let index = 0, length = boids.length; index < length; index++)
            boids[index].draw(this.ctx);
        this.drawCount(boids.length);
    }

    private drawCount(count: number): void {
        this.ctx.fillStyle = "#444";
        this.ctx.font = "16px sans-serif";
        this.ctx.fillText("count : " + String(count), 20, 40);
    }
}

class Program {
    private initialBoidCount = 100;
    private fps          = 30;
    private createTime = 10;
    private startTime = 500;
    private boids = new Boids();
    private view = new View();
    private appendTimer: number = 0;

    constructor() {
        setTimeout(() => this.initialize(), this.startTime);
    }

    private initialize(): void {
        this.bindEvents();
        this.view.update();
        this.appendBoids(this.initialBoidCount);
        setInterval(this.step.bind(this), 1000 / this.fps);
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
            this.boids.append(this.createBoid(position));
            index++;
        }, this.createTime);
    }

    private createBoid(position?: Vector2D) {
        return new Boid(position || this.view.size.innerProduct(new Vector2D(Math.random(), Math.random())), new Vector2D(), this.getRandomColor());
    }

    private getRandomColor() {
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

document.addEventListener("DOMContentLoaded", () => new Program());