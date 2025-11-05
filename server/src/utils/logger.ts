import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL ?? "info";

let transport: pino.ThreadStream;

if (isDev) {
  try {
    // Try to use pino-pretty if available (typically in dev environments)
    transport = pino.transport({
      target: "pino-pretty",
      options: { colorize: true, singleLine: true },
    });
  } catch (_e) {
    // pino-pretty not available, fall back to default
    transport = undefined;
  }
}

const log = transport ? pino({ level }, transport) : pino({ level });

export default log;
