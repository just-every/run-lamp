import { checkRunData, type RunData } from '../base/run-site';
import { runPricing } from '../base/run-pricing';

const repository = 'https://github.com/just-every/run-lamp';
const latestRelease = `${repository}/releases/latest`;
// GitHub's latest-release redirect follows publication, including when main
// already carries metadata for the next version.
const findRelease = String.raw`LAMP_TAG=$(curl -fsSI -o /dev/null -w '%{redirect_url}' ${latestRelease} | sed -nE 's|.*/releases/tag/(v[0-9]+\.[0-9]+\.[0-9]+)$|\1|p') && test -n "$LAMP_TAG"`;
// Older released rer pins also need time for a cold browser download.
const releaseCheckout = `${findRelease} && git clone --branch "$LAMP_TAG" --single-branch ${repository}.git run-lamp && (cd run-lamp && RER_OWNER_READY_TIMEOUT_MS=300000 "$HOME/.local/bin/rer" dev)`;

export const run: RunData = checkRunData({
  name: 'Lamp',
  repository,
  clone: 'npx -y @runeditrun/rer dev just-every/run-lamp',
  releaseCheckout,
  licence: 'MIT',
  docs: true,
  paths: { product: null },
  pricing: runPricing,
});

export async function publishedLampTag(): Promise<string> {
  const response = await fetch(latestRelease, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8000) });
  const location = response.headers.get('location');
  const prefix = `${repository}/releases/tag/`;
  const tag = location?.startsWith(prefix) ? location.slice(prefix.length) : '';
  if (response.status !== 302 || !/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error(`GitHub's latest release for Lamp did not resolve to a stable release tag (HTTP ${response.status}).`);
  }
  return tag;
}
