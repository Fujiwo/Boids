/// <reference path="three.d.ts" />

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
        static defaultMaximumRandomDistance = 2;
        static maximumRandomDistance        = Boid.defaultMaximumRandomDistance;

        position        : Vector3D;
        velocity        : Vector3D;
        private opacity_: number  ;
        private color_  : number  ;

        get color(): number {
            return this.color_;
        }

        get opacity(): number {
            return this.opacity_;
        }

        get speed(): number {
            return this.velocity.absoluteValue;
        }

        constructor(position: Vector3D = new Vector3D(), velocity: Vector3D = new Vector3D(), color: number = 0xffffff, opacity: number = 1.0) {
            this.position = position;
            this.velocity = velocity;
            this.color_   = color   ;
            this.opacity_ = opacity  ;
        }

        // draw(context: CanvasRenderingContext2D): void {
        //     this.drawShape(context, this.position, Boid.size, this.color);
        // }

        move(): void {
            this.velocity.plusEqual(Boid.getRandomVector());
            this.position.plusEqual(this.velocity);
        }

        getDistance(another: Boid): number {
            return this.position.getDistance(another.position);
        }

        // private drawShape(context: CanvasRenderingContext2D, center: Vector3D, size: number, color: string) {
        //     let halfVelocity          = this.velocity.multiply(size / 2);
        //     let point1                = this.position.plus(halfVelocity);
        //     let middlePoint           = this.position.minus(halfVelocity);
        //     let velocityAbsoluteValue = this.velocity.absoluteValue;
        //     let unitVelocity          = this.velocity.multiply(size / (velocityAbsoluteValue * velocityAbsoluteValue));
        //     let point2                = middlePoint.plus(new Vector3D( unitVelocity.y, -unitVelocity.x));
        //     let point3                = middlePoint.plus(new Vector3D(-unitVelocity.y,  unitVelocity.x));
        //     Boid.drawPolygon(context, [point1, point2, point3], color);
        // }

        // private static drawPolygon(context: CanvasRenderingContext2D, polygon: Vector3D[], color: string) {
        //     let polygonLength = polygon.length;
        //     if (polygonLength < 2)
        //         return;
        //     context.fillStyle = color;
        //     context.beginPath();
        //     context.moveTo(polygon[0].x, polygon[0].y);
        //     for (let index = 1; index < polygonLength; index++)
        //         context.lineTo(polygon[index].x, polygon[index].y);
        //     context.fill();
        // }

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
                if (boid.position.z < 0 && boid.velocity.z < 0 || boid.position.z > size.z && boid.velocity.z > 0)
                    boid.velocity.z *= -1;

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

    // function init() {
    //     const width = 960;
    //     const height = 540;
      
    //     // レンダラーを作成
    //     const renderer = new THREE.WebGLRenderer({
    //       canvas: <HTMLCanvasElement>document.querySelector('#canvas')
    //     });
    //     renderer.setPixelRatio(window.devicePixelRatio);
    //     renderer.setSize(width, height);
      
    //     // シーンを作成
    //     const scene = new THREE.Scene();
      
    //     // カメラを作成
    //     const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    //     camera.position.set(0, 0, +1000);
    //     const controls = new THREE.OrbitControls(camera);
      
    //     // 箱を作成
    //     const geometry = new THREE.BoxGeometry(500, 500, 500);
    //     const material = new THREE.MeshStandardMaterial({color: 0x0000FF});
    //     const box = new THREE.Mesh(geometry, material);
    //     scene.add(box);
      
    //     // 平行光源
    //     const light1 = new THREE.DirectionalLight(0xFFFFFF, 2.0);
    //     const light2 = new THREE.AmbientLight(0xFFFFFF, 1.0);
    //     //light1.position.set(1, 1, 1);
    //     // シーンに追加
    //     scene.add(light1);
    //     scene.add(light2);
      
    //     // 初回実行
    //     tick();
      
    //     function tick() {
    //       requestAnimationFrame(tick);
      
    //       // 箱を回転させる
    //       box.rotation.x += 0.01;
    //       box.rotation.y += 0.01;
      
    //       // レンダリング
    //       renderer.render(scene, camera);
    //     }
    // }

    class View {
        static defaultBoidSize  = 6;
        static boidSize         = View.defaultBoidSize;

        size                    = new Vector3D(1000, 1000);
        canvas                  = <HTMLCanvasElement>document.querySelector('#canvas');

        private renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        private scene = new THREE.Scene();
        private camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, this.size.x / this.size.y, 1, 100000);
        private meshes: THREE.Mesh[] = [];

        private static sizeRate: number = 0.95;

        moveCamera(offset: THREE.Vector3) : void {
            this.camera.position.addVectors(this.camera.position, offset);
        }

        private setCamera() : void {
            this.camera.position.set(this.size.x / 2, this.size.y / 2, 5000);
            this.camera.lookAt(new THREE.Vector3(this.size.x / 2, this.size.y / 2, 0));
            //this.controls = new THREE.OrbitControls(this.camera);
        }

        private resetCamera() : void {
            this.camera.aspect = this.size.x / this.size.y;
            this.camera.position.set(this.size.x / 2, this.size.y / 2, this.camera.position.z);
            this.camera.lookAt(new THREE.Vector3(this.size.x / 2, this.size.y / 2, 0));
            // this.camera.position.set(5000, this.size.y / 2, this.size.z / 2);
            // this.camera.lookAt(new THREE.Vector3(0, this.size.x / 2, this.size.z / 2));
        }

        private setLight() : void {
            this.scene.add(new THREE.DirectionalLight(0xFFFFFF, 2.0));
            this.scene.add(new THREE.AmbientLight(0xFFFFFF, 1.0));
        }
  
        constructor() {
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.size.x, this.size.y);
            this.setCamera();
            this.setLight();
        }

        update(): void {
            let panel = <HTMLDivElement>document.getElementById("panel");
            this.size.x = Math.round(window.innerWidth * View.sizeRate);
            this.size.y = Math.round((window.innerHeight - (panel == null ? 0 : panel.clientHeight)) * View.sizeRate);
            this.size.z = Math.sqrt(this.size.x * this.size.y);
            this.renderer.setSize(this.size.x, this.size.y);
            this.resetCamera();
        }

        drawBoids(boids: Boids): void {
            for (let index = 0, meshLength = this.meshes.length; index < meshLength; index++) {
                let boid = boids.boids[index];
                this.meshes[index].position.set(boid.position.x, boid.position.y, boid.position.z);
                this.meshes[index].rotation.x = Math.atan2(boid.velocity.z, boid.velocity.y);
                this.meshes[index].rotation.z = -Math.atan2(boid.velocity.x, boid.velocity.y);
            }
            for (let index = this.meshes.length, boidsLength =  boids.boids.length; this.meshes.length < boidsLength; index++) {
                let boid = boids.boids[index];
                let coneGeometry = new THREE.ConeGeometry(View.boidSize, View.boidSize * 7, 6);
                let coneMaterial = new THREE.MeshBasicMaterial( {color: boid.color, transparent: true, opacity: boid.opacity } );
                let cone = new THREE.Mesh(coneGeometry, coneMaterial);
                cone.position.set(boid.position.x, boid.position.y, boid.position.z);
                cone.rotation.x = Math.atan2(boid.velocity.z, boid.velocity.y);
                cone.rotation.y = 0;
                cone.rotation.z = -Math.atan2(boid.velocity.x, boid.velocity.y);
                this.scene.add(cone);
                this.meshes.push(cone);
            }

            // this.box.rotation.x += 0.01;
            // this.box.rotation.y += 0.02;
            // this.box.rotation.z += 0.001;

            // this.cone.rotation.x += 0.02;
            // this.cone.rotation.y += 0.001;
            // this.cone.rotation.z += 0.01;

            //this.drawAllBoid(boids.boids);
            this.renderer.render(this.scene, this.camera);
        }

        // private drawAllBoid(boids: Boid[]): void {
        //     this.context.clearRect(0, 0, this.size.x, this.size.y);

        //     for (let index = 0, length = boids.length; index < length; index++)
        //         boids[index].draw(this.context);
        //     //this.drawCount(boids.length);
        // }

        // private drawCount(count: number): void {
        //     this.context.fillStyle = "gray";
        //     this.context.font = "14px";
        //     this.context.fillText("Boids: " + String(count), 20, 20);
        // }
    }

    class Settings {
        private static key = "ShoBoids3D";

        static get() : any {
            return  {
                boidSize           : View .boidSize             ,
                randomParameter    : Boid .maximumRandomDistance,
                initialBoidCount   : Boids.initialBoidCount     ,
                maximumSpeed       : Boids.maximumSpeed         ,
                cohesionParameter  : Boids.cohesionParameter    ,
                separationParameter: Boids.separationParameter  ,
                alignmentParameter : Boids.alignmentParameter
            };
        }

        static set(boidSize: number, randomParameter: number, initialBoidCount: number, maximumSpeed: number, cohesionParameter: number, separationParameter: number, alignmentParameter: number) : void {
            View .boidSize              = boidSize           ;
            Boid .maximumRandomDistance = randomParameter    ;
            Boids.initialBoidCount      = initialBoidCount   ;
            Boids.maximumSpeed          = maximumSpeed       ;
            Boids.cohesionParameter     = cohesionParameter  ;
            Boids.separationParameter   = separationParameter;
            Boids.alignmentParameter    = alignmentParameter ;
        }

        static reset(): void {
            View .boidSize              = View .defaultBoidSize             ;
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
        //private static fps              =  30;
        private static createTime       =  10;
        private static startTime        = 100;
        private static colorValueBase   = 0x40; // 0x00~0xff
        private static opacityBase1     = 0.40; // 0.0~opacityBase2
        private static opacityBase2     = 0.60; // opacityBase1~1.0

        private boids = new Boids();
        private view = new View();
        private appendTimer: number = 0;

        constructor() {
            Settings.load();
            setTimeout(() => this.initialize(), Program.startTime);
            //this.initialize();
        }

        private initialize(): void {
            this.bindEvents();
            this.view.update();
            this.appendBoids(Boids.initialBoidCount);
            //setInterval(() => this.step(), 1000 / Program.fps);
            setTimeout(() => this.step(), Program.startTime);
            //this.step();

            SettingsPanel.initialize();
        }

        private bindEvents(): void {
            this.view.canvas.addEventListener("mousedown", e => this.appendBoids(1, Program.getMousePosition(this.view.canvas, e)));
            this.view.canvas.addEventListener("touchstart", e => this.appendBoids(1, Program.getTouchPosition(this.view.canvas, e)));
            this.view.canvas.addEventListener("mouseup", () => clearInterval(this.appendTimer));
            this.view.canvas.addEventListener("touchend", () => clearInterval(this.appendTimer));
            window.addEventListener("resize", () =>  this.view.update());
            (<HTMLInputElement>document.getElementById("forwardButton" )).onclick = () => this.view.moveCamera(new THREE.Vector3(0, 0, -1000));
            (<HTMLInputElement>document.getElementById("backwardButton")).onclick = () => this.view.moveCamera(new THREE.Vector3(0, 0,  1000));
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
            return new Boid(position || areaSize.innerProduct(new Vector3D(Math.random(), Math.random(), Math.random())), new Vector3D(), this.getRandomColor(), this. getOpactiy());
        }

        private static getRandomColor(): number {
            return Program.getRandomColorValue() * (0x100 * 0x100) + Program.getRandomColorValue() * 0x100 + Program.getRandomColorValue();
        }

        private static getRandomColorValue(): number {
            return Math.round(0xff - Math.random() * Program.colorValueBase);
        }

        private static getOpactiy(): number {
            return Math.round(Math.random() * (Program.opacityBase2 - Program.opacityBase1) + Program.opacityBase1);
        }

        private step(): void {
            this.view.drawBoids(this.boids);
            this.boids.move(this.view.size);
            requestAnimationFrame(() => this.step());
        }
    }

    onload = () => new Program();
    //onload = () => init();
}
