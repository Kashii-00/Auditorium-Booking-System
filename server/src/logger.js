// logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    // Log to file
    new transports.File({ filename: path.join(__dirname, '../logs/server.log'), maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    // Log to console (PowerShell/terminal)
    new transports.Console()
  ]
});

module.exports = logger;
