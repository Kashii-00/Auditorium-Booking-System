// server/src/logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');

// Color definitions
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  orange: '\x1b[38;5;208m',
  purple: '\x1b[38;5;99m',
  gold: '\x1b[38;5;220m',
  lime: '\x1b[38;5;154m',
  teal: '\x1b[38;5;30m'
};

// Custom format for colored console output
const coloredFormat = format.printf(({ timestamp, level, message, color, emoji }) => {
  const colorCode = colors[color] || colors.white;
  const emojiIcon = emoji || '';
  return `${colorCode}[${timestamp}] ${level.toUpperCase()}: ${emojiIcon}${message}${colors.reset}`;
});

// Plain format for file logging (no colors)
const plainFormat = format.printf(({ timestamp, level, message, emoji }) => {
  const emojiIcon = emoji || '';
  return `[${timestamp}] ${level.toUpperCase()}: ${emojiIcon}${message}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true })
  ),
  transports: [
    // Log to file (no colors)
    new transports.File({ 
      filename: path.join(__dirname, '../logs/server.log'), 
      maxsize: 5 * 1024 * 1024, 
      maxFiles: 5,
      format: plainFormat
    }),
    // Log to console (with colors)
    new transports.Console({
      format: coloredFormat
    })
  ]
});

// Enhanced logger with color methods
const enhancedLogger = {
  info: (message, options = {}) => {
    logger.info(message, { color: options.color || 'lime', emoji: options.emoji });
  },
  error: (message, options = {}) => {
    logger.error(message, { color: options.color || 'red', emoji: options.emoji });
  },
  warn: (message, options = {}) => {
    logger.warn(message, { color: options.color || 'yellow', emoji: options.emoji });
  },
  debug: (message, options = {}) => {
    logger.debug(message, { color: options.color || 'cyan', emoji: options.emoji });
  },
  
  // Predefined colored log methods
  success: (message) => logger.info(message, { color: 'green', emoji: '✅' }),
  email: (message) => logger.info(message, { color: 'purple', emoji: '📧' }),
  NESH: (message) => logger.info(message, { color: 'orange', emoji: '⚡' }),
  security: (message) => logger.info(message, { color: 'red', emoji: '��' }),
};

module.exports = enhancedLogger;