declare global {
  interface Window {
    gsap: any;
  }
}

type SpinState = {
  stopSegment: number;
  callback?: () => void;
};

type WheelFortuneOptions = {
  containerEl?: string | HTMLElement;
  segmentsEl?: string | HTMLElement;
  buttonEl?: string | HTMLElement;
  rotationCount?: number;
  segmentCount?: number;
  spinStates?: SpinState[];
  wheelLibration?: boolean;
};

class WheelFortune {
  private readonly containerEl: HTMLElement;
  private readonly segmentsEl: HTMLElement;
  private buttonEl: HTMLElement;
  private readonly rotationCount: number;
  private readonly segmentCount: number;
  private readonly spinStates: SpinState[];
  private currentSpinIndex: number;
  private tlSpin: any;
  private tlBlackout: any;
  private readonly wheelLibration: boolean;
  private tlLibration: any;

  static gsap: any;
  static customEase: any;

  constructor({
    containerEl = '.wheel',
    segmentsEl = '.wheel__segments',
    buttonEl = '.wheel__button',
    rotationCount = 3,
    segmentCount = 8,
    spinStates = [],
    wheelLibration = false,
  }: WheelFortuneOptions = {}) {
    const gsapInstance = WheelFortune.gsap || window.gsap;

    this.rotationCount = rotationCount;
    this.segmentCount = segmentCount;
    this.spinStates = spinStates;
    this.currentSpinIndex = 0;
    this.wheelLibration = wheelLibration;

    const getElement = (el: string | HTMLElement): HTMLElement =>
      el instanceof HTMLElement ? el : document.querySelector(el)!;

    this.containerEl = getElement(containerEl);
    this.segmentsEl = getElement(segmentsEl);
    this.buttonEl = getElement(buttonEl);

    WheelFortune.gsap = gsapInstance;
  }

  static registerGSAP(gsap: any, customEase: any) {
    WheelFortune.gsap = gsap;
    WheelFortune.customEase = customEase;
  }

  private calculate(stopSegment: number) {
    const fullCircle = 360;
    const segmentAngle = fullCircle / this.segmentCount;
    const wheelTurn = fullCircle * this.rotationCount;
    const rotation = wheelTurn - segmentAngle * (stopSegment - 1);

    return { fullCircle, wheelTurn, rotation };
  }

  public spin() {
    if (this.tlLibration) {
      this.tlLibration.kill();
      this.tlLibration = null;
    }

    const { stopSegment, callback } = this.spinStates[this.currentSpinIndex];
    const { fullCircle, wheelTurn, rotation } = this.calculate(stopSegment);

    this.tlSpin = WheelFortune.gsap.timeline({ paused: true });
    this.tlBlackout = WheelFortune.gsap.timeline({ paused: true });

    const spinBegin = () => {
      WheelFortune.gsap.to(this.containerEl, {
        '--blurring': '40px',
        duration: 1,
        delay: 0.25,
        ease: 'circ.in',
      });

      this.containerEl.classList.add('is-spinning');
    };

    const spinProcess = () => {
      WheelFortune.gsap.to(this.containerEl, {
        '--blurring': '0px',
        duration: 1,
        delay: 0.5,
        ease: 'power2.out',
      });
    };

    const spinEnd = () => {
      this.currentSpinIndex += 1;
      this.containerEl.classList.remove('is-spinning');

      if (this.currentSpinIndex >= this.spinStates.length) {
        this.containerEl.classList.add('end-last-spin');
      }
    };

    this.tlSpin
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'power2.in',
        rotation: `+=${wheelTurn}`,
        duration: 1.5,
        onStart: spinBegin,
      })
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'none',
        rotation: `+=${fullCircle}`,
        duration: 0.15,
        repeat: this.rotationCount,
      })
      .to(this.segmentsEl, {
        ease: WheelFortune.customEase.create(
          'custom',
          'M0,0 C0.11,0.494 0.136,0.67 0.318,0.852 0.626,1.16 0.853,0.989 1,1',
        ),
        rotation: `+=${rotation}`,
        duration: 3,
        onStart: spinProcess,
        onComplete: () => {
          if (callback) callback();

          this.tlBlackout.restart();
        },
      });

    this.tlBlackout
      .to(this.containerEl, {
        '--blackout-opacity': '0.6',
        duration: 0.5,
        ease: 'power2.in',
      })
      .to(this.containerEl, {
        '--blackout-opacity': '0',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: spinEnd,
      }, '<2');

    this.tlSpin.restart();
  }

  private libration() {
    this.tlLibration = WheelFortune.gsap.timeline();

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
    this.containerEl.style.setProperty('--blackout-angle', this.segmentCount.toString());

    if (this.wheelLibration) {
      this.libration();
    }
  }

  public destroy() {
    WheelFortune.gsap.killTweensOf([this.containerEl, this.segmentsEl]);

    this.buttonEl.onclick = null;
  }
}

export default WheelFortune;
