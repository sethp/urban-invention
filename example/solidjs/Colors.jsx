import { createSignal } from 'solid-js';

export function LinkedColorPickers(props) {
	function parseColor(cssColor) {
		// apparently "the" "right" "way" to do this is to draw a pixel
		// and ask what color we just drew
		// i.e. https://stackoverflow.com/a/19366389/151464
		//
		// instead, let's cheat.
		if (!cssColor.startsWith('rgb') || cssColor.startsWith('rgba')) {
			throw Error(
				`don't know how to map ${cssColor} to the (alpha-less) rgb color space. Use \`rgb(...)\` instead.`
			);
		}
		return new Color(
			/*sRGB?*/ 'rgb',
			cssColor
				.slice('rgb'.length + 1, -1)
				.split(',')
				.map((e) => parseInt(e))
		);
	}
	const colorSignal = createSignal(parseColor(props.color));

	function remapped(mode) {
		const [color, setColor] = colorSignal;
		return [() => color().to(mode), (c) => setColor(new Color(mode, c))];
	}

	return (
		<For each={props.modes}>
			{(mode) => (
				<div class="card">
					<ColorPicker mode={mode} colorSignal={remapped(mode)} />
				</div>
			)}
		</For>
	);
}

// NB: neither of these props are reactive
export function ColorPicker({ mode, colorSignal }) {
	const [color, setColor] = colorSignal || createSignal([0, 0, 0]);

	const modes = {
		rgb: {
			labels: ['red', 'green', 'blue'],
			max: Array(3).fill(255),
			val: Array(3).fill((val) => val.toFixed(0)),
		},
		hsl: {
			labels: ['hue', 'saturation', 'lightness'],
			max: [360, ...Array(2).fill(100)],
			val: [(val) => `${val.toFixed(0)}deg`, ...Array(2).fill((val) => `${val.toFixed(0)}%`)],
		},
	};

	const fill = () => {
		const [c1, c2, c3] = color().map((c, i) => modes[mode].val[i](c));
		return `${mode}(${c1}, ${c2}, ${c3})`;
	};

	return (
		<div
			style={{
				display: 'flex',
				'flex-direction': 'row',
				'align-items': 'stretch',
				'justify-content': 'space-between',
			}}
		>
			<div
				style={{
					'text-align': 'left',
					display: 'flex',
					'flex-direction': 'column',
					'justify-content': 'space-between',
				}}
			>
				{/* @eslint ignore TODO <the solid no-map rule specifically>; this purposely disables reactivity for the `mode` prop */}
				{Array(3)
					.fill()
					.map((_, i) => ({
						label: modes[mode].labels[i],
						max: modes[mode].max[i],
						val: modes[mode].val[i],
					}))
					.map(({ label, max, val }, i) => (
						<div>
							<input
								type="range"
								name={label}
								min="0"
								max={max}
								value={color()[i]}
								on:input={(e) => {
									setColor([
										...color().slice(0, i),
										parseInt(e.target.value),
										...color().slice(i + 1),
									]);
								}}
							/>
							<label for={label}>{label}</label>
						</div>
					))}
			</div>
			<svg height="100" width="300">
				<style>{`circle { stroke: inverse(); }`}</style>
				<circle cx="50%" cy="35" r="35" stroke="black" stroke-width="1" style={{ fill: fill() }} />
				<text x="50%" y="95" text-anchor="middle">
					{fill()}
				</text>
			</svg>
		</div>
	);
}

export class Color {
	// internal repr (RGB)
	// this has a hole when projecting it back and forth to the hsl geometry:
	// any r == g == b colors are at the center of the cylinder, meaning
	//       saturation == 0
	//       all hue values between 0° and 360° are equivalent
	// which means the hue slider "sticks", because moving it doesn't change
	// the r == g == b property
	//
	// also:
	//  a hue of 360° resets hue to 0° and saturation to 0 and so "sticks"
	//  a lightness of 100% resets both hue and saturation to 0 and "sticks" both
	//
	// so, whenever we map back/forth to the hsl color space, we _adjustHSL
	// to avoid being in any of the "holes"
	//
	// this does mean that our internal RGB values must contain lots of precision, too;
	// so often `this.rgb[0].toFixed(nn)` is preferred to simply `this.rgb[0]`
	rgb = [0, 0, 0];
	// lol, https://developer.mozilla.org/en-US/docs/Web/API/ImageData/colorSpace#value
	//             ^ (there is only [s]RGB)

