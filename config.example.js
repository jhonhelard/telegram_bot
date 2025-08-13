/**
 * Configuration Example for Finance Tracker Bot
 * Copy this file to config.js and fill in your actual values
 */

module.exports = {
    // Telegram Bot Token (get this from @BotFather)
    botToken: 'your_bot_token_here',
    
    // OpenAI API Key (for future AI features)
    openaiApiKey: 'your_openai_api_key_here',
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Bot settings
    botSettings: {
        username: 'your_bot_username',
        name: 'Finance Tracker Bot'
    }
};
