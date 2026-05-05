import app from './app';
import { envVars } from './app/config/env';

async function main() {
  try {
    app.listen(envVars.PORT, () => {
      console.log(`Server is running on port ${envVars.PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
