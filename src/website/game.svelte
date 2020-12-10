<script lang='typescript'>
import { Game, gameCountdownMessageCodec, gameDoneMessageCodec, gameJoinedMessageCodec, Move, Player } from '../common/messages';

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

$: adversary = getAdversary($currentGame, $currentPlayer);

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
  const opposingMove = game.players[0].id === player.id ? msg.payload.moves[1] : msg.payload.moves[0];
  if (ownMove && opposingMove && ownMove === opposingMove) {
    gameState = GameState.Draw;
  } else if (ownMove && opposingMove) {
    gameState = winsOver[ownMove] === opposingMove ? GameState.Win : GameState.Loss;
  } else {
    gameState = GameState.Timeout;
  }
});

function getAdversary(game: Game | null, player?: Player) {
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

<main>
  <div class='container'>
    <div class='row'>
      {#if gameState === GameState.WaitingForPlayer}
        <h2 class='mt-3'>Waiting for another player to join</h2>
      {:else}
        <h2 class='mt-3'>You are playing against {adversary?.name}</h2>
      {/if}

      {#if gameState === GameState.Ongoing}
        <p>The game is about to start!</p>
      {:else if gameState === GameState.CountingDown}
        <div class='offset-lg-3 col-6 d-flex'>
          <div class='btn-group btn-group-lg mt-2 flex-fill' role='group' aria-label='Play'>
            <button type='button' class='btn btn-outline-primary' on:click={() => play('rock')}>
              <i class='fas fa-hand-rock' />
              Rock
            </button>
            <button type='button' class='btn btn-outline-primary' on:click={() => play('paper')}>
              <i class='fas fa-hand-paper' />
              Paper
            </button>
            <button type='button' class='btn btn-outline-primary' on:click={() => play('scissors')}>
              <i class='fas fa-hand-scissors' />
              Scissors
            </button>
          </div>
        </div>
        <p class='text-center mt-5 display-1'>{countdown}</p>
      {:else if gameState === GameState.Timeout}
        <div class='alert alert-secondary' role='alert'>
          The game timed out (one or both players did not play in time).
        </div>
      {:else if gameState === GameState.Draw}
        <div class='alert alert-secondary' role='alert'>
          The game is a draw.
        </div>
      {:else if gameState === GameState.Win}
        <div class='alert alert-success' role='alert'>
          You win!
        </div>
      {:else if gameState === GameState.Loss}
        <div class='alert alert-danger' role='alert'>
          You lose.
        </div>
      {/if}
    </div>
  </div>
</main>

<style lang='stylus'>
</style>
