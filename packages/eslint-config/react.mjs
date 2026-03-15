import nx from '@nx/eslint-plugin';

import baseConfig from './base.mjs';

export default [...baseConfig, ...nx.configs['flat/react-typescript']];
