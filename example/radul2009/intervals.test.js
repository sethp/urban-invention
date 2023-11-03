import { test, expect } from 'vitest';
import { Cell } from './Cell';
import { withScheduler } from './scheduler';
import { Wire_FallDuration, Wire_SimilarTriangles } from './intervals';

// here we're measuring the height of a building using a barometer
// our three strategies are:
// 1. Drop the barometer off the top of the building and time its fall
// 2. Measure the length of the shadow, and use the barometer (+ its shadow)
//    to control for the angle of the sun (w/ "similar-triangles")
// 3. Trade the barometer to the building super for precise information
//
// Everything's in meters and seconds, but if you want to hook up a dimensional
// analysis network to cross-convert between SI and Imperial units, don't let me
// stop you.

// ...
// (add-content fall-time (make-interval 2.9 3.1))
// (content building-height)
// #(interval 41.163 47.243)
//
// via p. 40
test(
	'fall-duration',
	withScheduler(async (scheduler) => {
		var t = new Cell(),
			h = new Cell();

		Wire_FallDuration(t, h);

		t.addContent([2.9, 3.1]);

		await scheduler.quiesce();
		const [lo, hi] = h.content;
		expect(lo).toBeCloseTo(41.163);
		expect(hi).toBeCloseTo(47.243);
	})
);

// ...
// (similar-triangles barometer-shadow barometer-height
//                    building-shadow building-height)
// (add-content building-shadow (make-interval 54.9 55.1))
// (add-content barometer-height (make-interval 0.3 0.32))
// (add-content barometer-shadow (make-interval 0.36 0.37))
// (content building-height)
// #(interval 44.514 48.978)
//
// p.40
test(
	'similar-triangles',
	withScheduler(async (scheduler) => {
		var barometerShadow = new Cell(),
			barometerHeight = new Cell(),
			buildingShadow = new Cell(),
			buildingHeight = new Cell();

		Wire_SimilarTriangles(barometerShadow, barometerHeight, buildingShadow, buildingHeight);

		buildingShadow.addContent([54.9, 55.1]);
		barometerHeight.addContent([0.3, 0.32]);
		barometerShadow.addContent([0.36, 0.37]);

		await scheduler.quiesce();
		const [lo, hi] = buildingHeight.content;
		expect(lo).toBeCloseTo(44.514);
		expect(hi).toBeCloseTo(48.978);
	})
);

// ...
// (fall-duration fall-time building-height)
// (add-content fall-time (make-interval 2.9 3.1))
// (content building-height)
//  => #(interval 41.163 47.243)
//
// (add-content building-height 45)
// (content fall-time)
//  => #(interval 3.0255 3.0322)
//
// p.49
test(
	'refinement',
	withScheduler(async (scheduler) => {
		var fallTime = new Cell(),
			buildingHeight = new Cell();

		Wire_FallDuration(fallTime, buildingHeight);

		fallTime.addContent([2.9, 3.1]);

		await scheduler.quiesce();
		{
			const [lo, hi] = buildingHeight.content;
			expect(lo).toBeCloseTo(41.163);
			expect(hi).toBeCloseTo(47.243);
		}

		buildingHeight.addContent(45);
		await scheduler.quiesce();
		{
			const [lo, hi] = fallTime.content;
			expect(lo).toBeCloseTo(3.0255);
			expect(hi).toBeCloseTo(3.0322);
		}
	})
);
