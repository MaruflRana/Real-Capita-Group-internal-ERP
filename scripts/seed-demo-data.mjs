import { runSeedDemoCommand } from './lib/demo-data.mjs';

void runSeedDemoCommand().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
