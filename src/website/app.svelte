<script lang='typescript'>

import { writable } from 'svelte/store';
import type { Game } from '../common/messages';

import GamePage from './game.svelte';
import LobbyPage from './lobby.svelte';
import { onCurrentGameChange } from './stores/current-game';
import { webSocketStore } from './stores/ws';

enum Page {
  Lobby,
  Game
}

interface State {
  readonly page: Page
}

const store = writable<State>({
  page: Page.Lobby
});

const connected = webSocketStore.connected;

onCurrentGameChange(currentGame => {
  store.update($store => updatePage($store, currentGame));
});

function updatePage(state: State, currentGame: Game | null) {
  return {
    ...state,
    page: currentGame ? Page.Game : Page.Lobby
  };
}

</script>

<main>
  <!-- Top navbar -->
  <nav class='navbar navbar-expand-lg navbar-dark bg-dark fixed-top'>
    <div class='container-fluid'>
      <a class='navbar-brand' href='/'>Rock Paper Scissors</a>
      <span class='navbar-text' class:text-success='{$connected}' class:text-danger='{!$connected}'>
        {$connected ? 'Online' : 'Offline'}
      </span>
    </div>
  </nav>

  <!-- Current page -->
  {#if $store.page === Page.Game}
    <GamePage />
  {:else if $store.page === Page.Lobby}
    <LobbyPage />
  {:else}
    <p>Page not found</p>
  {/if}
</main>

<style lang='stylus'>
</style>
