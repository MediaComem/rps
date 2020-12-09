<script lang='typescript'>
  import Lobby from './lobby.svelte';
  import { WebSocketConnectionState, webSocketStore } from './ws';
</script>

<main>
  <nav class='navbar navbar-expand-lg navbar-dark bg-dark fixed-top'>
    <div class='container-fluid'>
      <a class='navbar-brand' href='/'>Rock Paper Scissors</a>
      <span class='navbar-text' class:text-success='{$webSocketStore.connection === WebSocketConnectionState.Connected}' class:text-danger='{$webSocketStore.connection !== WebSocketConnectionState.Connected}'>
        {$webSocketStore.connection === WebSocketConnectionState.Connected ? 'Online' : 'Offline'}
      </span>
    </div>
  </nav>
  <Lobby />
</main>

<style lang='stylus'>
</style>
