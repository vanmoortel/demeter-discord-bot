import {format} from "logform"
import winston from "winston"
const { createLogger, transports } = winston
/**
 * Create a winston logger with console logging in dev, in prod everything is logged in an error file and combined file.
 * @type {winston.Logger}
 */
const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({stack: true}),
        format.splat(),
        format.json()
    ),
    defaultMeta: {service: 'self-managed-discord'},
    transports: process.env.NODE_ENV !== 'production' ? [
            new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            })
        ]
        :
        [
            new transports.File({ dirname: 'log', filename: 'self-managed-discord-error.log', level: 'error'}),
            new transports.File({ dirname: 'log', filename: 'self-managed-discord-combined.log', level: 'info'})
        ]
})
export default logger