import { runResetRealisticCommand } from './lib/realistic-data/index.mjs';

void runResetRealisticCommand().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
