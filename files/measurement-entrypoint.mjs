import { main } from './harness/node_modules/@runeditrun/rer/cli/main.mjs';
process.exitCode = await main(process.argv.slice(2));
