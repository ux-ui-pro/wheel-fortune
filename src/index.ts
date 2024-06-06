type SpinState = {
  stopSegment: number;
  callback?: () => void;
};

interface WheelFortuneConfig {
  containerEl?: HTMLElement | string;
  segmentsEl?: HTMLElement | string;
  buttonEl?: HTMLElement | string;
  rotationCount?: number;
  segmentCount?: number;
  spinStates?: SpinState[];
  wheelLibration?: boolean;
}

interface GSAPAnimationVars {
  clearProps?: string;
  ease?: string | object;
  rotation?: string | number;
  duration?: number;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  '--blurring'?: string;
  '--blackout-opacity'?: string;
  rotate?: number;
}

interface GSAPTimeline {
  paused?: boolean;
  to: (element: HTMLElement, vars: GSAPAnimationVars) => GSAPTimeline;
  fromTo: (element: HTMLElement, fromVars: GSAPAnimationVars, toVars: GSAPAnimationVars) => GSAPTimeline;
  set: (element: HTMLElement, vars: GSAPAnimationVars) => GSAPTimeline;
  restart: () => void;
  kill: () => void;
}

interface GSAP {
  timeline: (vars?: Record<string, unknown>) => GSAPTimeline;
  to: (element: HTMLElement, vars: GSAPAnimationVars) => void;
  killTweensOf: (elements: HTMLElement | HTMLElement[]) => void;
}

interface CustomEase {
  create: (name: string, ease: string) => object;
}

class WheelFortune {
  private readonly containerEl: HTMLElement;

  private readonly segmentsEl: HTMLElement;

  private buttonEl: HTMLElement;

  private readonly rotationCount: number;

  private readonly segmentCount: number;

  private readonly spinStates: SpinState[];

  private currentSpinIndex: number;

  private tlSpin: GSAPTimeline | null;

  private tlBlackout: GSAPTimeline | null;

  private readonly wheelLibration: boolean;

  private tlLibration: GSAPTimeline | null;

  static gsap: GSAP | null = null;

  static customEase: CustomEase | null = null;

  constructor({
    containerEl = '.wheel',
    segmentsEl = '.wheel__segments',
    buttonEl = '.wheel__button',
    rotationCount = 3,
    segmentCount = 8,
    spinStates = [],
    wheelLibration = false,
  }: WheelFortuneConfig = {}) {
    if (!WheelFortune.gsap || !WheelFortune.customEase) {
      throw new Error('GSAP is not registered. Please call WheelFortune.registerGSAP() first.');
    }

    this.rotationCount = rotationCount;
    this.segmentCount = segmentCount;
    this.spinStates = spinStates;
    this.currentSpinIndex = 0;
    this.wheelLibration = wheelLibration;
    this.tlSpin = null;
    this.tlBlackout = null;
    this.tlLibration = null;

    const getElement = (el: HTMLElement | string): HTMLElement => {
      if (el instanceof HTMLElement) return el;

      const element = document.querySelector(el);

      if (!element) {
        throw new Error(`Element ${el} not found`);
      }

      return element as HTMLElement;
    };

    this.containerEl = getElement(containerEl);
    this.segmentsEl = getElement(segmentsEl);
    this.buttonEl = getElement(buttonEl);
  }

  static registerGSAP(gsapInstance: GSAP, customEase: CustomEase) {
    WheelFortune.gsap = gsapInstance;
    WheelFortune.customEase = customEase;
  }

  private calculate(stopSegment: number) {
    const fullCircle = 360;
    const segmentAngle = fullCircle / this.segmentCount;
    const wheelTurn = fullCircle * this.rotationCount;
    const rotation = wheelTurn - (segmentAngle * (stopSegment - 1));

    return { fullCircle, wheelTurn, rotation };
  }

  private createSpinTimeline(wheelTurn: number, fullCircle: number, rotation: number, callback?: () => void): GSAPTimeline {
    const timeline = WheelFortune.gsap!.timeline({ paused: true });

    timeline
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'power2.in',
        rotation: `+=${wheelTurn}`,
        duration: 1.5,
        onStart: () => {
            WheelFortune.gsap!.to(this.containerEl, {
              '--blurring': '40px',
              duration: 1,
              delay: 0.25,
              ease: 'circ.in',
            });

            this.containerEl.classList.add('is-spinning');
        },
      })
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'none',
        rotation: `+=${fullCircle}`,
        duration: 0.15,
        repeat: this.rotationCount,
      })
      .to(this.segmentsEl, {
        ease: WheelFortune.customEase!.create('custom', 'M0,0 C0.11,0.494 0.136,0.67 0.318,0.852 0.626,1.16 0.853,0.989 1,1'),
        rotation: `+=${rotation}`,
        duration: 3,
        onStart: () => {
            WheelFortune.gsap!.to(this.containerEl, {
              '--blurring': '0px',
              duration: 1,
              delay: 0.5,
              ease: 'power2.out',
            });
        },
        onComplete: () => {
          if (callback) callback();

            this.tlBlackout!.restart();
        },
      });

    return timeline;
  }

  private createBlackoutTimeline(): GSAPTimeline {
    const timeline = WheelFortune.gsap!.timeline({ paused: true });

    timeline
      .to(this.containerEl, {
        '--blackout-opacity': '0.6',
        duration: 0.5,
        ease: 'power2.in',
      })
      .to(this.containerEl, {
        '--blackout-opacity': '0',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          this.currentSpinIndex += 1;
          this.containerEl.classList.remove('is-spinning');

          if (this.currentSpinIndex >= this.spinStates.length) {
            this.containerEl.classList.add('end-last-spin');
          }
        },
      });

    return timeline;
  }

  public spin() {
    if (this.tlLibration) {
      this.tlLibration.kill();
      this.tlLibration = null;
    }

    if (!this.spinStates.length) {
      return;
    }

    if (this.currentSpinIndex >= this.spinStates.length) {
      return;
    }

    const { stopSegment, callback } = this.spinStates[this.currentSpinIndex];
    const { fullCircle, wheelTurn, rotation } = this.calculate(stopSegment);

    this.tlSpin = this.createSpinTimeline(wheelTurn, fullCircle, rotation, callback);
    this.tlBlackout = this.createBlackoutTimeline();

    this.tlSpin.restart();
  }

  private libration() {
    this.tlLibration = WheelFortune.gsap!.timeline();

    this.tlLibration
      .set(this.segmentsEl, {
        rotate: 0,
      })
      .to(this.segmentsEl, {
        rotate: -6,
        duration: 0.75,
        ease: 'power1.inOut',
      })
      .fromTo(this.segmentsEl, {
        rotate: -6,
      }, {
        rotate: 6,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
  }

  private spinAction() {
    this.buttonEl.onclick = () => this.spin();
  }

  public init() {
    this.spinAction();

    this.containerEl.style.setProperty('--blackout-opacity', '0');
    this.containerEl.style.setProperty('--blackout-angle', `${this.segmentCount}`);

    if (this.wheelLibration) {
      this.libration();
    }
  }

  public destroy() {
    WheelFortune.gsap!.killTweensOf([this.containerEl, this.segmentsEl]);
    this.buttonEl.onclick = null;
  }
}

export default WheelFortune;
