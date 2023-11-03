import { test, describe, expect } from 'vitest';
import { Nothing } from './Cell';

describe('Nothing', () => {
	test('===', () => {
		expect(Nothing).toStrictEqual(Nothing);

		expect({}).not.toStrictEqual(Nothing);
		expect(Nothing).not.toStrictEqual({});
	});
	test('Object.is', () => {
		expect(Nothing).toBe(Nothing);

		expect({}).not.toBe(Nothing);
		expect(Nothing).not.toBe({});

		var other = Object.create(Object.getPrototypeOf(Nothing));
		expect(Nothing).not.toBe(other);
		expect(other).not.toBe(Nothing);
	});

	test('oopsies', () => {
		// it's not air-tight
		var other = Object.create(Object.getPrototypeOf(Nothing));
		expect(Nothing, 'descriptive (not normative)').toStrictEqual(other);
		expect(other, 'descriptive (not normative)').toStrictEqual(Nothing);
	});
});
