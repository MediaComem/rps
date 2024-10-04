// Third-party CSS
import 'bootstrap/dist/css/bootstrap.css';

// Application Styles
import './main.styl';

// Main Application Component
import App from './app.svelte';

// Start the single-page application.
new App({
  target: document.body,
  props: {}
});
