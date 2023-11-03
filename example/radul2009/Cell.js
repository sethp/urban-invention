import { maybeUnpack } from './propagators';
import { currentScheduler } from './scheduler';

// A sentinel value, use === or Object.is
export const Nothing = new (class Nothing {})();

// This new information is equivalent to (a subset of) the information we already knew.
// A sentinel value, use === or Object.is
export const Equiv = new (class Equiv {})();
// This new information is contradictory with what we already knew.
// A sentinel value, use === or Object.is
export const Contradiction = new (class Contradiction {})();

export class Cell {
	content = Nothing;
	neighbors = [];

	get content() {
		return Promise.resolve(this.content);
	}

	// cf. new-neighbor!
	addNeighbor(neighbor) {
		if (!this.neighbors.includes(neighbor)) {
			this.neighbors.push(neighbor);
			currentScheduler.notify([neighbor]);
		}
	}

	addContent(content) {
		var merged = merge(this.content, content);
		if (merged === Nothing || merged === Equiv) {
			return; // 'ok
		} else if (merged === Contradiction) {
			throw new Error(`ack! inconsistency! (merge ${this.content} w/ ${content})`);
		}
		this.content = merged;
		currentScheduler.notify(this.neighbors);
	}
}

var mergeFns = [];
function merge(content, increment) {
	var found = mergeFns.find((mFn) => mFn.matches(content, increment));
	if (!found) return Contradiction;
	return found.apply(content, increment);
}

class MergeFn {
	constructor(pred, fn) {
		this.pred = pred;
		this.fn = fn;
	}

	matches() {
		return this.pred.apply(this, arguments);
	}

	apply() {
		return this.fn.apply(this, arguments);
	}
}

// let's handle some floating point yey
export function num_eq(a, b) {
	const epsilon = 0.001;
	return Math.abs(a - b) < epsilon;
}

// look ma, predicate dispatch in js
// (yes this is a bad idea, global namespaces are ~spicy~)
// (but that's how scheme does it, so that's how we're gonna do it for now)
export function registerMerge(predicate, fn) {
	mergeFns.push(new MergeFn(predicate, fn));
}

// any? nothing?
// nothing? any?
registerMerge(
	(c, i) => c === Nothing || i === Nothing,

	// lol:
	// Merge is not entirely symmetric: if the first and second arguments represent
	// equivalent information but are not eq?, merge must return the first rather
	// than the second. This is a consequence of the asymmetry in the cells’ treatment
	// of their existing content versus incoming content. Having merge return the wrong
	// one could lead to spurious infinite loops
	// (p. 46)
	//
	// times that's happened++
	(c, i) => {
		// if exactly one is nothing
		if ((c === Nothing) != (i === Nothing)) {
			// learning something when we knew nothing
			if (c === Nothing) return i;
			// learning nothing about something
			if (i === Nothing) return Equiv;
		}
		// both must be Nothing
		return Nothing;
	}
);
// number? number?
registerMerge(
	(c, i) => typeof c === 'number' && typeof i === 'number',
	(c, i) => {
		if (num_eq(c, i)) return Equiv;
		return Contradiction;
	}
);
// interval? interval?
registerMerge(
	(c, i) => Array.isArray(c) && Array.isArray(i),
	(c, i) => {
		if (c.every((_, j) => num_eq(c[j], i[j]))) return Equiv;
		else if (i[0] < c[0] && c[1] < i[1]) return Equiv;
		const merged = [
			Math.max(c[0], i[0]), // max of [a, ...
			Math.min(c[1], i[1]), // min of ..., b]
		];
		if (c[1] < c[0]) {
			// empty interval
			return Contradiction;
		}
		return merged;
	}
);
// number? interval?
// interval? number?
registerMerge(
	(c, i) =>
		(Array.isArray(c) && typeof i === 'number') || (typeof c === 'number' && Array.isArray(i)),
	(c, i) => {
		const [a, n] = Array.isArray(c) ? [c, i] : [i, c];
		if (a.every((nn) => num_eq(n, nn))) return Equiv;
		if (n > a[1] || n < a[0]) {
			// empty interval
			return Contradiction;
		}
		return n;
	}
);
