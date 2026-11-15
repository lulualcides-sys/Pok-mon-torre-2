/**
 * The historic REA inventory does not enumerate every NEW critical asset.
 * The native PMD manifest is always a first-party mandatory dependency.
 * Read-only asset list preparation; no network, mirrors or substitutions.
 */
export const NATIVE_PMD_MANIFEST='assets/pmd/manifest.json';

export function prioritizedNativeSourceTasks(tasks){
 if(!(tasks instanceof Map))throw TypeError('Expected map of verified source tasks');
 const existing=tasks.get(NATIVE_PMD_MANIFEST);
 return [
  [NATIVE_PMD_MANIFEST,existing||{source:'mandatory original PMD manifest'}],
  ...[...tasks].filter(([pathname])=>pathname!==NATIVE_PMD_MANIFEST)
 ];
}
