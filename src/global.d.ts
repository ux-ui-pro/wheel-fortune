import type { gsap as GSAPNamespace } from 'gsap';

declare global {
  interface Window {
    gsap?: typeof GSAPNamespace;
  }
}

export {};
