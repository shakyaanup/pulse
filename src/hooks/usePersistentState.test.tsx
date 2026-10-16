import { act, renderHook } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';
import { clearAppStorage } from '../services/storage';

test('starts from the initial value when nothing is saved', () => {
  const { result } = renderHook(() => usePersistentState('count', 1));
  expect(result.current[0]).toBe(1);
});

test('saves changes and restores them next time', () => {
  const first = renderHook(() => usePersistentState('count', 1));
  act(() => first.result.current[1](5));
  first.unmount();

  // A fresh mount stands in for reloading the page
  const second = renderHook(() => usePersistentState('count', 1));
  expect(second.result.current[0]).toBe(5);
});

test('ignores saved data that is not valid JSON', () => {
  window.localStorage.setItem('pulse:v1:count', '{not json');
  const { result } = renderHook(() => usePersistentState('count', 1));
  expect(result.current[0]).toBe(1);
});

test('clearAppStorage removes only Pulse data', () => {
  window.localStorage.setItem('pulse:v1:count', '5');
  window.localStorage.setItem('someone-else', 'keep me');

  clearAppStorage();

  expect(window.localStorage.getItem('pulse:v1:count')).toBeNull();
  expect(window.localStorage.getItem('someone-else')).toBe('keep me');
});
