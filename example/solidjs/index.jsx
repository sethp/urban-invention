/* @refresh reload */
// NB: the pragma above doesn't seem like it's being respected currently, meaning changes
// to this file that trigger a hot reload will render a duplicate copy

import { render as _$render } from 'solid-js/web';
import solidLogo from '/solid.svg';
import viteLogo from '/vite.svg';
import { LinkedColorPickers } from './Colors';

export function render(target) {
	_$render(
		() => (
			<div>
				<LinkedColorPickers modes={['rgb', 'hsl']} color="rgb(127, 127, 127)" />

				<h4>made with Vite + Solid</h4>
				<div>
					<a href="https://vitejs.dev" target="_blank">
						<img src={viteLogo} class="logo" alt="Vite logo" />
					</a>
					<a href="https://solidjs.com" target="_blank">
						<img src={solidLogo} class="logo solid" alt="Solid logo" />
					</a>
				</div>
			</div>
		),
		target
	);
}
