/** Touch capability survives orientation changes and tablet-sized viewports. */
export function usesTouchControls(): boolean {
  return navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches || window.matchMedia('(max-width: 900px)').matches;
}
export function syncInputMode(): void {
  document.documentElement.dataset.input = usesTouchControls() ? 'touch' : 'keyboard';
}
