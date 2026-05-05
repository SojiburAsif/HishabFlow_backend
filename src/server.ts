import app from './app';
import { envVars } from './app/config/env';
import http from 'http';
import { WebSocketHub } from './app/lib/websocket';

async function main() {
  try {
    const server = http.createServer(app);
    WebSocketHub.initializeWebSocketServer(server);

    server.listen(envVars.PORT, () => {
      console.log(`Server is running on port ${envVars.PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
