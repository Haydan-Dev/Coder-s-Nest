import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';

const doc = new Y.Doc();
const wsProvider = new WebsocketProvider('ws://localhost:8000/ws/collaboration/1/123', 'monaco', doc, { WebSocketPolyfill: WebSocket });

wsProvider.on('status', event => {
  console.log('Status:', event.status);
});

wsProvider.on('sync', isSynced => {
  console.log('Synced:', isSynced);
  if (isSynced) {
    const ytext = doc.getText('monaco');
    ytext.insert(0, 'Hello from Node! ');
    console.log('Text after insert:', ytext.toString());
    setTimeout(() => {
        console.log('Final text:', ytext.toString());
        process.exit(0);
    }, 2000);
  }
});

doc.on('update', update => {
    console.log('Doc updated');
});
