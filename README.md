# urban-invention

An experiment in asynchronous reactive programming.

The problem is lifted from [Propagation Networks: A Flexible and Expressive Substrate for Computation][pn-radul-2009] (p. 98):

![figure 5-8 excerpt that shows each of {R,G,B}-slider and {H,S,V}-slider connected to a logical AND gate, which is in turn connected to a RGB-color and an HSV-color node, respectively. Between the two nodes, two boxes with directional arrows indicate the circular conversion dependency, where `RGB->HSV` maps the position of the left-hand sliders to the right-hand ones, and vice versa.](./public/radul-2009-figure-5-8.svg)

(NB: browsers don't really _do_ hsv[^1]; so instead we pick the close cousin `hsl`)

The task is subtly different from building a naïve bi-directional color picker widget"[^2]:

1. There is no "primary" stateful storage: both `rgb` and `hsl` are "peers" (as opposed to creating a wrapping object & passing it "down" into both components). (stateless)
2. Each of the nodes is independent of the other(s): neither `hsl` nor `rgb` needs be modified to accept the linking (autonomous)
3. The model is asynchronous, and therefore accounts for the possibility of multiple in-flight updates in both directions at the same time. (asynchronous)


In other words, the heart of it is this pair of function signatures:

```js
async function convertRGBToHSL([r,g,b]) { /*...*/ }
async function convertHSLToRGB([h,s,l]) { /*...*/ }
```

Which, to my knowledge, do not slot neatly into an already established pair of color picker components in any established reactive framework: doing so requires modifying the existing components (violating property 2) to accept an external state store (violating property 1) and to handle the asychrony "locally" (rewriting it each time, meaning every instance is an opportunity to violate property 3 that very likely occurs because the problem is hard and subtle and not "experientally transparent" until things get slow).


[^1]: See https://developer.mozilla.org/en-US/docs/Web/CSS/color_value : The options for the sRGB color space are hsl(), hwb(), and rgb(). Any pair would work for this demo, as would mapping between models in distinct color spaces, but we choose the two most popular (rgb, hsl) to keep things simple.

[^2]: No shade intended: I thought it was quite fun and an excellent introduction to a new framework.

## Usage

```bash
pnpm install
pnpm run dev
```

## Acknowledgements

Thanks to Github's "create new repository" for the name.

[pn-radul-2009]: https://dspace.mit.edu/bitstream/handle/1721.1/49525/MIT-CSAIL-TR-2009-053.pdf
