interface SpinState {
  targetAngle: number;
  callback?: () => void;
}

interface WheelFortuneOptions {
  rootSelector: string;
  wheelSelector: string;
  triggerSelector: string;
  rotationCount?: number;
  spinStates?: SpinState[];
  duration?: number;
  overshootDeg?: number;
  returnDuration?: number;
  swayOptions?: {
    amplitude?: number;
    period?: number;
  };
}

export default class WheelFortune {
  #rootElement!: HTMLElement;
  #wheelElement!: HTMLElement;
  #triggerButton!: HTMLButtonElement;

  #swayAnimation: Animation | null = null;
  #swayingElement: HTMLElement | null = null;
  #finalRotation: WeakMap<HTMLElement, number> = new WeakMap();

  readonly #rotationCount: number;
  readonly #duration: number;
  readonly #overshootDeg: number;
  readonly #returnDuration: number;
  readonly #swayAmplitude: number;
  readonly #swayPeriod: number;

  readonly #rootClassName: string;

  readonly #spinStates: SpinState[];

  #currentSpinIndex = 0;
  #hasSpun = false;

  #onClick: (e: MouseEvent) => void = () => {
    void this.#runSpin();
  };

  constructor(private readonly options: Readonly<WheelFortuneOptions>) {
    this.#rotationCount = options.rotationCount ?? 6;
    this.#duration = options.duration ?? 5000;
    this.#overshootDeg = options.overshootDeg ?? 15;
    this.#returnDuration = options.returnDuration ?? 1000;
    this.#swayAmplitude = options.swayOptions?.amplitude ?? 6;
    this.#swayPeriod = options.swayOptions?.period ?? 1500;

    this.#spinStates = [...(options.spinStates ?? [])];

    const selector = options.rootSelector.trim();
    this.#rootClassName = selector.startsWith('.') ? selector.slice(1) : selector;
  }

  init(): void {
    const root = document.querySelector<HTMLElement>(this.options.rootSelector);

    if (!root) return;

    const wheel = root.querySelector<HTMLElement>(this.options.wheelSelector);
    const trigger = root.querySelector<HTMLButtonElement>(this.options.triggerSelector);

    if (!wheel || !trigger) return;

    this.#rootElement = root;
    this.#wheelElement = wheel;
    this.#triggerButton = trigger;

    this.#triggerButton.addEventListener('click', this.#onClick);

    this.#startSway(this.#wheelElement);
  }

  async #rotateWheelTo(el: HTMLElement, finalDeg: number): Promise<void> {
    const currentDeg = this.#getCurrentRotation(el);
    const diffCW = (this.#normalize(finalDeg) - this.#normalize(currentDeg) + 360) % 360;
    const targetDeg = currentDeg + this.#rotationCount * 360 + diffCW;
    const overshootDeg = targetDeg + this.#overshootDeg;

    const total = this.#duration + this.#returnDuration;
    const overshootAt = this.#duration / total;

    const spin = el.animate(
      [
        {
          transform: `rotate(${currentDeg}deg)`,
          easing: 'cubic-bezier(0.86,0,0.07,1)',
        },
        {
          offset: overshootAt,
          transform: `rotate(${overshootDeg}deg)`,
          easing: 'cubic-bezier(0.77,0,0.175,1)',
        },
        { transform: `rotate(${targetDeg}deg)` },
      ],
      {
        duration: total,
        fill: 'forwards',
      },
    );

    const blur = el.animate(
      [
        { filter: 'blur(0)' },
        { offset: 0.15, filter: 'blur(1px)' },
        { offset: 0.4, filter: 'blur(4px)' },
        { offset: 0.6, filter: 'blur(1px)' },
        { offset: 1, filter: 'blur(0)' },
      ],
      {
        duration: total,
        fill: 'forwards',
        easing: 'ease-in-out',
      },
    );

    await Promise.all([spin.finished, blur.finished]);

    this.#finalRotation.set(el, this.#normalize(targetDeg));
  }

  #startSway(el: HTMLElement): void {
    if (this.#hasSpun) return;

    this.#stopSway();
    this.#swayingElement = el;

    const base = this.#finalRotation.get(el) ?? this.#getCurrentRotation(el);

    this.#swayAnimation = el.animate(
      [
        { transform: `rotate(${base - this.#swayAmplitude}deg)` },
        { transform: `rotate(${base + this.#swayAmplitude}deg)` },
      ],
      {
        duration: this.#swayPeriod,
        direction: 'alternate',
        iterations: Infinity,
        easing: 'ease-in-out',
        delay: -this.#swayPeriod / 2,
      },
    );
  }

  #stopSway(): void {
    if (!this.#swayAnimation || !this.#swayingElement) return;

    const el = this.#swayingElement;
    const snapshot = getComputedStyle(el).transform;

    this.#swayAnimation.commitStyles?.();
    this.#swayAnimation.cancel();

    el.style.transform = snapshot !== 'none' ? snapshot : '';

    this.#swayAnimation = null;
    this.#swayingElement = null;
  }

  #normalize(deg: number): number {
    return ((deg % 360) + 360) % 360;
  }

  #getCurrentRotation(el: HTMLElement): number {
    const t = getComputedStyle(el).transform;

    if (!t || t === 'none') return 0;

    const { a, b } = new DOMMatrixReadOnly(t);

    return (Math.atan2(b, a) * 180) / Math.PI;
  }

  #cancelAnimations(el: HTMLElement): void {
    el.getAnimations().forEach((a) => a.cancel());
  }

  destroy(): void {
    this.#stopSway();
    this.#cancelAnimations(this.#wheelElement);

    this.#triggerButton?.removeEventListener('click', this.#onClick);

    this.#finalRotation = new WeakMap();
  }

  reset(): void {
    this.destroy();

    this.#wheelElement.style.transform = '';

    this.#rootElement.classList.remove(
      `${this.#rootClassName}--spinning`,
      `${this.#rootClassName}--completed`,
      `${this.#rootClassName}--first-done`,
      `${this.#rootClassName}--final-done`,
    );

    this.#currentSpinIndex = 0;
    this.#hasSpun = false;

    this.#triggerButton.addEventListener('click', this.#onClick);
  }

  async #runSpin(): Promise<void> {
    const spinState = this.#spinStates[this.#currentSpinIndex];

    if (!spinState) return;

    this.#hasSpun = true;

    this.#rootElement.classList.remove(`${this.#rootClassName}--completed`);
    this.#rootElement.classList.add(`${this.#rootClassName}--spinning`);

    this.#stopSway();

    await this.#rotateWheelTo(this.#wheelElement, spinState.targetAngle);

    this.#rootElement.classList.remove(`${this.#rootClassName}--spinning`);
    this.#rootElement.classList.add(`${this.#rootClassName}--completed`);

    if (this.#currentSpinIndex === 0) {
      this.#rootElement.classList.add(`${this.#rootClassName}--first-done`);
    }

    if (this.#currentSpinIndex === this.#spinStates.length - 1) {
      this.#rootElement.classList.add(`${this.#rootClassName}--final-done`);
    }

    spinState.callback?.();

    this.#currentSpinIndex++;
  }
}
