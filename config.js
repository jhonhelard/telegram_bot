/**
 * Configuration for Finance Tracker Bot
 * This file contains your actual bot configuration
 */

module.exports = {
    // Telegram Bot Token (from @BotFather)
    botToken: '7688402540:AAFKH9mIelc-afslbCo7h9mAbdQQSfhN330',
    
    // OpenAI API Key (for future AI features)
    openaiApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Bot settings
    botSettings: {
        username: 'KelvinMa_Finance_bot',
        name: 'Finance Tracker Bot'
    }
};
