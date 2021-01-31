import { None, Some, Left, Right, Task } from "./adt";

export const compose = (...fns) => x => fns.reduceRight(
  (v, f) => f(v), x
)

export const pipe = (...fns) => x => fns.reduce(
  (v, f) => f(v), x
)

export const map = fn => x => x.map(fn);
export const liftA2 = f => a1 => a2 => a1.map(f).ap(a2);
export const liftA3 = f => a1 => a2 => a3 => a1.map(f).ap(a2).ap(a3);
export const chain = fn => x => x.chain(fn);

export const reduce = f => xs => xs.reduce(f);
export const reduceRight = f => xs => xs.reduceRight(f);

export const fold = f => x => xs => xs.reduce(f, x);
export const foldRight = f => x => xs => xs.reduceRight(f, x);

export const prop = p => obj => obj[p];
export const safeProp = p => obj => {
  if (obj.hasOwnProperty(p)) return Some(obj[p]);
  return None;
}

export const converge = (fn, fns) => x => fn(
  ...fns.map(f => f(x))
);

export const lift2 = f => g => h => x => f(g(x))(h(x))

// head :: [a] -> Option a
export const head = array => {
  if (array.length === 0) return None;
  return Some(array[0]);
}

// divide :: Number -> Number -> Either String Number
export const divide = a => b => {
  if (b === 0) return Left('Cannot divide by zero');
  return Right(a/b);
}

// option :: (() -> b, a -> b) -> Option a -> b
export const option = (n, s) => x => {
  if (x.type === 'None') return n();
  return s(x.value);
}

// either :: (a -> c, b -> c) -> Either a b -> c
export const either = (l, r) => x => {
  if (x.type === 'Left') return l(x.value);
  return r(x.value);
}

/**
 * Natural transformations
 */
export const eitherToOption = either(
  () => None,
  x => Some(x)
)

export const optionToEither = ifNone => option(
  () => ifNone,
  x => Right(x)
)

export const eitherToTask = either(
  l => Task.reject(l),
  r => Task.resolve(r)
)

export const optionToTask = ifNone => option(
  () => Task.reject(ifNone),
  x => Task.resolve(x)
)