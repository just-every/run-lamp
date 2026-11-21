import { isIP } from "node:net";

function parseAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    const value = address.split(".").reduce((bits, octet) => (bits << 8n) | BigInt(octet), 0n);
    return { width: 32, value };
  }
  // Zone identifiers describe local interfaces and are not connection addresses.
  if (family !== 6 || address.includes("%")) return null;
  // The URL parser writes IPv4-embedded IPv6 as hex groups and compresses zeros.
  const canonical = new URL(`http://[${address}]`).hostname.slice(1, -1);
  const [left, right] = canonical.split("::");
  const start = left ? left.split(":") : [];
  const end = right ? right.split(":") : [];
  const groups = right === undefined ? start : [...start, ...Array<string>(8 - start.length - end.length).fill("0"), ...end];
  const value = groups.reduce((bits, group) => (bits << 16n) | BigInt("0x" + group), 0n);
  return { width: 128, value };
}

function parseRange(cidr: string) {
  const [address, prefix, extra] = cidr.split("/");
  if (extra !== undefined || !/^(0|[1-9][0-9]{0,2})$/.test(prefix ?? "")) return null;
  const parsed = parseAddress(address);
  if (!parsed || Number(prefix) > parsed.width) return null;
  return { ...parsed, hostBits: BigInt(parsed.width - Number(prefix)) };
}

export function validStaffCidr(cidr: string) {
  return parseRange(cidr) !== null;
}

export function staffCidrAllows(address: string, cidrs: readonly string[]) {
  const parsed = parseAddress(address);
  if (!parsed) return false;
  return cidrs.some(cidr => {
    const range = parseRange(cidr);
    return range !== null && range.width === parsed.width
      && (parsed.value >> range.hostBits) === (range.value >> range.hostBits);
  });
}
