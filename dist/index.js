
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", () => $4fa36e821943b400$export$2e2bcd8739ae039);
class $4fa36e821943b400$var$WheelFortune {
    #containerEl;
    #segmentsEl;
    #buttonEl;
    #rotationCount;
    #segmentCount;
    #spinStates;
    #currentSpinIndex;
    #tlSpin;
    #tlBlackout;
    static gsap;
    constructor({ containerEl: containerEl = ".wheel", segmentsEl: segmentsEl = ".wheel__segments", buttonEl: buttonEl = ".wheel__button", rotationCount: rotationCount = 3, segmentCount: segmentCount = 8, spinStates: spinStates = [] } = {}){
        this.gsap = $4fa36e821943b400$var$WheelFortune.gsap || window.gsap;
        this.#rotationCount = rotationCount;
        this.#segmentCount = segmentCount;
        this.#spinStates = spinStates;
        this.#currentSpinIndex = 0;
        const getElement = (el)=>el instanceof HTMLElement ? el : document.querySelector(el);
        this.#containerEl = getElement(containerEl);
        this.#segmentsEl = getElement(segmentsEl);
        this.#buttonEl = getElement(buttonEl);
    }
    static registerGSAP(gsap) {
        $4fa36e821943b400$var$WheelFortune.gsap = gsap;
    }
    #calculate(stopSegment) {
        const fullCircle = 360;
        const segmentAngle = fullCircle / this.#segmentCount;
        const wheelTurn = fullCircle * this.#rotationCount;
        const rotation = wheelTurn - segmentAngle * (stopSegment - 1);
        return {
            fullCircle: fullCircle,
            wheelTurn: wheelTurn,
            rotation: rotation
        };
    }
    spin() {
        const { stopSegment: stopSegment, callback: callback } = this.#spinStates[this.#currentSpinIndex];
        const { fullCircle: fullCircle, wheelTurn: wheelTurn, rotation: rotation } = this.#calculate(stopSegment);
        this.#tlSpin = this.gsap.timeline({
            paused: true
        });
        this.#tlBlackout = this.gsap.timeline({
            paused: true
        });
        const spinBegin = ()=>{
            this.gsap.to(this.#containerEl, {
                "--blurring": "40px",
                duration: 1,
                delay: 0.25,
                ease: "circ.in"
            });
            this.#containerEl.classList.add("is-spinning");
        };
        const spinProcess = ()=>{
            this.gsap.to(this.#containerEl, {
                "--blurring": "0px",
                duration: 1,
                delay: 0.5,
                ease: "power2.out"
            });
        };
        const spinEnd = ()=>{
            if (callback) callback();
            this.#currentSpinIndex++;
            this.#containerEl.classList.remove("is-spinning");
            if (this.#currentSpinIndex >= this.#spinStates.length) this.#containerEl.classList.add("end-last-spin");
        };
        this.#tlSpin.to(this.#segmentsEl, {
            clearProps: "rotation",
            ease: "power2.in",
            rotation: `+=${wheelTurn}`,
            duration: 1.5,
            onStart: spinBegin
        }).to(this.#segmentsEl, {
            clearProps: "rotation",
            ease: "none",
            rotation: `+=${fullCircle}`,
            duration: 0.15,
            repeat: this.#rotationCount
        }).to(this.#segmentsEl, {
            ease: CustomEase.create("custom", "M0,0 C0.11,0.494 0.136,0.67 0.318,0.852 0.626,1.16 0.853,0.989 1,1"),
            rotation: `+=${rotation}`,
            duration: 3,
            onStart: spinProcess,
            onComplete: ()=>this.#tlBlackout.restart()
        });
        this.#tlBlackout.to(this.#containerEl, {
            "--blackout-opacity": "0.6",
            duration: 0.5,
            ease: "power2.in"
        }).to(this.#containerEl, {
            "--blackout-opacity": "0",
            duration: 0.5,
            ease: "power2.out",
            onComplete: spinEnd
        }, "<2");
        this.#tlSpin.restart();
    }
    spinAction() {
        this.#buttonEl.onclick = ()=>this.spin();
    }
    init() {
        this.spinAction();
        this.#containerEl.style.setProperty("--blackout-opacity", "0");
        this.#containerEl.style.setProperty("--blackout-angle", this.#segmentCount);
    }
    destroy() {
        this.gsap.killTweensOf([
            this.#containerEl,
            this.#segmentsEl
        ]);
        this.#buttonEl.onclick = null;
    }
}
var $4fa36e821943b400$export$2e2bcd8739ae039 = $4fa36e821943b400$var$WheelFortune;


//# sourceMappingURL=index.js.map
