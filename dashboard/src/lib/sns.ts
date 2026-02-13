import { Connection, PublicKey } from "@solana/web3.js";
import {
  resolve,
  reverseLookup,
} from "@bonfida/spl-name-service";

export async function resolveSolDomain(
  connection: Connection,
  domain: string
): Promise<PublicKey | null> {
  try {
    const name = domain.endsWith(".sol")
      ? domain.slice(0, -4)
      : domain;
    const owner = await resolve(connection, name);
    return owner;
  } catch {
    return null;
  }
}

export async function reverseLookupAddress(
  connection: Connection,
  address: PublicKey
): Promise<string | null> {
  try {
    const name = await reverseLookup(connection, address);
    return name ? `${name}.sol` : null;
  } catch {
    return null;
  }
}
