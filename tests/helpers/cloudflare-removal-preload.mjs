import './cloudflare-edge-preload.mjs';
import https from 'node:https';
import http from 'node:http';

// R2's opaque object paths deliberately use https.request rather than fetch.
// Route that one provider to the same loopback fake, preserving the raw path.
https.request = (options, callback) => {
  const edge = new URL(process.env.LAMP_FAKE_EDGE);
  if (options.hostname !== 'api.cloudflare.com' || edge.hostname !== '127.0.0.1') throw new Error('Outside the fake removal edge');
  return http.request({...options, protocol: 'http:', hostname: edge.hostname, port: edge.port,
    path: `/__edge/api.cloudflare.com${options.path}`}, callback);
};
