import pino from "pino";

/**
 * Creates a logger that automatically switches between
 * pretty-print (for local development) and JSON (for production).
 */
const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,         
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname"  
          }
        },
        level: "debug"
      }
    : {
        level: "info" 
      }
);
