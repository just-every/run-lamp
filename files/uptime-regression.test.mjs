import { test } from 'node:test';
import { uptimeCorrectionJourney } from '/workspace/run-lamp/tests/e2e/helpers/uptime-correction-journey.mjs';
test('shared uptime correction journey', { timeout: 180_000 }, uptimeCorrectionJourney);
