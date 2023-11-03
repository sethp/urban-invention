import { test, expect } from 'vitest';
import { Cell } from './Cell';
import { withScheduler } from './scheduler';
import {
	Wire_FahrenheitToCelsius_oneway,
	Wire_FahrenheitCelsius,
	Wire_CelsiusKelvin,
} from './numbers';

// (define f (make-cell))
// (define c (make-cell))
// (fahrenheit->celsius f c)
// (add-content f 77)
// (content c)
//   -> 25
//
// NB: the above has secret/implicit calls to `(initialize-scheduler)` and `(run)`,
// here made explicit by `withScheduler` and `await scheduler.quiesce()` respectively
test(
	'Fahrenheit->Celsius (unidirectional)',
	withScheduler(async (scheduler) => {
		var f = new Cell(),
			c = new Cell();

		Wire_FahrenheitToCelsius_oneway(f, c);

		f.addContent(77);

		await scheduler.quiesce();
		expect(c.content).toBe(25);

		// now the network is _finished_, if we want to convert another temperature we'll need a new network
		var f2 = new Cell(),
			c2 = new Cell();
		Wire_FahrenheitToCelsius_oneway(f2, c2);

		f2.addContent(-40);

		await scheduler.quiesce();
		expect(c2.content).toBe(-40);
	})
);

test(
	'Fahrenheit-Celsius (bidirectional)',
	withScheduler(async (scheduler) => {
		var f = new Cell(),
			c = new Cell();

		Wire_FahrenheitCelsius(f, c);

		c.addContent(25);

		await scheduler.quiesce();
		expect(f.content).toBe(77);

		var k = new Cell();

		Wire_CelsiusKelvin(c, k);

		await scheduler.quiesce();
		expect(k.content).toBe(298.15);
	})
);

import { constant, sum, product } from './propagators';

// big chaotic temperature scale energy
test(
	'Rankine',
	withScheduler(async (scheduler) => {
		var f = new Cell(),
			c = new Cell(),
			k = new Cell(),
			r = new Cell();

		{
			// 0°F is 459.67°R
			let fBase = new Cell(),
				// 1°R is 5/9°K
				ratioKR = new Cell(),
				// 0°C is 32°F
				fcOffset = new Cell();

			constant(459.67).apply(fBase);
			constant(5 / 9).apply(ratioKR);
			constant(32).apply(fcOffset);

			sum(f, fBase, r);
			product(r, ratioKR, k);

			// hmmm I ought to have enough constants here already
			// how do I make use of them tho?
			// seems like I have to have more cells, right?
			let kcOffset = new Cell(),
				tmp = new Cell();

			sum(fcOffset, fBase, tmp);
			product(tmp, ratioKR, kcOffset);
			sum(c, kcOffset, k);

			// it would also be neat to have a `-40°C is -40°F` "fact"
			// that would permit deriving relationships (like base given ratio or vice versa)
			//
			// even cooler would be for the network to express what relationships I have,
			// and what I'm missing, given a set of "facts."
			// but that's a story for another day
		}

		c.addContent(100);

		await scheduler.quiesce();
		expect(f.content).toBeCloseTo(212);
		expect(r.content).toBeCloseTo(671.67);
		expect(k.content).toBeCloseTo(373.15);
	})
);
