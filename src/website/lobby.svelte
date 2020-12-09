<script lang='typescript'>
  import { writable } from 'svelte/store';

  let form = writable('');

  $: enabled = $form.trim().length >= 1;

  function submit() {
    console.log('Submit:', $form);
  }
</script>

<main>
  <div class='container'>
    <div class='row'>

      <!-- Player -->
      <div class='col'>
        <h2>Who are you?</h2>
        <form on:submit|preventDefault={submit}>
          <div class='mb-3'>
            <label for='player-name' class='form-label'>Player name</label>
            <input type='string' class='form-control' id='player-name' aria-describedby='player-name-help' bind:value='{$form}'>
            <div id='player-name-help' class='form-text'>Your name will be publicly visible during a game and in the game history.</div>
          </div>
          <button type='submit' class='btn btn-success' disabled='{!enabled}'>New game</button>
        </form>
      </div>

      <!-- Games waiting for players -->
      <div class='col'>
        <h2>Join a game</h2>
        <div class='list-group'>
          <button class='list-group-item list-group-item-action' aria-current='true' type='button'>
            <div class='d-flex w-100 justify-content-between'>
              <h5 class='mb-1'>Alice</h5>
              <small>3 days ago</small>
            </div>
            <p class='mb-1'>Donec id elit non mi porta gravida at eget metus.</p>
          </button>
          <button class='list-group-item list-group-item-action' aria-current='true' type='button'>
            <div class='d-flex w-100 justify-content-between'>
              <h5 class='mb-1'>Bob</h5>
              <small>3 days ago</small>
            </div>
            <p class='mb-1'>Maecenas sed diam eget risus varius blandit.</p>
          </button>
        </div>
      </div>

    </div>
  </div>
</main>

<style lang='stylus'>
</style>
