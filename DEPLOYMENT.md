# Deployment Guide 🚀

This guide will help you deploy your Finance Tracker Bot to various hosting platforms.

## Prerequisites 📋

Before deploying, make sure you have:
1. A Telegram bot token from [@BotFather](https://t.me/botfather)
2. An OpenAI API key (optional, for AI features)
3. Your code pushed to a Git repository (GitHub, GitLab, etc.)

## Environment Variables 🔧

Set these environment variables in your hosting platform:

```bash
BOT_TOKEN=your_actual_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
NODE_ENV=production
```

## Deployment Options 🌐

### 1. Railway (Recommended) 🚂

**Pros:** Easy deployment, free tier, automatic HTTPS
**Best for:** Quick deployment and development

#### Steps:
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in the "Variables" tab
6. Deploy! Your bot will be live in minutes

### 2. Render 🎨

**Pros:** Free tier, easy setup, good documentation
**Best for:** Budget-friendly hosting

#### Steps:
1. Go to [render.com](https://render.com)
2. Sign up and connect your GitHub account
3. Click "New" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name:** `finance-tracker-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add environment variables
7. Deploy!

### 3. Heroku ☁️

**Pros:** Reliable, good free tier (with limitations)
**Best for:** Production applications

#### Steps:
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app: `heroku create your-bot-name`
4. Set environment variables:
   ```bash
   heroku config:set BOT_TOKEN=your_token
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku main`

### 4. Vercel ⚡

**Pros:** Fast, serverless, great for bots
**Best for:** Serverless architecture

#### Steps:
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Configure environment variables
5. Deploy!

### 5. DigitalOcean App Platform 🌊

**Pros:** Reliable, scalable, good performance
**Best for:** Production applications

#### Steps:
1. Go to [DigitalOcean](https://digitalocean.com)
2. Create account and add payment method
3. Go to "Apps" → "Create App"
4. Connect your GitHub repository
5. Configure environment variables
6. Deploy!

## Post-Deployment Checklist ✅

After deploying, verify:

1. **Bot is running:**
   - Check your hosting platform's logs
   - Send `/start` to your bot on Telegram

2. **Environment variables:**
   - Verify `BOT_TOKEN` is set correctly
   - Test basic commands like `/help`

3. **Monitoring:**
   - Set up uptime monitoring (UptimeRobot, etc.)
   - Check logs regularly

## Troubleshooting 🔧

### Common Issues:

1. **Bot not responding:**
   - Check if the service is running
   - Verify bot token is correct
   - Check platform logs for errors

2. **Environment variables not working:**
   - Restart the service after adding variables
   - Check variable names (case-sensitive)

3. **Service keeps crashing:**
   - Check memory limits on free tiers
   - Review error logs
   - Ensure all dependencies are in `package.json`

## Security Best Practices 🔒

1. **Never commit sensitive data:**
   - Keep `.env` files out of Git
   - Use environment variables for secrets

2. **Use HTTPS:**
   - Most platforms provide this automatically
   - Verify your bot uses secure connections

3. **Regular updates:**
   - Keep dependencies updated
   - Monitor for security patches

## Cost Considerations 💰

### Free Tiers:
- **Railway:** $5/month after free tier
- **Render:** Free tier available
- **Heroku:** Free tier discontinued
- **Vercel:** Generous free tier
- **DigitalOcean:** $5/month minimum

### Recommendations:
- **Development:** Railway or Render
- **Production:** DigitalOcean or Railway
- **Budget:** Render or Vercel

## Support 🆘

If you encounter issues:
1. Check the platform's documentation
2. Review error logs
3. Test locally first
4. Join platform-specific communities

---

**Happy Deploying! 🚀** 