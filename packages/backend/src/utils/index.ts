import {isEmail} from 'class-validator';

export {withTransaction} from './mongodb/withTransaction.js';

export const promiseMap = <T = any, D = any>(inputValues: T[], mapper: (val: T, index: number) => Promise<D>) => {
  return inputValues.reduce((acc$, inputValue, index) => acc$.then((acc) => {
    return mapper(inputValue, index).then((result) => acc.push(result) && acc);
  }), Promise.resolve([]));
};

export const getRandomInt = (min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const minCeil = Math.ceil(min);
  return Math.floor(Math.random() * (Math.floor(max) - minCeil) + minCeil);
};

export const getEmail = (email?: string | unknown): string | null => {
  if(typeof email !== 'string' || !email || !isEmail(email)) {
    return null;
  }
  return email.trim().toLowerCase();
};

export const filterUndefinedValues = (object: Object) => {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => Boolean(value)));
};