	constructor(mode, components) {
		if (!mode) {
			this.rgb = components;
		} else {
			return Color.from(mode, components);
		}
	}

	static from(mode, components) {
		const key = `from${mode.toUpperCase()}`;
		if (!(key in Color))
			throw TypeError(
				`Color has no property \`${key}\`; either supply it or use one of [${Object.getOwnPropertyNames(
					Color
				).filter(
					(k) => k != 'from' && k.startsWith('from') && typeof Color[k] === 'function'
				)}] instead?`
			);
		return Color[key](components);
	}

	static fromRGB(components) {
		return new Color(undefined, components);
	}

	static fromHSL([h, s, l]) {
		// via https://css-tricks.com/converting-color-spaces-in-javascript/#aa-hsl-to-rgb
		s /= 100;
		l /= 100;

		[h, s, l] = Color._adjustHSL([h, s, l]);

		let c = (1 - Math.abs(2 * l - 1)) * s,
			x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
			m = l - c / 2,
			r = 0,
			g = 0,
			b = 0;
		if (0 <= h && h < 60) {
			r = c;
			g = x;
			b = 0;
		} else if (60 <= h && h < 120) {
			r = x;
			g = c;
			b = 0;
		} else if (120 <= h && h < 180) {
			r = 0;
			g = c;
			b = x;
		} else if (180 <= h && h < 240) {
			r = 0;
			g = x;
			b = c;
		} else if (240 <= h && h < 300) {
			r = x;
			g = 0;
			b = c;
		} else if (300 <= h && h < 360) {
			r = c;
			g = 0;
			b = x;
		}
		r = (r + m) * 255;
		g = (g + m) * 255;
		b = (b + m) * 255;
		return new Color(undefined, [r, g, b]);
	}

	to(mode) {
		return this[`to${mode.toUpperCase()}`]();
	}

	toRGB() {
		return this.rgb;
	}
	toHSL() {
		// via https://stackoverflow.com/questions/39118528/rgb-to-hsl-conversion
		let [r, g, b] = this.rgb;
		r /= 255;
		g /= 255;
		b /= 255;

		let cmin = Math.min(r, g, b),
			cmax = Math.max(r, g, b),
			chroma = cmax - cmin,
			h = 0,
			s = 0,
			l = 0;

		if (chroma == 0) h = 0;
		else if (cmax == r) h = ((g - b) / chroma) % 6;
		else if (cmax == g) h = (b - r) / chroma + 2;
		else h = (r - g) / chroma + 4;

		h = h * 60;

		// Make negative hues positive behind 360°
		if (h < 0) h += 360;

		l = (cmax + cmin) / 2;
		s = chroma == 0 ? 0 : chroma / (1 - Math.abs(2 * l - 1));

		s = +(s * 100);
		l = +(l * 100);

		return Color._adjustHSL([h, s, l]);
	}

	// see comment on `repr`
	// NB: this at least lets us get out of the situation where the sliders "stick",
	// but can't save us from a low-precision RGB value clobbering our hsl sliders.
	//
	// For example, setting r == g == b == 255 will "reset" the hue slider to 240°,
	// and the "saturation" to 100%, even though any setting is equivalent when
	// lightness == 100%.
	//
	// But `toHSL` must pick _some_ mapping, and without knowing the previous hsl values (which we don't),
	// any choice will be wrong.
	//
	// We might either: preserve the last (rgb, hsl) values somewhere and interpret
	// any changes as scaled deltas relative to those points, or decouple the storage
	// for the slider positions from the color value so we only update the former from
	// the latter when necesary.
	static _adjustHSL([h, s, l]) {
		// chosen by fiddling with sliders and looking for a value that didn't get "weird"
		const epsilon = 0.0001;

		if (s == 0) s = epsilon; // never let `s` be zero
		if (l == 0) l = epsilon; // never let `l` be zero
		if (l == 1) l -= epsilon; // never let `l` be 100%
		if (h == 0) h = epsilon; // never let h be 0
		if (h == 360) h -= epsilon; // never let h be 360

		return [h, s, l];
	}
}
