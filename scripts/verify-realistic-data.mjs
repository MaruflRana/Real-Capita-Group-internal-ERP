import { runVerifyRealisticCommand } from './lib/realistic-data/index.mjs';

void runVerifyRealisticCommand().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
