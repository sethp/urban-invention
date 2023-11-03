import { Nothing } from './Cell';
import { currentScheduler } from './scheduler';

// (define (propagator neighbors to-do)
//     (for-each (lambda (cell)
//             (new-neighbor! cell to-do))
//         (listify neighbors))
//     (alert-propagator to-do))
export function propagator(neighbors, op) {
	for (const cell of neighbors) {
		cell.addNeighbor(op);
	}
	currentScheduler.notify([op]); // "defensive programming"
}

// (define (function->propagator-constructor f)
//     (lambda cells
//         (let ((output (car (last-pair cells)))
//             (inputs (except-last-pair cells)))
//         (propagator inputs                      ; The output isn’t a neighbor!
//           (lambda ()
//            (add-content output
//            (apply f (map content inputs))))))))
export function asPropagator(f) {
	return /*async*/ function (...cells) {
		const output = cells[cells.length - 1];
		const inputs = cells.slice(0, -1);
		/* return */ propagator(inputs, function () {
			output.addContent(
				f.apply(
					undefined,
					inputs.map((c) => c.content)
				)
			);
		});
	};
}

// (define (handling-nothings f)
//     (lambda args
//         (if (any nothing? args)
//             nothing
//             (apply f args))))
export function handlingNothings_pre_S_3_4(f) {
	return function () {
		if ([...arguments].find((v) => v === Nothing)) {
			return Nothing;
		}
		return f.apply(this, arguments);
	};
}

// cf. nary-unpacking
export function maybeUnpack(f) {
	return function () {
		const args = [...arguments];
		const arrArg = args.find((arg) => Array.isArray(arg));
		if (!arrArg) {
			return f.apply(this, arguments);
		}
		// we're assuming all arrays, if present, are the same length
		return new Array(arrArg.length).fill().map((_, i) =>
			f.apply(
				this,
				args.map((v) => (Array.isArray(v) ? v[i] : v))
			)
		);
	};
}

export const handlingNothings = handlingNothings_pre_S_3_4;

export function scheme_add() {
	return [...arguments].reduce((a, b) => a + b, 0);
}
export function scheme_mul() {
	return [...arguments].reduce((a, b) => a * b, 1);
}
export function scheme_sub() {
	if (arguments.length == 1) {
		return -arguments[0];
	}
	return [...arguments].reduce((a, b) => a - b);
}
export function scheme_div() {
	if (arguments.length == 1) {
		return 1 / arguments[0];
	}
	return [...arguments].reduce((a, b) => a / b);
}

// we cheat a little, because simply doing pairwise vector ops (i.e. decomposing [a] + [b] into [a[0] + b[0], ...])
// will preserve our [lo, hi] interval shape invariant for these two operators...
export const add = maybeUnpack(scheme_add);
export const mul = maybeUnpack(scheme_mul);
// ... but not this one. See the comment below for more.
export const div = function () {
	const [first, ...rest] = arguments;
	// well there's a lot to unpack here
	//
	// sorry for the scheme-like syntax, but we're building a small part of the paper's use of a scheme
	// interpreter in order to make the examples map more directly.
	//
	// what's worse is that we're very generic at this point: this function has to
	// handle the two common cases of
	//   (/ 1 3) => 1/3
	// and
	//   (/ [1 2] [2 3]) => [1/3 1] (not [1/2 2/3] !)
	// we also want to nicely handle
	//   (/ [1 2] 3) => [1/3 2/3]
	//   (/ 8 [2 4]) => [2 4] (not [4, 2] !)
	//
	// so, the strategy is to:
	//   (* first (/ 1.0 <something>))
	// which might have to be pair-wise multiplication, so we use `maybeUnpack(mul)` and `maybeUnpack(div)`
	// to handle that possibility.
	//
	// so our two scalar examples above become:
	//   (/ 1 3) => (* 1 (/ 1.0 3))
	//
	//   (/ [1 2] 3) => [(* 1 (/ 1.0 3))
	//                   (* 2 (/ 1.0 3))]
	// but now there's a wrinkle: in order to preserve the [lo, hi] shape invariant of our intervals,
	// we can't just do element-wise reciprocation: if hi > lo, then 1/hi < 1/lo !
	//
	// so, we shuffle the order (with `reverse`) to produce:
	//
	//    (/ 8 [2 4]) => [(* 8 (/ 1.0 4))
	//                   (* 8 (/ 1.0 2))]
	//                => [2 4]
	//
	//    (/ [1 2] [2 3]) => [(* 1 (/ 1.0 3))
	//                        (* 2 (/ 1.0 2))]
	//                    => [1/3 1]
	return maybeUnpack(mul)(
		first,
		maybeUnpack(scheme_div)(
			1.0,
			...rest.map((e) => {
				if (Array.isArray(e)) {
					return [...e].reverse(); // we want to divide by the largest in order to get the smallest
				}
				return e;
			})
		)
	);
};

// well, this is awkward; should `(- [1 2] [0 77])` be  `[0 -75]` (i.e. an empty interval) or `[-76 2]` (by
// analogy with division?). If I have between 1 and 2 apples, and you eat anywhere between 0 and 77 apples,
// then how many apples am I left with?
//
// I didn't find anywhere in the paper where subtraction over intervals is precisely defined, nor are there any
// examples of subtracting intervals, so imma put this particular rock back, but a more careful definition of
// the interval algebra ought to be explicit in a way that we're playing it pretty fast and loose.
export const sub = maybeUnpack(scheme_sub);

// > Each primitive propagator will need to promise that a single execution is enough for it to do everything it will do
// > with its currently available inputs. In other words, the software propagator must accomplish, in its one execution,
// > everything the autonomous device it represents would have done with those inputs. This has the effect that the propagator
// > will not need to be run again unless its inputs change. The cells will also need to maintain the invariant that every
// > propagator that might do anything if it were run, that is, one whose inputs have changed since the last time it ran,[^3]
// > is indeed queued to run.
//
// > [^3]: This is counted from when the propagator started running, because it might change its own inputs, in which case it
//      should be eligible for rerunning immediately. [...]
//
// (in other words: these are not required to be idempotent)
export function subtractor() {
	/* return */ asPropagator(handlingNothings(sub)).apply(this, arguments);
}
export function divider() {
	/* return */ asPropagator(handlingNothings(div)).apply(this, arguments);
}
export function multiplier() {
	/* return */ asPropagator(handlingNothings(mul)).apply(this, arguments);
}
export function adder() {
	/* return */ asPropagator(handlingNothings(add)).apply(this, arguments);
}

export function constant(value) {
	return function () {
		asPropagator(() => {
			return value;
		}).apply(undefined, [this]);
	};
}

// c = a + b
export function sum(a, b, c) {
	adder(a, b, c);
	subtractor(c, b, a);
	subtractor(c, a, b);
}

// c = a * b
export function product(a, b, c) {
	multiplier(a, b, c);
	divider(c, b, a);
	divider(c, a, b);
}

// y = x^2
export function quadratic(x, y) {
	multiplier(x, x, y);
	// sqrt(y, x);
	asPropagator(
		handlingNothings(
			maybeUnpack(function (y) {
				return Math.sqrt(y);
			})
		)
	).apply(this, [...arguments].reverse());
}
