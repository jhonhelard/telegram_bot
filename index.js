#!/usr/bin/env node

/**
 * Finance Tracker Bot - Main Entry Point
 * A Telegram bot for tracking personal finances
 */

console.log('🚀 Finance Tracker Bot Starting...');

// Load environment variables if .env file exists
try {
    require('dotenv').config();
} catch (error) {
    console.log('📝 No .env file found, using default configuration');
}

// Import and run the bot
try {
    require('./bot.js');
} catch (error) {
    console.error('❌ Failed to start bot1:', error.message);
    process.exit(1);
}
