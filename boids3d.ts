namespace Shos.Boids.Core3D.Helper {
    export class Vector3D {
        x: number;
        y: number;
        z: number;

        get absoluteValue(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        constructor(x: number = 0, y: number = 0, z: number = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        clone(): Vector3D {
            return new Vector3D(this.x, this.y, this.z);
        }

        plus(another: Vector3D): Vector3D {
            return new Vector3D(this.x + another.x, this.y + another.y, this.z + another.z);
        }

        plusEqual(another: Vector3D): void {
            this.x += another.x;
            this.y += another.y;
            this.z += another.z;
        }

        minus(another: Vector3D): Vector3D {
            return new Vector3D(this.x - another.x, this.y - another.y, this.z - another.z);
        }

        minusEqual(another: Vector3D): void {
            this.x -= another.x;
            this.y -= another.y;
            this.z -= another.z;
        }

        multiply(value: number): Vector3D {
            return new Vector3D(this.x * value, this.y * value, this.z * value);
        }

        innerProduct(another: Vector3D): Vector3D {
            return new Vector3D(this.x * another.x, this.y * another.y, this.z * another.z);
        }

        divideBy(value: number): Vector3D {
            return new Vector3D(this.x / value, this.y / value, this.z / value);
        }

        divideByEqual(value: number): void {
            this.x /= value;
            this.y /= value;
            this.z /= value;
        }

        getDistance(another: Vector3D): number {
            return this.minus(another).absoluteValue;
        }
    } 
}

namespace Shos.Boids.Core3D {
    import Vector3D =  Shos.Boids.Core3D.Helper.Vector3D;

    export class Boid {
        static defaultSize                  = 4;
        static defaultMaximumRandomDistance = 2;

        static size                         = Boid.defaultSize;
        static maximumRandomDistance        = Boid.defaultMaximumRandomDistance;

        position     : Vector3D;
        velocity     : Vector3D;
        private color: string  ;

        get speed(): number {
            return this.velocity.absoluteValue;
        }

        constructor(position: Vector3D = new Vector3D(), velocity: Vector3D = new Vector3D(), color: string = "black") {
            this.position = position;
            this.velocity = velocity;
            this.color    = color   ;
        }

        draw(context: CanvasRenderingContext2D): void {
            this.drawShape(context, this.position, Boid.size, this.color);
        }

        move(): void {
            this.velocity.plusEqual(Boid.getRandomVector());
            this.position.plusEqual(this.velocity);
        }

        getDistance(another: Boid): number {
            return this.position.getDistance(another.position);
        }

        private drawShape(context: CanvasRenderingContext2D, center: Vector3D, size: number, color: string) {
            let halfVelocity          = this.velocity.multiply(size / 2);
            let point1                = this.position.plus(halfVelocity);
            let middlePoint           = this.position.minus(halfVelocity);
            let velocityAbsoluteValue = this.velocity.absoluteValue;
            let unitVelocity          = this.velocity.multiply(size / (velocityAbsoluteValue * velocityAbsoluteValue));
            let point2                = middlePoint.plus(new Vector3D( unitVelocity.y, -unitVelocity.x));
            let point3                = middlePoint.plus(new Vector3D(-unitVelocity.y,  unitVelocity.x));
            Boid.drawPolygon(context, [point1, point2, point3], color);
        }

        private static drawPolygon(context: CanvasRenderingContext2D, polygon: Vector3D[], color: string) {
            let polygonLength = polygon.length;
            if (polygonLength < 2)
                return;
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(polygon[0].x, polygon[0].y);
            for (let index = 1; index < polygonLength; index++)
                context.lineTo(polygon[index].x, polygon[index].y);
            context.fill();
        }

        private static getRandomVector(): Vector3D {
            return new Vector3D(Boid.getRandomDistance(), Boid.getRandomDistance(), Boid.getRandomDistance());       
        }

        private static getRandomDistance(): number {
            return Boid.maximumRandomDistance * (Math.random() + Math.random()) - Boid.maximumRandomDistance;
        }
    }

    export class Boids {
        static defaultInitialBoidCount     = 250;
        static defaultMaximumSpeed         =   8;
        static defaultCohesionParameter    = 100;
        static defaultSeparationParameter  =  10;
        static defaultAlignmentParameter   =   7;

        static initialBoidCount    = Boids.defaultInitialBoidCount   ;
        static maximumSpeed        = Boids.defaultMaximumSpeed       ;
        static cohesionParameter   = Boids.defaultCohesionParameter  ;
        static separationParameter = Boids.defaultSeparationParameter;
        static alignmentParameter  = Boids.defaultAlignmentParameter ;

        boids: Boid[] = [];

        append(boid: Boid): void {
            this.boids.push(boid);
        }

        move(size: Vector3D): void {
            let sum = this.getSum();
            let boidCount = this.boids.length;

            for (let index = 0; index < boidCount; index++) {
                let boid = this.boids[index];
                let speed = boid.speed;

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
        }

        private getSum() : Boid {
            let sum = new Boid();
            let boidCount = this.boids.length;
            for (let index = 0; index < boidCount; index++) {
                sum.position.plusEqual(this.boids[index].position);
                sum.velocity.plusEqual(this.boids[index].velocity);
            }
            return sum;
        }

        private cohesion(sum: Vector3D, boid: Boid): void {
            let center = sum.clone();
            center.minusEqual(boid.position);
            center.divideByEqual(this.boids.length - 1);
            boid.velocity.plusEqual(center.minus(boid.position).divideBy(Boids.cohesionParameter));
        }

        private separation(index: number): void {
            for (let i = 0, length = this.boids.length; i < length; i++) {
                if (i === index)
                    continue;
                if (this.boids[i].getDistance(this.boids[index]) < Boids.separationParameter)
                    this.boids[index].velocity.minusEqual(this.boids[i].position.minus(this.boids[index].position));
            }
        }

        private alignment(sum: Vector3D, boid: Boid): void {
            let average = sum.clone();
            average.minusEqual(boid.velocity);
            average.divideByEqual(this.boids.length - 1);
            boid.velocity.plusEqual(average.minus(boid.velocity).divideBy(Boids.alignmentParameter));
        }
    }
}

namespace Shos.Boids.Application3D {
    import Vector3D = Shos.Boids.Core3D.Helper.Vector3D;
    import Boids = Shos.Boids.Core3D.Boids;
    import Boid = Shos.Boids.Core3D.Boid;

    class View {
        private static sizeRate: number = 0.95;
        private context        : CanvasRenderingContext2D;
        canvas                 : HTMLCanvasElement;
        size                            = new Vector3D();

        constructor() {
            this.canvas = <HTMLCanvasElement>document.querySelector("#canvas");
            this.context = <CanvasRenderingContext2D>this.canvas.getContext("2d");
        }

        update(): void {
            let panel = <HTMLDivElement>document.getElementById("panel");
            this.size.x = this.canvas.width  = Math.round(window.innerWidth * View.sizeRate);
            this.size.y = this.canvas.height = Math.round((window.innerHeight - (panel == null ? 0 : panel.clientHeight)) * View.sizeRate);
            this.size.z = Math.sqrt(this.size.x * this.size.y);
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
            this.context.fillStyle = "gray";
            this.context.font = "14px";
            this.context.fillText("Boids: " + String(count), 20, 20);
        }
    }

    class Settings {
        private static key = "ShoBoids3D";

        static get() : any {
            return  {
                boidSize           : Boid .size                 ,
                randomParameter    : Boid .maximumRandomDistance,
                initialBoidCount   : Boids.initialBoidCount     ,
                maximumSpeed       : Boids.maximumSpeed         ,
                cohesionParameter  : Boids.cohesionParameter    ,
                separationParameter: Boids.separationParameter  ,
                alignmentParameter : Boids.alignmentParameter
            };
        }

        static set(boidSize: number, randomParameter: number, initialBoidCount: number, maximumSpeed: number, cohesionParameter: number, separationParameter: number, alignmentParameter: number) : void {
            Boid .size                  = boidSize           ;
            Boid .maximumRandomDistance = randomParameter    ;
            Boids.initialBoidCount      = initialBoidCount   ;
            Boids.maximumSpeed          = maximumSpeed       ;
            Boids.cohesionParameter     = cohesionParameter  ;
            Boids.separationParameter   = separationParameter;
            Boids.alignmentParameter    = alignmentParameter ;
        }

        static reset(): void {
            Boid .size                  = Boid .defaultSize                 ;
            Boid .maximumRandomDistance = Boid .defaultMaximumRandomDistance;
            Boids.initialBoidCount      = Boids.defaultInitialBoidCount     ;
            Boids.maximumSpeed          = Boids.defaultMaximumSpeed         ;
            Boids.cohesionParameter     = Boids.defaultCohesionParameter    ;
            Boids.separationParameter   = Boids.defaultSeparationParameter  ;
            Boids.alignmentParameter    = Boids.defaultAlignmentParameter   ;
        }

        static save(): boolean {
            if (!window.localStorage)
                return false;
            window.localStorage.setItem(Settings.key, JSON.stringify(Settings.get()));
            return true;
        }

        static load(): boolean {
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
        }
    }

    class SettingsPanel {
        static initialize(): void {
            SettingsPanel.initializeHandlers();
            SettingsPanel.initializeForm();
        }

        private static initializeHandlers(): void {
            (<HTMLInputElement>document.getElementById("submitButton")).onclick = SettingsPanel.onFormSubmit;
            (<HTMLInputElement>document.getElementById("resetButton" )).onclick = SettingsPanel.onReset     ;
        }

        private static onFormSubmit(): void {
            let settingForm = (<any>document).settingForm;
            Settings.set(
                Number(settingForm.boidSizeTextBox           .value),
                Number(settingForm.randomParameterTextBox    .value),
                Number(settingForm.initialBoidCountTextBox   .value),
                Number(settingForm.maximumSpeedTextBox       .value),
                Number(settingForm.cohesionParameterTextBox  .value),
                Number(settingForm.separationParameterTextBox.value),
                Number(settingForm.alignmentParameterTextBox .value)
            );
            Settings.save();
        }

        private static onReset(): void {
            Settings.reset();
            Settings.save();
            SettingsPanel.initializeForm();
        }

        private static initializeForm(): void {
            let settings = Settings.get();
            SettingsPanel.setToInput("boidSizeTextBox"           , settings.boidSize           );
            SettingsPanel.setToInput("randomParameterTextBox"    , settings.randomParameter    );
            SettingsPanel.setToInput("initialBoidCountTextBox"   , settings.initialBoidCount   );
            SettingsPanel.setToInput("maximumSpeedTextBox"       , settings.maximumSpeed       );
            SettingsPanel.setToInput("cohesionParameterTextBox"  , settings.cohesionParameter  );
            SettingsPanel.setToInput("separationParameterTextBox", settings.separationParameter);
            SettingsPanel.setToInput("alignmentParameterTextBox" , settings.alignmentParameter );
        }

        private static setToInput(inputName: string, value: number): void {
            let elements = document.getElementsByName(inputName);
            if (elements.length > 0)
                (<HTMLInputElement>(elements[0])).value = String(value);
        }
    }

    class Program {
        private static fps              =  30;
        private static createTime       =  10;
        private static startTime        = 100;
        private static colorValueBase   = 0xa0; // 0x00~0xff
        private static opacityBase1     = 0.40; // 0.0~opacityBase2
        private static opacityBase2     = 0.60; // opacityBase1~1.0

        private boids = new Boids();
        private view = new View();
        private appendTimer: number = 0;

        constructor() {
            Settings.load();
            setTimeout(() => this.initialize(), Program.startTime);
        }

        private initialize(): void {
            this.bindEvents();
            this.view.update();
            this.appendBoids(Boids.initialBoidCount);
            setInterval(() => this.step(), 1000 / Program.fps);
            SettingsPanel.initialize();
        }

        private bindEvents(): void {
            this.view.canvas.addEventListener("mousedown", e => this.appendBoids(1, Program.getMousePosition(this.view.canvas, e)));
            this.view.canvas.addEventListener("touchstart", e => this.appendBoids(1, Program.getTouchPosition(this.view.canvas, e)));
            this.view.canvas.addEventListener("mouseup", () => clearInterval(this.appendTimer));
            this.view.canvas.addEventListener("touchend", () => clearInterval(this.appendTimer));
            window.addEventListener("resize", () =>  this.view.update());
        }

        private static getMousePosition(element: HTMLElement, e: MouseEvent): Vector3D {
            var rect = element.getBoundingClientRect();
            return new Vector3D(e.clientX - rect.left, e.clientY - rect.top);
        }

        private static getTouchPosition(element: HTMLElement, e: TouchEvent): Vector3D {
            var rect = element.getBoundingClientRect();
            var touch = e.changedTouches[0];
            return new Vector3D(touch.clientX - rect.left, touch.clientY - rect.top);
        }

        private appendBoids(count: number, position?: Vector3D): void {
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

        private static createBoid(areaSize: Vector3D, position?: Vector3D) {
            return new Boid(position || areaSize.innerProduct(new Vector3D(Math.random(), Math.random(), Math.random())), new Vector3D(), this.getRandomColor());
        }

        private static getRandomColor(): string {
            return "rgba(" + String(Program.getRandomColorValue()) + ", " + String(Program.getRandomColorValue()) + ", " + String(Program.getRandomColorValue()) + ", " + String(Program.getOpactiy()) + ")";
        }

        private static getRandomColorValue(): number {
            return Math.round(Math.random() * Program.colorValueBase);
        }

        private static getOpactiy(): number {
            return Math.round(Math.random() * (Program.opacityBase2 - Program.opacityBase1) + Program.opacityBase1);
        }

        private step(): void {
            this.view.drawBoids(this.boids);
            this.boids.move(this.view.size);
        }
    }

    onload = () => new Program();
}
