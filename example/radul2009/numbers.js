import { Cell } from './Cell';
import { constant, subtractor, divider, multiplier } from './propagators';
import { sum, product } from './propagators';

// unidirectional fahrenheit->celsius network
//
// (define (fahrenheit->celsius f c)
//     (let ((thirty-two (make-cell))
//         (f-32 (make-cell))
//         (five (make-cell))
//         (c*9 (make-cell))
//         (nine (make-cell)))
//     ((constant 32) thirty-two)
//     ((constant 5) five)
//     ((constant 9) nine)
//     (subtractor f thirty-two f-32)
//     (multiplier f-32 five c*9)
//     (divider c*9 nine c)))
//
// via Radul p.28
export function Wire_FahrenheitToCelsius_oneway(f, c) {
	var thirtyTwo = new Cell(),
		fMinus32 = new Cell(),
		five = new Cell(),
		cTimes9 = new Cell(),
		nine = new Cell();

	constant(32).apply(thirtyTwo);
	constant(5).apply(five);
	constant(9).apply(nine);

	subtractor(f, thirtyTwo, fMinus32);
	multiplier(fMinus32, five, cTimes9);
	divider(cTimes9, nine, c);
}

// bi-directional fahrenheit-celsius network
//
// (define (fahrenheit-celsius f c)
//     (let ((thirty-two (make-cell))
//         (f-32 (make-cell))
//         (five (make-cell))
//         (c*9 (make-cell))
//         (nine (make-cell)))
//     ((constant 32) thirty-two)
//     ((constant 5) five)
//     ((constant 9) nine)
//     (sum thirty-two f-32 f)
//     (product f-32 five c*9)
//     (product c nine c*9)))
//
// via Radul p. 37
export function Wire_FahrenheitCelsius(f, c) {
	var thirtyTwo = new Cell(),
		fMinus32 = new Cell(),
		five = new Cell(),
		cTimes9 = new Cell(),
		nine = new Cell();

	constant(32).apply(thirtyTwo);
	constant(5).apply(five);
	constant(9).apply(nine);

	sum(thirtyTwo, fMinus32, f);
	product(fMinus32, five, cTimes9);
	product(c, nine, cTimes9);
}

// via p.38
export function Wire_CelsiusKelvin(c, k) {
	var many = new Cell();

	constant(273.15).apply(many);

	sum(many, c, k);
}
