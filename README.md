# Worker Emitter

Play with web worker like event.

## Usage

Install

```bash
npm install worker-emitter
```

In worker:
```javascript
import { register } from "worker-emitter";

const worker = register();

worker.on('event-name', async (data) => {
  const name = await handler(data);
  return name; // <- name is 'WorkerEmitter'
});
```

In main thread:

```javascript
import { WorkerEmitter } from "worker-emitter";

const worker = new Worker('path/to/worker.js')

const workerEmitter = new WorkerEmitter(worker);

workerEmitter.emit('event-name', { foo: 'bar' }).then(res => {
  console.log(res); // <- get 'WorkerEmitter'
});
```

## License

[MIT licensed](./LICENSE)
