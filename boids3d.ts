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

        move(): void {
            this.velocity.plusEqual(Boid.getRandomVector());
            this.position.plusEqual(this.velocity);
        }

        getDistance(another: Boid): number {
            return this.position.getDistance(another.position);
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
    import Boids    = Shos.Boids.Core3D.Boids;
    import Boid     = Shos.Boids.Core3D.Boid;

    enum Material {
        Basic, Lambert
    }

    class View {
        static defaultBoidSize      = 6;
        static boidSize             = View.defaultBoidSize;
        static defaultBoidMaterial  = Material.Basic;
        static boidMaterial         = View.defaultBoidMaterial;

        size                        = new Vector3D(1000, 1000);
        canvas                      = <HTMLCanvasElement>document.querySelector('#canvas');

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
        }

        private resetCamera() : void {
            this.camera.aspect = this.size.x / this.size.y;
            this.camera.position.set(this.size.x / 2, this.size.y / 2, this.camera.position.z);
            this.camera.lookAt(new THREE.Vector3(this.size.x / 2, this.size.y / 2, 0));
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
            this.updateMeshes(boids);
            this.createMeshes(boids);
            this.renderer.render(this.scene, this.camera);
        }

        private setRotation(mesh: THREE.Mesh, boid: Boid): void {
            mesh.rotation.x =  Math.atan2(boid.velocity.z, boid.velocity.y);
            mesh.rotation.y = 0;
            mesh.rotation.z = -Math.atan2(boid.velocity.x, boid.velocity.y);
        }

        private updateMeshes(boids: Boids): void {
            for (let index = 0, meshLength = this.meshes.length; index < meshLength; index++) {
                let boid = boids.boids[index];
                this.meshes[index].position.set(boid.position.x, boid.position.y, boid.position.z);
                this.setRotation(this.meshes[index], boid);
            }
        }

        private createMeshes(boids: Boids): void {
            for (let index = this.meshes.length, boidsLength =  boids.boids.length; this.meshes.length < boidsLength; index++) {
                let boid = boids.boids[index];
                let coneGeometry = new THREE.ConeGeometry(View.boidSize, View.boidSize * 7, 6);
                var material: THREE.Material;
                switch (View.boidMaterial) {
                    case Material.Lambert: material = new THREE.MeshBasicMaterial( {color: boid.color, transparent: true, opacity: boid.opacity } ); break;
                    default              : material = new THREE.MeshBasicMaterial( {color: boid.color, transparent: true, opacity: boid.opacity } ); break;
                }
                let mesh = new THREE.Mesh(coneGeometry, material);
                mesh.position.set(boid.position.x, boid.position.y, boid.position.z);
                this.setRotation(mesh, boid);
                this.scene.add(mesh);
                this.meshes.push(mesh);
            }
        }
    }

    class Settings {
        private static key = "ShoBoids3D";

        static get() : any {
            return  {
                boidSize           : View .boidSize                      ,
                boidMaterial       : View .boidMaterial != Material.Basic,
                randomParameter    : Boid .maximumRandomDistance         ,
                initialBoidCount   : Boids.initialBoidCount              ,
                maximumSpeed       : Boids.maximumSpeed                  ,
                cohesionParameter  : Boids.cohesionParameter             ,
                separationParameter: Boids.separationParameter           ,
                alignmentParameter : Boids.alignmentParameter
            };
        }

        static set(boidSize: number, boidMaterial: boolean, randomParameter: number, initialBoidCount: number, maximumSpeed: number, cohesionParameter: number, separationParameter: number, alignmentParameter: number) : void {
            View .boidSize              = boidSize                                        ;
            View .boidMaterial          = boidMaterial ? Material.Lambert : Material.Basic;
            Boid .maximumRandomDistance = randomParameter                                 ;
            Boids.initialBoidCount      = initialBoidCount                                ;
            Boids.maximumSpeed          = maximumSpeed                                    ;
            Boids.cohesionParameter     = cohesionParameter                               ;
            Boids.separationParameter   = separationParameter                             ;
            Boids.alignmentParameter    = alignmentParameter                              ;
        }

        static reset(): void {
            View .boidSize              = View .defaultBoidSize             ;
            View .boidMaterial          = View .defaultBoidMaterial         ;
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
            let jsonText = window.localStorage.getItem(Settings.key);
            if (jsonText == null)
                return false;
            let data = JSON.parse(jsonText);
            if (data == null)
                return false;
            Settings.set(data.boidSize, data.boidMaterial, data.randomParameter, data.initialBoidCount, data.maximumSpeed, data.cohesionParameter, data.separationParameter, data.alignmentParameter);
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
                settingForm.materialCheckBox.checked                ,
                Number(settingForm.randomParameterTextBox    .value),
                Number(settingForm.initialBoidCountTextBox   .value),
                Number(settingForm.maximumSpeedTextBox       .value),
                Number(settingForm.cohesionParameterTextBox  .value),
                Number(settingForm.separationParameterTextBox.value),
                Number(settingForm.alignmentParameterTextBox .value),
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

            let elements = document.getElementsByName("materialCheckBox");
            if (elements.length > 0)
                (<HTMLInputElement>(elements[0])).checked = settings.boidMaterial;
        }

        private static setToInput(inputName: string, value: number): void {
            let elements = document.getElementsByName(inputName);
            if (elements.length > 0)
                (<HTMLInputElement>(elements[0])).value = String(value);
        }
    }

    class Program {
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
        }

        private initialize(): void {
            this.bindEvents();
            this.view.update();
            this.appendBoids(Boids.initialBoidCount);
            setTimeout(() => this.step(), Program.startTime);

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
            let rect = element.getBoundingClientRect();
            return new Vector3D(e.clientX - rect.left, e.clientY - rect.top);
        }

        private static getTouchPosition(element: HTMLElement, e: TouchEvent): Vector3D {
            let rect = element.getBoundingClientRect();
            let touch = e.changedTouches[0];
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
}
