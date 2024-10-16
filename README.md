<div align="center">
<br>

<h1>wheel-fortune</h1>

<p><sup>WheelFortune implements an animation of a spinning wheel of fortune using the GSAP library. It allows customization of parameters including the number of segments, number of revolutions, spin states, and callbacks.</sup></p>

[![npm](https://img.shields.io/npm/v/wheel-fortune.svg?colorB=brightgreen)](https://www.npmjs.com/package/wheel-fortune)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/wheel-fortune.svg)](https://github.com/ux-ui-pro/wheel-fortune)
[![NPM Downloads](https://img.shields.io/npm/dm/wheel-fortune.svg?style=flat)](https://www.npmjs.org/package/wheel-fortune)

<sup>1kB gzipped</sup>

<a href="https://codepen.io/ux-ui/pen/NWJZNaP">Demo</a>

</div>
<br>

&#10148; **Install**
```console
$ yarn add wheel-fortune
```
<br>

&#10148; **Import**
```javascript
import WheelFortune from 'wheel-fortune';
```
<br>

&#10148; **Usage**
```javascript
const spinStates = [
  { stopSegment: 5, callback: () => console.log('first spin end') },
  { stopSegment: 2, callback: () => console.log('second spin end') },
  ...
];

const wheel = new WheelFortune({
  spinStates: spinStates,
  rotationCount: 4,
  segmentCount: 8,
});

wheel.init();
```
<br>

&#10148; **Options**

| Option           |                        Type                        |      Default       | Description                                                                                                                                                                                                                                                                                                |
|:-----------------|:--------------------------------------------------:|:------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `containerEl`    |           `string` &vert; `HTMLElement`            |      `.wheel`      | This parameter references a DOM element that acts as a container for the entire wheel of fortune. It is used to apply common styles and animations, such as blurring `--blurring` and changing transparency `--blackout-opacity`, which affect the entire component during and between spins of the wheel. |
| `segmentsEl`     |           `string` &vert; `HTMLElement`            | `.wheel__segments` | The parameter references the DOM element containing the segments of the wheel of fortune.                                                                                                                                                                                                                  |
| `buttonEl`       |           `string` &vert; `HTMLElement`            |  `.wheel__button`  | The parameter references the DOM element of the button that initiates the wheel spin.                                                                                                                                                                                                                      |
| `rotationCount`  |                      `number`                      |        `3`         | This parameter determines the number of full revolutions of the wheel before it stops on the last segment.                                                                                                                                                                                                 |
| `segmentCount`   |                      `number`                      |        `8`         | This parameter defines the total number of segments on the wheel. It is used to calculate the angle of each segment (360° divided by the number of segments) and to determine the final position of the wheel after rotation.                                                                              |
| `spinStates`     | `Array<{stopSegment: number, callback: Function}>` |        `[]`        | The parameter contains an array of objects, each describing a different state of wheel rotation, including a stop segment and a colback that can be called after the wheel has stopped.                                                                                                                    |
| `wheelLibration` |                     `Boolean`                      |      `false`       | This parameter determines whether the visual element of the wheel will simulate libration (a slight wobble around its axis) when at rest. If set to true, the wheel will wobble slightly to the left and right.                                                                                            |
<br>

| HTML class           | Description                                                                                                                 |
|:---------------------|:----------------------------------------------------------------------------------------------------------------------------|
| `.is-spinning`       | This class is added to the wheel container element at the start of the rotation and removed when the rotation is complete.  |
| `.end-last-spin`     | This class is added to the wheel container element after the last revolution of a series of revolutions has been completed. |
<br>

&#10148; **License**

wheel-fortune is released under MIT license
