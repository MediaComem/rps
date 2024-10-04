<script lang='typescript'>
import { type Game, gameCountdownMessageCodec, gameDoneMessageCodec, gameJoinedMessageCodec, gameMovePlayedMessageCodec, type Move, type Player } from '../common/messages';

import { currentGame, quitCurrentGame } from './stores/current-game';
import { currentPlayer } from './stores/current-player';
import { onDisconnected, onMessage, webSocketStore } from './stores/ws';

enum GameState {
  WaitingForPlayer,
  Ongoing,
  CountingDown,
  Draw,
  Win,
  Loss,
  Timeout
}

const winsOver: Record<Move, Move> = {
  paper: 'rock',
  rock: 'scissors',
  scissors: 'paper'
};

let countdown: number | undefined;
let gameState = $currentGame?.players[1] === null ? GameState.WaitingForPlayer : GameState.Ongoing;
let played: Move | undefined = undefined;
let opponentMove: Move | null = null;

$: opponent = getOpponent($currentGame, $currentPlayer);
$: canPlay = !played && gameState === GameState.CountingDown;

onDisconnected(quitCurrentGame);

onMessage(gameJoinedMessageCodec, msg => {

  const game = $currentGame;
  if (msg.payload.id !== game?.id) {
    return;
  }

  gameState = GameState.Ongoing;
  const newPlayer = { id: msg.payload.playerId, name: msg.payload.playerName };
  currentGame.update(game => game ? ({ ...game, players: [ game.players[0], newPlayer ] }) : game);
});

onMessage(gameCountdownMessageCodec, msg => {
  if (gameState === GameState.Ongoing || gameState === GameState.CountingDown) {
    gameState = GameState.CountingDown;
    countdown = msg.payload.value;
  }
});

onMessage(gameDoneMessageCodec, msg => {

  const game = $currentGame;
  const player = $currentPlayer;
  if (!game || !player || msg.payload.id !== game.id) {
    return;
  }

  const ownMove = game.players[0].id === player.id ? msg.payload.moves[0] : msg.payload.moves[1];
  opponentMove = game.players[0].id === player.id ? msg.payload.moves[1] : msg.payload.moves[0];
  if (ownMove && opponentMove && ownMove === opponentMove) {
    gameState = GameState.Draw;
  } else if (ownMove && opponentMove) {
    gameState = winsOver[ownMove] === opponentMove ? GameState.Win : GameState.Loss;
  } else {
    gameState = GameState.Timeout;
  }
});

onMessage(gameMovePlayedMessageCodec, msg => {
  const player = $currentPlayer;
  if (msg.payload.playerId !== player?.id) {
    opponentMove = msg.payload.move;
  }
});

function getOpponent(game: Game | null, player?: Player) {
  if (!game || !player) {
    return;
  }

  const [ firstPlayer, secondPlayer ] = game.players;
  return firstPlayer.id === player.id ? secondPlayer : firstPlayer;
}

function play(move: Move) {

  const game = $currentGame;
  if (!game) {
    return;
  }

  played = move;

  webSocketStore.sendMessage({
    topic: 'games',
    event: 'play',
    payload: {
      move,
      id: game.id
    }
  });
}

</script>

