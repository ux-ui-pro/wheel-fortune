
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", function () { return $a196c1ed25598f0e$export$2e2bcd8739ae039; });
class $a196c1ed25598f0e$var$WheelFortune {
    containerEl;
    segmentsEl;
    buttonEl;
    rotationCount;
    segmentCount;
    spinStates;
    currentSpinIndex;
    tlSpin;
    tlBlackout;
    wheelLibration;
    tlLibration;
    static gsap = null;
    static customEase = null;
    constructor({ containerEl: containerEl = ".wheel", segmentsEl: segmentsEl = ".wheel__segments", buttonEl: buttonEl = ".wheel__button", rotationCount: rotationCount = 3, segmentCount: segmentCount = 8, spinStates: spinStates = [], wheelLibration: wheelLibration = false } = {}){
        if (!$a196c1ed25598f0e$var$WheelFortune.gsap || !$a196c1ed25598f0e$var$WheelFortune.customEase) throw new Error("GSAP is not registered. Please call WheelFortune.registerGSAP() first.");
        this.rotationCount = rotationCount;
        this.segmentCount = segmentCount;
        this.spinStates = spinStates;
        this.currentSpinIndex = 0;
        this.wheelLibration = wheelLibration;
        this.tlSpin = null;
        this.tlBlackout = null;
        this.tlLibration = null;
        const getElement = (el)=>{
            if (el instanceof HTMLElement) return el;
            const element = document.querySelector(el);
            if (!element) throw new Error(`Element ${el} not found`);
            return element;
        };
        this.containerEl = getElement(containerEl);
        this.segmentsEl = getElement(segmentsEl);
        this.buttonEl = getElement(buttonEl);
    }
    static registerGSAP(gsapInstance, customEase) {
        $a196c1ed25598f0e$var$WheelFortune.gsap = gsapInstance;
        $a196c1ed25598f0e$var$WheelFortune.customEase = customEase;
    }
    calculate(stopSegment) {
        const fullCircle = 360;
        const segmentAngle = fullCircle / this.segmentCount;
        const wheelTurn = fullCircle * this.rotationCount;
        const rotation = wheelTurn - segmentAngle * (stopSegment - 1);
        return {
            fullCircle: fullCircle,
            wheelTurn: wheelTurn,
            rotation: rotation
        };
    }
    createSpinTimeline(wheelTurn, fullCircle, rotation, callback) {
        const timeline = $a196c1ed25598f0e$var$WheelFortune.gsap.timeline({
            paused: true
        });
        timeline.to(this.segmentsEl, {
            clearProps: "rotation",
            ease: "power2.in",
            rotation: `+=${wheelTurn}`,
            duration: 1.5,
            onStart: ()=>{
                $a196c1ed25598f0e$var$WheelFortune.gsap.to(this.containerEl, {
                    "--blurring": "40px",
                    duration: 1,
                    delay: 0.25,
                    ease: "circ.in"
                });
                this.containerEl.classList.add("is-spinning");
            }
        }).to(this.segmentsEl, {
            clearProps: "rotation",
            ease: "none",
            rotation: `+=${fullCircle}`,
            duration: 0.15,
            repeat: this.rotationCount
        }).to(this.segmentsEl, {
            ease: $a196c1ed25598f0e$var$WheelFortune.customEase.create("custom", "M0,0 C0.11,0.494 0.136,0.67 0.318,0.852 0.626,1.16 0.853,0.989 1,1"),
            rotation: `+=${rotation}`,
            duration: 3,
            onStart: ()=>{
                $a196c1ed25598f0e$var$WheelFortune.gsap.to(this.containerEl, {
                    "--blurring": "0px",
                    duration: 1,
                    delay: 0.5,
                    ease: "power2.out"
                });
            },
            onComplete: ()=>{
                if (callback) callback();
                this.tlBlackout.restart();
            }
        });
        return timeline;
    }
    createBlackoutTimeline() {
        const timeline = $a196c1ed25598f0e$var$WheelFortune.gsap.timeline({
            paused: true
        });
        timeline.to(this.containerEl, {
            "--blackout-opacity": "0.6",
            duration: 0.5,
            ease: "power2.in"
        }).to(this.containerEl, {
            "--blackout-opacity": "0",
            duration: 0.5,
            ease: "power2.out",
            onComplete: ()=>{
                this.currentSpinIndex += 1;
                this.containerEl.classList.remove("is-spinning");
                if (this.currentSpinIndex >= this.spinStates.length) this.containerEl.classList.add("end-last-spin");
            }
        });
        return timeline;
    }
    spin() {
        if (this.tlLibration) {
            this.tlLibration.kill();
            this.tlLibration = null;
        }
        if (!this.spinStates.length) return;
        if (this.currentSpinIndex >= this.spinStates.length) return;
        const { stopSegment: stopSegment, callback: callback } = this.spinStates[this.currentSpinIndex];
        const { fullCircle: fullCircle, wheelTurn: wheelTurn, rotation: rotation } = this.calculate(stopSegment);
        this.tlSpin = this.createSpinTimeline(wheelTurn, fullCircle, rotation, callback);
        this.tlBlackout = this.createBlackoutTimeline();
        this.tlSpin.restart();
    }
    libration() {
        this.tlLibration = $a196c1ed25598f0e$var$WheelFortune.gsap.timeline();
        this.tlLibration.set(this.segmentsEl, {
            rotate: 0
        }).to(this.segmentsEl, {
            rotate: -6,
            duration: 0.75,
            ease: "power1.inOut"
        }).fromTo(this.segmentsEl, {
            rotate: -6
        }, {
            rotate: 6,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });
    }
    spinAction() {
        this.buttonEl.onclick = ()=>this.spin();
    }
    init() {
        this.spinAction();
        this.containerEl.style.setProperty("--blackout-opacity", "0");
        this.containerEl.style.setProperty("--blackout-angle", `${this.segmentCount}`);
        if (this.wheelLibration) this.libration();
    }
    destroy() {
        $a196c1ed25598f0e$var$WheelFortune.gsap.killTweensOf([
            this.containerEl,
            this.segmentsEl
        ]);
        this.buttonEl.onclick = null;
    }
}
var $a196c1ed25598f0e$export$2e2bcd8739ae039 = $a196c1ed25598f0e$var$WheelFortune;


//# sourceMappingURL=index.js.map
