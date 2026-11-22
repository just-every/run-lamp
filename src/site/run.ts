import { checkRunData, type RunData } from '../base/run-site';
import { runPricing } from '../base/run-pricing';
import release from '../../RELEASE.json';

export const run: RunData = checkRunData({
  name: 'Lamp',
  repository: 'https://github.com/just-every/run-lamp',
  clone: 'npx -y @runeditrun/rer dev just-every/run-lamp',
  releaseTag: `v${release.version}`,
  licence: 'MIT',
  docs: true,
  paths: { product: null },
  pricing: runPricing,
});
