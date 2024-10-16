import gsap from 'gsap';
import CustomEase from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

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
}

class WheelFortune {
  private static gsapInstance: typeof gsap = gsap;
  private static customEaseInstance: typeof CustomEase = CustomEase;

  private containerEl: HTMLElement;
  private segmentsEl: HTMLElement;
  private buttonEl: HTMLElement;

  private rotationCount: number;
  private segmentCount: number;
  private spinStates: SpinState[];
  private currentSpinIndex: number;
  private tlSpin?: GSAPTimeline;
  private tlBlackout?: GSAPTimeline;
  private wheelLibration: boolean;
  private tlLibration?: GSAPTimeline;

  constructor({
    containerEl = '.wheel',
    segmentsEl = '.wheel__segments',
    buttonEl = '.wheel__button',
    rotationCount = 3,
    segmentCount = 8,
    spinStates = [],
    wheelLibration = false,
  }: WheelFortuneOptions = {}) {
    this.rotationCount = rotationCount;
    this.segmentCount = segmentCount;
    this.spinStates = spinStates;
    this.currentSpinIndex = 0;
    this.wheelLibration = wheelLibration;

    this.containerEl = WheelFortune.getElement(containerEl);
    this.segmentsEl = WheelFortune.getElement(segmentsEl);
    this.buttonEl = WheelFortune.getElement(buttonEl);
  }

  private static getElement(el: HTMLElement | string): HTMLElement {
    return typeof el === 'string' ? (document.querySelector(el) as HTMLElement) : el;
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
    WheelFortune.gsapInstance.to(this.containerEl, {
      '--blurring': '40px',
      duration: 1,
      delay: 0.25,
      ease: 'circ.in',
    });

    this.containerEl.classList.add('is-spinning');
  }

  private spinProcess(): void {
    WheelFortune.gsapInstance.to(this.containerEl, {
      '--blurring': '0px',
      duration: 1,
      delay: 0.5,
      ease: 'power2.out',
    });
  }

  private spinEnd(): void {
    this.currentSpinIndex += 1;
    this.containerEl.classList.remove('is-spinning');

    if (this.currentSpinIndex >= this.spinStates.length) {
      this.containerEl.classList.add('end-last-spin');
    }
  }

  public spin(): void {
    if (this.tlLibration) {
      this.tlLibration.kill();
      this.tlLibration = undefined;
    }

    const { stopSegment, callback } = this.spinStates[this.currentSpinIndex];
    const { fullCircle, wheelTurn, rotation } = this.calculate(stopSegment);

    this.tlSpin = WheelFortune.gsapInstance.timeline({ paused: true });
    this.tlBlackout = WheelFortune.gsapInstance.timeline({ paused: true });

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
        ease: WheelFortune.customEaseInstance.create(
          'custom',
          'M0,0 C0.11,0.494 0.136,0.67 0.318,0.852 0.626,1.16 0.853,0.989 1,1'
        ) as typeof CustomEase,
        rotation: `+=${rotation}`,
        duration: 3,
        onStart: () => this.spinProcess(),
        onComplete: () => {
          if (callback) callback();
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
        '<2'
      );

    this.tlSpin.restart();
  }

  private libration(): void {
    this.tlLibration = WheelFortune.gsapInstance.timeline();

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
        }
      );
  }

  private spinAction(): void {
    this.buttonEl.onclick = (): void => this.spin();
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
    WheelFortune.gsapInstance.killTweensOf([this.containerEl, this.segmentsEl]);

    this.buttonEl.onclick = null;
  }
}

export default WheelFortune;
