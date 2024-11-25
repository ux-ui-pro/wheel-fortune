import gsap from 'gsap';
import CustomEase from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase as gsap.Plugin);

enum WheelState {
  Idle,
  Spinning,
  Librating,
}

interface SpinState {
  stopSegment: number;
  callback?: () => void;
}

interface WheelFortuneOptions {
  containerEl?: HTMLElement | string;
  segmentsEl?: HTMLElement | string;
  buttonEl?: HTMLElement | string;
  rotationCount?: number;
  segmentCount?: number;
  spinStates?: SpinState[];
  wheelLibration?: boolean;
  customCSSVariables?: Record<string, string>;
}

class WheelFortune {
  private containerEl: HTMLElement;
  private segmentsEl: HTMLElement;
  private buttonEl: HTMLElement;
  private rotationCount: number;
  private segmentCount: number;
  private spinStates: SpinState[];
  private currentSpinIndex: number;
  private tlSpin?: gsap.core.Timeline;
  private tlBlackout?: gsap.core.Timeline;
  private wheelLibration: boolean;
  private tlLibration?: gsap.core.Timeline;
  private spinHandler: () => void;
  private state: WheelState;

  constructor({
    containerEl = '.wheel',
    segmentsEl = '.wheel__segments',
    buttonEl = '.wheel__button',
    rotationCount = 3,
    segmentCount = 8,
    spinStates = [],
    wheelLibration = false,
    customCSSVariables = {},
  }: WheelFortuneOptions = {}) {
    this.rotationCount = rotationCount;
    this.segmentCount = segmentCount;
    this.spinStates = spinStates ?? [];
    this.currentSpinIndex = 0;
    this.wheelLibration = wheelLibration;
    this.state = WheelState.Idle;

    this.containerEl = WheelFortune.getElement(containerEl);
    this.segmentsEl = WheelFortune.getElement(segmentsEl);
    this.buttonEl = WheelFortune.getElement(buttonEl);

    this.spinHandler = this.spin.bind(this);

    for (const [key, value] of Object.entries(customCSSVariables)) {
      this.containerEl.style.setProperty(`--${key}`, value);
    }
  }

  private static getElement(el: HTMLElement | string): HTMLElement {
    if (typeof el === 'string') {
      const element = document.querySelector(el);

      if (!element) {
        throw new Error(`Element not found: ${el}`);
      }

      return element as HTMLElement;
    }

    return el;
  }

  private calculate(stopSegment: number): {
    fullCircle: number;
    wheelTurn: number;
    rotation: number;
  } {
    const fullCircle = 360;
    const segmentAngle = fullCircle / this.segmentCount;
    const wheelTurn = fullCircle * this.rotationCount;
    const rotation = wheelTurn - segmentAngle * (stopSegment - 1);

    return { fullCircle, wheelTurn, rotation };
  }

  private spinBegin(): void {
    this.state = WheelState.Spinning;
    this.containerEl.classList.add('is-spinning');

    gsap.to(this.containerEl, {
      '--blurring': '40px',
      duration: 1,
      delay: 0.25,
      ease: 'circ.in',
    });
  }

  private spinProcess(): void {
    gsap.to(this.containerEl, {
      '--blurring': '0px',
      duration: 1,
      delay: 0.5,
      ease: 'power2.out',
    });
  }

  private spinEnd(): void {
    this.currentSpinIndex += 1;

    if (this.currentSpinIndex >= this.spinStates.length) {
      this.containerEl.classList.add('end-last-spin');
    }

    this.state = WheelState.Idle;

    this.containerEl.classList.remove('is-spinning');

    const spinState = this.spinStates?.[this.currentSpinIndex - 1];

    spinState?.callback?.();
  }

  public spin(): void {
    if (this.state === WheelState.Spinning) {
      return;
    }

    if (this.tlLibration) {
      this.tlLibration.kill();
      this.tlLibration = undefined;
    }

    const spinState = this.spinStates?.[this.currentSpinIndex];

    if (!spinState) {
      return;
    }

    const { stopSegment } = spinState;
    const { fullCircle, wheelTurn, rotation } = this.calculate(stopSegment);

    this.tlSpin = gsap.timeline({ paused: true });
    this.tlBlackout = gsap.timeline({ paused: true });

    this.tlSpin
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'power2.in',
        rotation: `+=${wheelTurn}`,
        duration: 1.5,
        onStart: () => this.spinBegin(),
      })
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'none',
        rotation: `+=${fullCircle}`,
        duration: 0.15,
        repeat: this.rotationCount,
      })
      .to(this.segmentsEl, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        ease: CustomEase.create(
          'custom',
          'M0,0 C0.11,0.494 0.136,0.67 0.318,0.852 0.626,1.16 0.853,0.989 1,1',
        ) as gsap.EaseFunction,
        rotation: `+=${rotation}`,
        duration: 3,
        onStart: () => this.spinProcess(),
        onComplete: () => {
          this.tlBlackout?.restart();
        },
      });

    this.tlBlackout
      .to(this.containerEl, {
        '--blackout-opacity': '0.6',
        duration: 0.5,
        ease: 'power2.in',
      })
      .to(
        this.containerEl,
        {
          '--blackout-opacity': '0',
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => this.spinEnd(),
        },
        '<1.5',
      );

    this.tlSpin.restart();
  }

  private libration(): void {
    if (this.state === WheelState.Spinning) {
      return;
    }

    this.state = WheelState.Librating;
    this.tlLibration = gsap.timeline();

    this.tlLibration
      .set(this.segmentsEl, { rotate: 0 })
      .to(this.segmentsEl, {
        rotate: -6,
        duration: 0.75,
        ease: 'power1.inOut',
      })
      .fromTo(
        this.segmentsEl,
        { rotate: -6 },
        {
          rotate: 6,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        },
      );
  }

  private spinAction(): void {
    this.buttonEl.addEventListener('click', this.spinHandler);
  }

  public init(): void {
    this.spinAction();
    this.containerEl.style.setProperty('--blackout-opacity', '0');
    this.containerEl.style.setProperty('--blackout-angle', this.segmentCount.toString());

    if (this.wheelLibration) {
      this.libration();
    }
  }

  public destroy(): void {
    gsap.killTweensOf([this.containerEl, this.segmentsEl]);

    this.buttonEl.removeEventListener('click', this.spinHandler);
  }
}

export default WheelFortune;
