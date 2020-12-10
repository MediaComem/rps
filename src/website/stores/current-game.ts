import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';

import type { Game } from '../../common/messages';

export const currentGame = writable<Game | null>(null);

export function onCurrentGameChange(callback: (currentGame: Game | null) => void) {
  onDestroy(currentGame.subscribe(callback));
}

export function quitCurrentGame() {
  currentGame.set(null);
}
