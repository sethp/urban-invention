import { test, describe, expect } from 'vitest';
import { maybeUnpack, scheme_add, scheme_mul, scheme_div, scheme_sub, sum } from './propagators';
import { withScheduler } from './scheduler';
import { Cell } from './Cell';

// in scheme, the `(+ ...)`  or `(*)` form is variadic, as is as is `(-)` and `(/)`
//
// let's check that we can do scheme-like math.
// (via https://www.cs.cmu.edu/Groups/AI/html/r4rs/r4rs_8.html#SEC50)
describe('scheme-like operators', () => {
	test('+', () => {
		// (+ 3 4)   =>  7
		expect(scheme_add(3, 4)).toBe(7);
		// (+ 3)     =>  3
		expect(scheme_add(3)).toBe(3);
		// (+)       =>  0
		expect(scheme_add()).toBe(0);
	});
	test('*', () => {
		expect(scheme_mul(3, 4)).toBe(12);
		// (* 4)     =>  4
		expect(scheme_mul(4)).toBe(4);
		// (*)       =>  1
		expect(scheme_mul()).toBe(1);
	});

	test('-', () => {
		// (- 3 4)   =>  -1
		expect(scheme_sub(3, 4)).toBe(-1);
		// (- 3 4 5) =>  -6
		expect(scheme_sub(3, 4, 5)).toBe(-6);
		// (- 3)     =>  -3
		expect(scheme_sub(3)).toBe(-3);
	});
	test('/', () => {
		// (/ 3 4 5) =>  3/20
		expect(scheme_div(3, 4, 5)).toBe(3 / 20);
		// (/ 3)     =>  1/3
		expect(scheme_div(3)).toBeCloseTo(1 / 3);
	});
});

test(
	'sum',
	withScheduler(async (scheduler) => {
		{
			var a = new Cell(),
				b = new Cell(),
				c = new Cell();

			sum(a, b, c);

			a.addContent(5);
			b.addContent(6);

			await scheduler.quiesce();
			expect(c.content).toBe(11);
		}
		{
			var a = new Cell(),
				b = new Cell(),
				c = new Cell();

			sum(a, b, c);

			c.addContent(11);
			b.addContent(6);

			await scheduler.quiesce();
			expect(a.content).toBe(5);
		}
		{
			var a = new Cell(),
				b = new Cell(),
				c = new Cell();

			sum(a, b, c);

			c.addContent(11);
			a.addContent(5);

			await scheduler.quiesce();
			expect(b.content).toBe(6);
		}
	})
);

import { add, div } from './propagators';

describe('arity unpacking (i.e. interval math)', () => {
	test('+', () => {
		expect(add(1, 2)).toBe(3);
		expect(add([1, 2], [3, 4])).toStrictEqual([4, 6]);
		expect(add([1, 2], 2, 3)).toStrictEqual([6, 7]);
	});

	test('/', () => {
		expect(div(1, 2)).toBe(1 / 2);
		expect(div([4, 8], 2, 2)).toStrictEqual([1, 2]);

		// this is the odd one out; we cant get away with pairwise anymore
		expect(div([2, 3], [1, 2])).toStrictEqual([1, 3]);
	});
});
