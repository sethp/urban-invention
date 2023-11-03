import { Cell } from './Cell';
import { quadratic, product, constant } from './propagators';

// (define (fall-duration t h)
//   (let ((g (make-cell))
//         (one-half (make-cell))
//         (t^2 (make-cell))
//         (gt^2 (make-cell)))
//   ((constant (make-interval 9.789 9.832)) g)
//   ((constant (make-interval 1/2 1/2)) one-half)
//
//   (quadratic t t^2)
//   (product g t^2 gt^2)
//   (product one-half gt^2 h)))
//
// via Radul p. 40
export function Wire_FallDuration(t, h) {
	var g = new Cell(),
		oneHalf = new Cell(),
		tSquared = new Cell(),
		partialProduct = new Cell();

	constant([9.789, 9.832]).apply(g);
	constant([1 / 2, 1 / 2]).apply(oneHalf); // exactly 1/2

	quadratic(t, tSquared);
	product(g, tSquared, partialProduct);
	product(oneHalf, partialProduct, h);
}

// (define (similar-triangles s-ba h-ba s h)
// (let ((ratio (make-cell)))
// (product s-ba ratio h-ba)
// (product s ratio h)))
//
// via Radul p. 40
export function Wire_SimilarTriangles(s_ba, h_ba, s, h) {
	var ratio = new Cell();

	product(s_ba, ratio, h_ba);
	product(s, ratio, h);
}
