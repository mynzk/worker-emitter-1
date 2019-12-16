import uuid from "uuid/v4";

function encode<T>(data: T): Uint16Array {
  const str = JSON.stringify(data);
  const buf = new ArrayBuffer(str.length * 2);
  const bufView = new Uint16Array(buf);
  bufView.set(str.split("").map((_, i) => str.charCodeAt(i)));
  return bufView;
}

function decode<T = unknown>(buf: ArrayBufferLike): T {
  return JSON.parse(
    String.fromCharCode.apply(
      null,
      (new Uint16Array(buf) as unknown) as number[]
    )
  );
}

export type Data<T = unknown> = {
  id: string;
  type: string | number;
  message: T;
};

export class WorkerEmitter {
  private messageMap: Map<
    string,
    { callback: Function; type: string | number }
  > = new Map();
  constructor(private readonly worker: Worker) {
    worker.onmessage = e => {
      const { data } = e;
      if (!data) return;

      const { id, message } = decode(data);
      const ret = this.messageMap.get(id);
      if (!ret) return;

      ret.callback(message);
    };
  }

  emit<T, U>(type: string | number, message: T): Promise<U> {
    return new Promise(resolve => {
      const id = uuid();
      const data = encode({
        id,
        type,
        message
      });
      this.messageMap.set(id, {
        type,
        callback: (x: U) => {
          resolve(x);
        }
      });
      this.worker.postMessage(data.buffer, [data.buffer]);
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

type WorkerInstance = {
  on(type: string, handler: Function): void;
};

export function register(): WorkerInstance {
  const mapping: Record<string, Function> = {};
  const post = (message: Data): void => {
    const data = encode(message);
    self.postMessage(data.buffer, [data.buffer]);
  };
  self.onmessage = async (e: MessageEvent) => {
    const { data } = e;
    if (!data) return;

    const { type, id, message } = decode(data);

    const result = (await mapping[type](message)) || "done";
    post({ id, type, message: result });
  };

  return {
    on: (type, handler) => {
      mapping[type] = handler;
    }
  };
}
