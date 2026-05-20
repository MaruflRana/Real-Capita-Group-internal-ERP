console.warn('\n⚠️  DEPRECATION WARNING: `seed:demo:verify` is deprecated. Use `seed:realistic:verify` instead.\n     The realistic verify command checks volume, contamination, timeline, and cross-module chains.\n');

import { runVerifyRealisticCommand } from './lib/realistic-data/index.mjs';

void runVerifyRealisticCommand().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
