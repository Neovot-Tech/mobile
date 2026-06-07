// @ts-ignore — __DEV__ is a React Native global
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const API_BASE = isDev
  ? 'http://localhost:8000/api/v1'
  : 'https://api.neovot.com/api/v1';
