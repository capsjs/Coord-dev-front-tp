import { createApp } from './app.js';
import { config } from './config.js';
import { migrate, pool, waitForDb } from './db.js';
import { seedAdmin, seedDemo } from './seed.js';

await waitForDb();
await migrate();
await seedAdmin();
if (config.seedDemo) await seedDemo();

const server = createApp().listen(config.port, () => {
  console.log(`[api] Serveur démarré sur http://localhost:${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
