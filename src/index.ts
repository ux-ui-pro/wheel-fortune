import { gsap } from 'gsap';

enum WheelState {
  Idle,
  Spinning,
  Librating,
}

export interface SpinState {
  stopSegment: number;
  callback?: () => void;
}

export interface WheelFortuneOptions {
  containerEl?: HTMLElement | string;
  segmentsEl?: HTMLElement | string;
  buttonEl?: HTMLElement | string;
  rotationCount?: number;
  segmentCount?: number;
  spinStates?: SpinState[];
  wheelLibration?: boolean;
  customCSSVariables?: Record<string, string>;
}

export default class WheelFortune {
  private static _gsap: typeof gsap = gsap;

  private containerEl: HTMLElement;
  private segmentsEl: HTMLElement;
  private buttonEl: HTMLElement;

  private rotationCount: number;
  private segmentCount: number;
  private spinStates: SpinState[];
  private currentSpinIndex: number;
  private wheelLibration: boolean;
  private state: WheelState;

  private tlSpin?: gsap.core.Timeline;
  private tlBlackout?: gsap.core.Timeline;
  private tlLibration?: gsap.core.Timeline;

  private spinHandler: () => void;

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
      const found = document.querySelector<HTMLElement>(el);

      if (!found) {
        throw new Error(`Element not found: ${el}`);
      }

      return found;
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

    WheelFortune._gsap.to(this.containerEl, {
      '--blurring': '12px',
      duration: 0.8,
      delay: 0.25,
      ease: 'circ.in',
    });
  }

  private spinProcess(): void {
    WheelFortune._gsap.to(this.containerEl, {
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

    const spinState = this.spinStates[this.currentSpinIndex - 1];

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

    const spinState = this.spinStates[this.currentSpinIndex];

    if (!spinState) {
      return;
    }

    const { stopSegment } = spinState;
    const { fullCircle, wheelTurn, rotation } = this.calculate(stopSegment);

    this.tlSpin = WheelFortune._gsap.timeline({ paused: true });
    this.tlBlackout = WheelFortune._gsap.timeline({ paused: true });

    this.tlSpin
      .to(this.segmentsEl, {
        clearProps: 'rotation',
        ease: 'power2.in',
        rotation: `+=${wheelTurn}`,
        duration: 1.5,
        onStart: () => this.spinBegin(),
      })
      .to(this.segmentsEl, {
        rotation: `+=${fullCircle * this.rotationCount}`,
        duration: 0.15 * this.rotationCount,
        ease: 'none',
      })
      .to(this.segmentsEl, {
        ease: 'back.out(1.2)',
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
    this.tlLibration = WheelFortune._gsap.timeline();

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
    WheelFortune._gsap.killTweensOf([this.containerEl, this.segmentsEl]);

    this.buttonEl.removeEventListener('click', this.spinHandler);
  }
}
