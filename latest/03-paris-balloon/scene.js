import { start } from '../shared/runtime.js';
import { buildParisFlight } from './world.js';

await start({
  title: 'Above Paris — A First Flight',
  background: '#d7d1b0',
  setup: buildParisFlight,
});
