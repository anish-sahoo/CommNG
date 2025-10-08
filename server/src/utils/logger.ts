import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL ?? "info";

const transport = isDev
  ? pino.transport({
      target: "pino-pretty",
      options: { colorize: true, singleLine: true },
    })
  : undefined;

const log = transport ? pino({ level }, transport) : pino({ level });

export default log;
