# Finance Tracker Bot 🤖💰

A Telegram bot for tracking personal finances, expenses, and income with AI-powered insights.

## Features ✨

- 📊 Track expenses and income
- 💰 Set budgets and financial goals  
- 📈 Generate financial reports
- 🤖 AI-powered financial advice
- 📱 Easy-to-use Telegram interface

## Prerequisites 📋

- Node.js (v16 or higher)
- Telegram account
- Bot token from [@BotFather](https://t.me/botfather)

## Installation 🚀

1. **Clone or download this project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your Telegram bot:**
   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` command
   - Choose a name for your bot (e.g., "Finance Tracker Bot")
   - Choose a username ending with "bot" (e.g., "finance_tracker_bot")
   - Copy the bot token provided

4. **Configure the bot:**
   - Copy `config.example.js` to `config.js`
   - Replace `your_bot_token_here` with your actual bot token
   - Or set the `BOT_TOKEN` environment variable

## Usage 📱

### Starting the bot:
```bash
# Production mode
npm start

# Development mode (with auto-restart)
npm run dev

# Direct bot file
npm run bot
```

### Available Commands:
- `/start` - Start the bot and see welcome message
- `/help` - Show help and available commands
- `/expense <amount> <description>` - Add an expense
- `/income <amount> <description>` - Add income
- `/balance` - Check current balance
- `/report` - Generate financial report

### Example Usage:
```
/expense 25.50 coffee
/income 1000 salary
/balance
```

## Configuration ⚙️

The bot can be configured through:
- Environment variables (recommended for production)
- `config.js` file (for development)

### Environment Variables:
```bash
BOT_TOKEN=your_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
```

## Project Structure 📁

```
finance-bot/
├── bot.js          # Main bot logic and commands
├── index.js        # Entry point
├── config.example.js # Configuration template
├── package.json    # Dependencies and scripts
└── README.md       # This file
```

## Development 🛠️

### Adding New Commands:
Edit `bot.js` and add new command handlers:

```javascript
bot.command('newcommand', (ctx) => {
    ctx.reply('New command response!');
});
```

### Adding New Features:
- Financial data storage (database integration)
- OpenAI integration for financial advice
- Budget tracking and alerts
- Financial analytics and charts

## Troubleshooting 🔧

### Common Issues:

1. **Bot not responding:**
   - Check if the bot token is correct
   - Ensure the bot is running (`npm start`)
   - Check console for error messages

2. **"Unauthorized" error:**
   - Verify your bot token from @BotFather
   - Make sure the token is correctly set in config or environment

3. **Dependencies not found:**
   - Run `npm install` to install missing packages

## Contributing 🤝

Feel free to contribute by:
- Adding new features
- Improving existing functionality
- Fixing bugs
- Enhancing documentation

## License 📄

ISC License - feel free to use this project for personal or commercial purposes.

## Support 💬

If you encounter any issues:
1. Check the console output for error messages
2. Verify your bot token and configuration
3. Ensure all dependencies are properly installed

---

**Happy Finance Tracking! 💰📊**
