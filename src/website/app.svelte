<script lang='ts'>
  import { encodeMessage } from '../common/utils';

  const webSocketUrl = new URL(window.location.href);
  webSocketUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  const ws = new WebSocket(webSocketUrl.toString());

  ws.addEventListener('close', () => {
    console.log('@@@ connection closed');
  });

  ws.addEventListener('message', message => {
    console.log('@@@ message received', message.data);
  });

  ws.addEventListener('open', () => {
    console.log('@@@ connection opened');
    ws.send(encodeMessage({ topic: 'foo', event: 'bar', payload: 42 }));
  });

  export let name: string;
</script>

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href='https://svelte.dev/tutorial'>Svelte tutorial</a> to learn how to build Svelte apps.</p>
</main>

<style lang='stylus' src='./app.styl'>
  main
    text-align center
    padding 1em
    max-width 240px
    margin 0 auto

  h1
    color #ff3e00
    text-transform uppercase
    font-size 4em
    font-weight 100

  @media (min-width: 640px)
    main
      max-width none
</style>
