<script lang='typescript'>
  import { writable } from 'svelte/store';

  import type { Game, GameMessage, PlayerMessage } from '../common/messages';
  import { encodeMessage } from '../common/utils';
  import { latestMessageStore, webSocketStore } from './ws';

  const form = writable('');
  const games = writable<Game[]>([]);
  const playerId = writable<string | null>(null);

  latestMessageStore.subscribe(message => {
    if (!message) {
      return;
    }

    switch (message.topic) {
      case 'games':
        handleGameMessage(message);
        break;
      case 'players':
        handlePlayerMessage(message);
        break;
      default:
        console.log('Received unexpected message', encodeMessage(message));
        break;
    }
  });

  $: formEnabled = isPlayerValid($form) && $playerId !== null;

  function isPlayerValid(value: string) {
    return value.trim().length >= 1;
  }

  function createGame() {
    webSocketStore.sendMessage({
      topic: 'games',
      event: 'create',
      payload: {
        playerName: $form
      }
    });
  }

  function handleGameMessage(message: GameMessage) {
    switch (message.event) {
      case 'available':
        games.update(g => [ ...message.payload, ...g ]);
        break;
      case 'create':
        // Nothing to do.
        break;
      default:
        console.log('Received unexpected game message', encodeMessage(message));
    }
  }

  function handlePlayerMessage(message: PlayerMessage) {
    switch (message.event) {
      case 'registered':
        playerId.update(() => message.payload.id);
        break;
      default:
        console.log('Received unexpected player message', encodeMessage(message));
    }
  }
</script>

<main>
  <div class='container'>
    <div class='row'>

      <!-- Player -->
      <div class='col'>
        <h2>Who are you?</h2>
        <form on:submit|preventDefault={createGame}>
          <div class='mb-3'>
            <label for='player-name' class='form-label'>Player name</label>
            <input type='string' class='form-control' id='player-name' aria-describedby='player-name-help' bind:value='{$form}'>
            <div id='player-name-help' class='form-text'>Your name will be publicly visible during a game and in the game history.</div>
          </div>
          <button type='submit' class='btn btn-success' disabled='{!formEnabled}'>New game</button>
        </form>
      </div>

      <!-- Games waiting for players -->
      <div class='col'>
        <h2>Join a game</h2>
        <div class='list-group'>
          {#each $games as game}
            <button class='list-group-item list-group-item-action' aria-current='true' type='button'>
              <div class='d-flex w-100 justify-content-between'>
                <h5 class='mb-1'>{game.players[0].name}</h5>
                <small>3 days ago</small>
              </div>
              <p class='mb-1'>Donec id elit non mi porta gravida at eget metus.</p>
            </button>
          {/each}
        </div>
      </div>

    </div>
  </div>
</main>

<style lang='stylus'>
</style>
