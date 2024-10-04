<script lang='typescript'>
import { Game, gameCountdownMessageCodec, gameDoneMessageCodec, gameJoinedMessageCodec, gameMovePlayedMessageCodec, Move, Player } from '../common/messages';

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
                <i class='fa-solid fa-hand-rock' />
                Rock
              </button>
              <button type='button' class='btn' class:btn-outline-primary='{!played}' class:btn-outline-secondary='{played && played !== "paper"}' class:btn-primary='{played === "paper"}' disabled='{!canPlay}' on:click={() => play('paper')}>
                <i class='fa-solid fa-hand-paper' />
                Paper
              </button>
              <button type='button' class='btn' class:btn-outline-primary='{!played}' class:btn-outline-secondary='{played && played !== "scissors"}' class:btn-primary='{played === "scissors"}' disabled='{!canPlay}' on:click={() => play('scissors')}>
                <i class='fa-solid fa-hand-scissors' />
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
                <i class='fa-solid' class:fa-question-circle='{!opponentMove || opponentMove !== "rock"}' class:fa-hand-rock='{opponentMove === "rock"}' />
              </button>
              <button type='button' class='btn' disabled class:btn-outline-primary='{opponentMove !== "paper"}' class:btn-primary='{opponentMove === "paper"}'>
                <i class='fa-solid' class:fa-question-circle='{!opponentMove || opponentMove !== "paper"}' class:fa-hand-paper='{opponentMove === "paper"}' />
              </button>
              <button type='button' class='btn' disabled class:btn-outline-primary='{opponentMove !== "scissors"}' class:btn-primary='{opponentMove === "scissors"}'>
                <i class='fa-solid' class:fa-question-circle='{!opponentMove || opponentMove !== "scissors"}' class:fa-hand-paper='{opponentMove === "scissors"}' />
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