<main class='text-center'>
  <div class='container'>
    <div class='row'>
      {#if gameState === GameState.WaitingForPlayer}
        <h2 class='mt-3'>Waiting for another player to join</h2>
        <p class='text-secondary'>The game will start a few seconds after someone joins.</p>
      {:else}
        <h2 class='mt-3'>You are playing against {opponent?.name}</h2>
      {/if}

      {#if gameState === GameState.Ongoing || gameState === GameState.CountingDown}
        {#if gameState === GameState.Ongoing}
          <p class='text-info'>The game is about to start!</p>
        {:else if gameState === GameState.CountingDown}
          <p class='text-warning'><strong>You can play</strong></p>
        {/if}

        <div class='mt-5'>
          <h3>Your move</h3>
          <div class='offset-lg-3 col-lg-6 d-flex mt-2'>
            <div class='btn-group btn-group-lg flex-fill' role='group' aria-label='Play'>
              <button type='button' class='btn' class:btn-outline-primary='{!played}' class:btn-outline-secondary='{played && played !== "rock"}' class:btn-primary='{played === "rock"}' disabled='{!canPlay}' on:click={() => play('rock')}>
                <i class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M144 0C117.5 0 96 21.5 96 48l0 48 0 28.5L96 176c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-26.7-9 7.5C40.4 169 32 187 32 206L32 244c0 38 16.9 74 46.1 98.3L128 384l0 96c0 17.7 14.3 32 32 32l160 0c17.7 0 32-14.3 32-32l0-105.3c46.9-19 80-65 80-118.7l0-80 0-16 0-16c0-26.5-21.5-48-48-48c-12.4 0-23.6 4.7-32.1 12.3C350 83.5 329.3 64 304 64c-12.4 0-23.6 4.7-32.1 12.3C270 51.5 249.3 32 224 32c-12.4 0-23.6 4.7-32.1 12.3C190 19.5 169.3 0 144 0z"/></svg>
                </i>
                Rock
              </button>
              <button type='button' class='btn' class:btn-outline-primary='{!played}' class:btn-outline-secondary='{played && played !== "paper"}' class:btn-primary='{played === "paper"}' disabled='{!canPlay}' on:click={() => play('paper')}>
                <i class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 272c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64l19.2 0c97.2 0 176-78.8 176-176l0-208c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 176c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208z"/></svg>
                </i>
                Paper
              </button>
              <button type='button' class='btn' class:btn-outline-primary='{!played}' class:btn-outline-secondary='{played && played !== "scissors"}' class:btn-primary='{played === "scissors"}' disabled='{!canPlay}' on:click={() => play('scissors')}>
                <i class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M40 208c-22.1 0-40 17.9-40 40s17.9 40 40 40l180.2 0c-7.6 8.5-12.2 19.7-12.2 32c0 25.3 19.5 46 44.3 47.9c-7.7 8.5-12.3 19.8-12.3 32.1c0 26.5 21.5 48 48 48l32 0 64 0c70.7 0 128-57.3 128-128l0-113.1c0-40.2-16-78.8-44.4-107.3C444.8 76.8 413.9 64 381.7 64L336 64c-21.3 0-39.3 13.9-45.6 33.1l74.5 23.7c8.4 2.7 13.1 11.7 10.4 20.1s-11.7 13.1-20.1 10.4L288 129.9c0 0 0 .1 0 .1L84 65.8C62.9 59.2 40.5 70.9 33.8 92s5.1 43.5 26.2 50.2L269.5 208 40 208z"/></svg>
                </i>
                Scissors
              </button>
            </div>
          </div>
        </div>

        <div class='mt-5'>
          <h3>Opponent's move</h3>
          <div class='offset-lg-3 col-lg-6 d-flex mt-2'>
            <div class='btn-group btn-group-lg flex-fill' role='group' aria-label='Play'>
              <button type='button' class='btn' disabled class:btn-outline-primary='{opponentMove !== "rock"}' class:btn-primary='{opponentMove === "rock"}'>
                {#if opponentMove === 'rock'}
                  <i class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M144 0C117.5 0 96 21.5 96 48l0 48 0 28.5L96 176c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-26.7-9 7.5C40.4 169 32 187 32 206L32 244c0 38 16.9 74 46.1 98.3L128 384l0 96c0 17.7 14.3 32 32 32l160 0c17.7 0 32-14.3 32-32l0-105.3c46.9-19 80-65 80-118.7l0-80 0-16 0-16c0-26.5-21.5-48-48-48c-12.4 0-23.6 4.7-32.1 12.3C350 83.5 329.3 64 304 64c-12.4 0-23.6 4.7-32.1 12.3C270 51.5 249.3 32 224 32c-12.4 0-23.6 4.7-32.1 12.3C190 19.5 169.3 0 144 0z"/></svg>
                  </i>
                {:else}
                  <i class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M80 160c0-35.3 28.7-64 64-64l32 0c35.3 0 64 28.7 64 64l0 3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74l0 1.4c0 17.7 14.3 32 32 32s32-14.3 32-32l0-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7l0-3.6c0-70.7-57.3-128-128-128l-32 0C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>
                  </i>
                {/if}
              </button>
              <button type='button' class='btn' disabled class:btn-outline-primary='{opponentMove !== "paper"}' class:btn-primary='{opponentMove === "paper"}'>
                {#if opponentMove === 'paper'}
                  <i class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 272c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64l19.2 0c97.2 0 176-78.8 176-176l0-208c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 176c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208z"/></svg>
                  </i>
                {:else}
                  <i class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M80 160c0-35.3 28.7-64 64-64l32 0c35.3 0 64 28.7 64 64l0 3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74l0 1.4c0 17.7 14.3 32 32 32s32-14.3 32-32l0-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7l0-3.6c0-70.7-57.3-128-128-128l-32 0C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>
                  </i>
                {/if}
              </button>
              <button type='button' class='btn' disabled class:btn-outline-primary='{opponentMove !== "scissors"}' class:btn-primary='{opponentMove === "scissors"}'>
                {#if opponentMove === 'scissors'}
                  <i class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M40 208c-22.1 0-40 17.9-40 40s17.9 40 40 40l180.2 0c-7.6 8.5-12.2 19.7-12.2 32c0 25.3 19.5 46 44.3 47.9c-7.7 8.5-12.3 19.8-12.3 32.1c0 26.5 21.5 48 48 48l32 0 64 0c70.7 0 128-57.3 128-128l0-113.1c0-40.2-16-78.8-44.4-107.3C444.8 76.8 413.9 64 381.7 64L336 64c-21.3 0-39.3 13.9-45.6 33.1l74.5 23.7c8.4 2.7 13.1 11.7 10.4 20.1s-11.7 13.1-20.1 10.4L288 129.9c0 0 0 .1 0 .1L84 65.8C62.9 59.2 40.5 70.9 33.8 92s5.1 43.5 26.2 50.2L269.5 208 40 208z"/></svg>
                  </i>
                {:else}
                  <i class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M80 160c0-35.3 28.7-64 64-64l32 0c35.3 0 64 28.7 64 64l0 3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74l0 1.4c0 17.7 14.3 32 32 32s32-14.3 32-32l0-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7l0-3.6c0-70.7-57.3-128-128-128l-32 0C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>
                  </i>
                {/if}
              </button>
            </div>
          </div>
        </div>

        {#if countdown}
          <p class='text-center mt-5 display-1'>{countdown}</p>
        {/if}
      {:else if gameState === GameState.Timeout}
        <div class='alert alert-secondary mt-5' role='alert'>
          The game timed out (one or both players were disconnected or did not play in time).
        </div>
      {:else if gameState === GameState.Draw}
        <div class='alert alert-secondary mt-5' role='alert'>
          The game is a draw. Both players played <strong class='text-secondary'>{played}</strong>.
        </div>
      {:else if gameState === GameState.Win}
        <div class='alert alert-success mt-5' role='alert'>
          You win with <strong class='text-success'>{played}</strong> against <strong class='text-danger'>{opponentMove}</strong>!
        </div>
      {:else if gameState === GameState.Loss}
        <div class='alert alert-danger mt-5' role='alert'>
          You lose with <strong class='text-danger'>{played}</strong> against <strong class='text-success'>{opponentMove}</strong>.
        </div>
      {/if}
    </div>
  </div>
</main>

<style lang='stylus'>
</style>
