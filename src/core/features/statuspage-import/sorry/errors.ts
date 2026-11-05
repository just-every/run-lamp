/** Why a Sorry read was refused, by kind: Move in shows the message (its English
 * is unchanged), and Business's keyless capture answers by kind alone. */
export type SorryFailure = "restricted" | "invalid" | "unreachable" | "too_large" | "timeout";

export class SorryReadError extends Error {
  kind: SorryFailure;
  constructor(kind: SorryFailure, message: string) {
    super(message);
    this.name = "SorryReadError";
    this.kind = kind;
  }
}
