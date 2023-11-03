// the core simulation scheduler

// > from p. 31
// > • Propagators are run in an arbitrary, unpredictable order. This is important because we don’t
// >   want to accidentally depend on the order of their execution.
// > • Once a propagator is run, by default it will not run again unless it gets queued again.
// > • Every propagator that is queued will eventually run.[^2]
// > • Every execution of every propagator, including every read and every write of every cell, is atomic.
// >   This is an accident of the scheduler’s being single threaded, but it does save us the confusion of
// >   cluttering our exploratory code with interlocks.
// >
// > [^2]: Unless the network itself enters an infinite loop. Thoughts about mitigating that possibility are deferred to Section 6.4.

// > from p. 150:
// >
// > For the sake of clarity of exposition, the examples in the dissertation omit references to the scheduler; but in order for those
// > examples to actually work in a standard Scheme system, the scheduler must be called. For instance, attaching a constant to a cell
// > and reading its value would be written in the text as
// > ```scheme
// > (define foo (make-cell))
// > ((constant 42) foo)
// > (content foo)
// > ;; Expect 42
// > ```
// > but inputting literally that into a standard Scheme wouldn’t work, at worst because the scheduler’s internal state would still
// > be uninitialized, or at best because the constant propagator would not have had a chance to run before the user read the content
// > of foo. At a minimum, the scheduler must be initialized before beginning the interaction, and invoked before requesting any answers,
// > so:
// > ```scheme
// > (initialize-scheduler)
// > (define foo (make-cell))
// > ((constant 42) foo)
// > (run)
// > (content foo)
// > 42
// > ```
// > But, it is acceptable to overshoot, calling (run) after every toplevel form:
// > ```scheme
// > (initialize-scheduler)
// >
// > (define foo (make-cell))
// > (run)
// >
// > ((constant 42) foo)
// > (run)
// >
// > (content foo)
// > 42
// > ```
// > This leads to no adverse consequences, so a production propagation system could offer user interaction via a read-eval-run-print loop,
// > inserting the appropriate extra step into the standard Scheme interaction. With a bit of poetic licence, therefore, one can say that
// > the main text presumes the existence of such an interaction mechanism, even though I have not implemented it.
export class Scheduler {
	queue = [];

	// AKA "run"
	// IMPORTANT: make sure this is called at least once (and as often as you'd like) before expecting meaningful values out the network.
	/* async */ quiesce() {
		// NB: not actually async (yet?), because that seems hard (we would need something
		// approximating a Promise.all construct that can extend its own resolution
		// indefinitely)
		while (this.queue.length > 0) {
			this.queue.pop().apply(undefined);
		}

		// oh look we're all done.
		return Promise.resolve();
	}

	notify(items) {
		this.queue = [...this.queue, ...items];
	}
}

export var currentScheduler;

export function withScheduler(f, scheduler) {
	const old = currentScheduler;

	return async () => {
		currentScheduler = scheduler || new Scheduler();
		try {
			return await f(currentScheduler);
		} finally {
			currentScheduler = old;
		}
	};
}
