import { runResetDemoCommand } from './lib/demo-data.mjs';

void runResetDemoCommand().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
