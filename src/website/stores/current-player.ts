import { writable } from 'svelte/store';

import type { Player } from '../../common/messages';

export const currentPlayer = writable<Player | undefined>(undefined);
