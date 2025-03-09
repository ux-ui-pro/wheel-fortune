import type { gsap as GSAPNamespace, CustomEase as CustomEaseNamespace } from 'gsap';

declare global {
  interface Window {
    gsap?: typeof GSAPNamespace;
    CustomEase?: typeof CustomEaseNamespace;
  }
}

export {};
