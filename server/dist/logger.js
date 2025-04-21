"use strict";

// logger.js
const winston = require('winston');

// Create a simple console logger
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp({
      format: 'HH:mm:ss'
    }), winston.format.printf(({
      timestamp,
      level,
      message
    }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }))
  })]
});
module.exports = logger;