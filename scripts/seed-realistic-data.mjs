import { runSeedRealisticCommand } from './lib/realistic-data/index.mjs';

void runSeedRealisticCommand().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
