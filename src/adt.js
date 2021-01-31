import { compose } from "./pointfree"

/**
 * Option
 */
export const None = {
  type: 'None',
  inspect: () => `None`,
  map: fn => None,
  ap: functor => None,
  join: () => None,
  chain: fn => None
}

export const Some = x => ({
  value: x,
  type: 'Some',
  inspect: () => `Some(${x})`,
  map: fn => Some(fn(x)),
  ap: functor => functor.map(x),
  join: () => x,
  chain: fn => fn(x)
})

export const Option = { Some, None, of: Some }

/**
 * Either
 */
export const Left = x => ({
  value: x,
  type: 'Left',
  inspect: () => `Left(${x})`,
  map: fn => Left(x),
  ap: functor => Left(x),
  chain: fn => Left(x)
})

export const Right = x => ({
  value: x,
  type: 'Right',
  inspect: () => `Right(${x})`,
  map: fn => Right(fn(x)),
  ap: functor => functor.map(x),
  chain: fn => fn(x)
})

export const Either = { Left, Right, of: Right }

/**
 * IO (Effect)
 */
export const IO = x => ({
  type: "IO",
  value: x,
  inspect: () => `IO(?)`,
  run: () => x(),
  map: function(fn) {
    return IO(
      compose(
        fn,
        x
      )
    ); // IO(() => fn(x()))
  },
  join: function() {
    return IO(() => this.value().value());
  },
  chain: function(fn) {
    return this.map(fn).join();
  },
  ap: function(functor) {
    return this.chain(fn => functor.map(fn));
  }
});

IO.of = x => IO(() => x);

/**
 * Task
 */
export const Task = x => ({
  type: "Task",
  value: x,
  inspect: () => `Task(?)`,
  fork: x,
  map: function(fn) {
    return Task((reject, resolve) =>
      x(
        reject,
        compose(
          resolve,
          fn
        )
      )
    );
  },
  join: () => {
    return Task((reject, resolve) => x(reject, a => a.fork(reject, resolve)));
  },
  chain: function(fn) {
    return Task((reject, resolve) =>
      x(reject, a => fn(a).fork(reject, resolve))
    );
  },
  join: function(fn) {
    return this.chain(a => a);
  },
  ap: function(functor) {
    return this.chain(fn => functor.map(fn));
  }
});

Task.reject = x => Task((reject, resolve) => reject(x));
Task.resolve = x => Task((reject, resolve) => resolve(x));
Task.of = Task.resolve;


/**
 * Validation
 */
export const Success = x => ({
  type: "Success",
  value: x,
  inspect: () => `Success(${x.toString()})`,
  map: fn => Success(fn(x)),
  chain: fn => fn(x),
  ap: functor => {
    return functor.type === "Fail" ? functor : functor.map(x);
  }
});

export const Fail = x => ({
  type: "Fail",
  value: x,
  inspect: () => `Fail(${x.toString()})`,
  map: fn => Fail(x),
  chain: fn => Fail(x),
  ap: functor => {
    return functor.type === "Fail" ? Fail(x.concat(functor.value)) : Fail(x);
  }
});

export const Validation = { Fail, Success, of: x => Success(x) };

/**
 * Writer
 */
export const Writer = (x, log) => ({
  type: "Writer",
  read: () => ({ value: x, log }),
  map: fn => Writer(fn(x), log),
  chain: fn => {
    const next = fn(x).read();
    return Writer(next.value, log.concat(next.log));
  },
  ap: m => {
    const previous = m.read();
    return Writer(x(previous.value), log.concat(previous.log));
  }
});

Writer.of = x => Writer(x, []);

/**
 * Reader
 * TODO: ap
 */
export const Reader = x => ({
  type: "Reader",
  runWith: deps => x(deps),
  map: fn => Reader(deps => fn(x(deps))),
  chain: fn => Reader(deps => fn(x(deps)).runWith(deps))
});

Reader.of = x => Reader(() => x);
export const ask = fn => (!!fn ? Reader(fn) : Reader(x => x));

/**
 * State
 * x :: s -> [a s]
 */
export const State = x => ({
  type: "State",
  inspect: () => `State(${x})`,
  runWith: state => x(state),
  map: fn => {
    return State(state => {
      const [first, second] = x(state);
      return [fn(first), second];
    });
  },
  chain: fn => {
    return State(state => {
      const [first, second] = x(state);
      const m = fn(first);
      return m.runWith(second);
    });
  },
  ap: m => {
    return State(state => {
      const [first, second] = x(state);
      return m.map(first).runWith(second);
    });
  }
});

State.of = x => State(state => [x, state]);