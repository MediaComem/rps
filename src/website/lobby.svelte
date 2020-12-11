<script lang='typescript'>

import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';

import { availableGamesMessageCodec, Game, gameCreatedMessageCodec, gameDoneMessageCodec, gameJoinedMessageCodec, playerRegisteredMessageCodec } from '../common/messages';
import { currentGame } from './stores/current-game';
import { currentPlayer } from './stores/current-player';
import { onDisconnected, onMessage, webSocketStore } from './stores/ws';
import type { Unsubscriber } from './utils';

let availableGames: Game[] = [];
let availableGamesLoaded = false;
let joiningGame: Game | undefined = undefined;
let connected = webSocketStore.connected;

const unsubs: Unsubscriber[] = [];
const playerName = writable('');

$: canPlay = isPlayerNameValid($playerName) && $currentPlayer !== undefined && !joiningGame && $connected;

onDisconnected(() => {
  availableGames = [];
  availableGamesLoaded = false;
});

onMessage(availableGamesMessageCodec, msg => {
  availableGames = [ ...msg.payload, ...availableGames ];
  availableGamesLoaded = true;
});

onMessage(gameCreatedMessageCodec, msg => {

  const player = $currentPlayer;
  if (!player) {
    return;
  }

  currentGame.set({
    id: msg.payload.id,
    players: [ player, null ]
  });
});

onMessage(gameJoinedMessageCodec, msg => {
  const player = $currentPlayer;
  if (joiningGame && msg.payload.id === joiningGame.id && msg.payload.playerId === player?.id) {
    currentGame.set({
      id: msg.payload.id,
      players: [ joiningGame.players[0], player ]
    });
  } else {
    availableGames = availableGames.filter(game => game.id !== msg.payload.id);
  }
});

onMessage(gameDoneMessageCodec, msg => {
  availableGames = availableGames.filter(game => game.id !== msg.payload.id);
});

onMessage(playerRegisteredMessageCodec, msg => {
  currentPlayer.update($player => ({ ...$player, id: msg.payload.id, name: $playerName.trim() }));
});

onDestroy(() => unsubs.forEach(unsub => unsub()));

function isPlayerNameValid(value: string) {
  const length = value.trim().length;
  return length >= 1 && length <= 50;
}

function createGame() {
  if (!canPlay) {
    return;
  }

  webSocketStore.sendMessage({
    topic: 'games',
    event: 'create',
    payload: {
      playerName: $playerName.trim()
    }
  });
}

function joinGame(game: Game) {
  if (!canPlay) {
    return;
  }

  joiningGame = game;

  webSocketStore.sendMessage({
    topic: 'games',
    event: 'join',
    payload: {
      id: game.id,
      playerName: $playerName.trim()
    }
  });
}

</script>

<main>
  <div class='container'>
    <div class='row'>

      <!-- Player -->
      <div class='col'>
        <h2 class='mt-3'>Who are you?</h2>
        <form on:submit|preventDefault={createGame}>
          <div class='mb-3'>
            <label for='player-name' class='form-label'>Player name</label>
            <input type='string' class='form-control' id='player-name' aria-describedby='player-name-help' bind:value='{$playerName}'>
            <div id='player-name-help' class='form-text'>Your name will be publicly visible during a game.</div>
          </div>
          <button type='submit' class='btn btn-success' disabled='{!canPlay}'>New game</button>
        </form>
      </div>

      <!-- Games waiting for players -->
      <div class='col'>
        <h2 class='mt-3'>Join a game</h2>

        {#if !$connected}
          <p class='text-danger'>Connection cannot be established.</p>
        {:else if !availableGamesLoaded && $connected}
          <p class='text-secondary'>Loading available games...</p>
        {:else if !availableGames.length}
          <p class='text-secondary'>No games are available.</p>
        {:else if !isPlayerNameValid($playerName)}
          <p class='text-warning'>You must enter your name before you can play.</p>
        {:else}
          <p class='text-success'>Click on a game to join it!</p>
        {/if}

        {#if availableGames.length}
          <div class='list-group'>
            {#each availableGames as game}
              <button class='list-group-item list-group-item-action' aria-current='true' type='button' class:list-group-item-primary='{canPlay}' class:list-group-item-secondary='{!canPlay}' on:click={() => joinGame(game)}>
                <div class='d-flex w-100 justify-content-between'>
                  <h5 class='mb-1'>{game.players[0].name}</h5>
                  <small>waiting for players</small>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  </div>
</main>

<style lang='stylus'>
</style>
