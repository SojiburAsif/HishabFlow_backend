import app from './app';
import { envVars } from './app/config/env';
import http from 'http';
import { WebSocketHub } from './app/lib/websocket';

async function main() {
  try {
    const server = http.createServer(app);
    WebSocketHub.initializeWebSocketServer(server);

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${envVars.PORT} is already in use. Stop the other backend process before starting a new one.`);
        process.exit(0);
      }

      console.error(err);
      process.exit(1);
    });

    server.listen(envVars.PORT, () => {
      console.log(`Server is running on port ${envVars.PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main();
