require('dotenv').config();
const { Telegraf } = require('telegraf');
const config = require('./config');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const axios = require('axios');

// Bot token from configuration
const BOT_TOKEN = process.env.BOT_TOKEN || config.botToken;

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

async function analyzeText(text) {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `
Analiza el siguiente mensaje y determina su categoría. Responde en español con la siguiente estructura JSON:

Para mensajes generales (preguntas no financieras, saludos, etc.):
{
    "category": "general",
    "response": "respuesta relevante al mensaje en español"
}

Para mensajes de transacciones financieras (gastos, ingresos, compras, pagos):
{
    "category": "financial",
    "data": {
        "amount": número,
        "category": "string (ej. Comida, Salario, Facturas)",
        "type": "ingresos" o "gastos",
        "timestamp": "${currentDate}"
    }
}

Para solicitudes de estadísticas financieras (preguntar sobre balance, reportes, resúmenes):
{
    "category": "statistics",
    "response": "statistics_request"
}

Mensaje: "${text}"

Directrices:
- Usa solo "ingresos" o "gastos" para el tipo
- Siempre usa "${currentDate}" para timestamp a menos que se mencione una fecha específica en el mensaje
- Para mensajes financieros, extrae el monto como número
- Categoriza apropiadamente (ej. "comida" -> "Comida", "salario" -> "Salario")
- Si se menciona una fecha específica en el mensaje, usa esa fecha en lugar de "${currentDate}"
- Responde completamente en español
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
    });
    
    return response.choices[0].message.content.trim();
}



// Handle /start command
bot.start((ctx) => {
    const welcomeMessage = `🚀 ¡Bienvenido al Bot de Seguimiento Financiero!\n\nPuedo ayudarte a rastrear tus ingresos y gastos. Esto es lo que puedo hacer:\n\n📊 Rastrear gastos e ingresos\n💰 Establecer presupuestos y metas financieras\n📈 Generar reportes financieros\n🤖 Consejos financieros con IA\n\nUsa /help para ver todos los comandos disponibles.`;
    
    ctx.reply(welcomeMessage);
});

// Handle /help command
bot.help((ctx) => {
    const helpMessage = `📋 Comandos Disponibles:

/start - Iniciar el bot y ver mensaje de bienvenida
/help - Mostrar este mensaje de ayuda
/expense <monto> <descripción> - Agregar un gasto
/income <monto> <descripción> - Agregar ingreso
/balance - Verificar balance actual
/report - Generar reporte financiero

¡Más funciones próximamente! 🚀`;
    
    ctx.reply(helpMessage);
});

// Handle /expense command
bot.command('expense', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);

    // If no args provided, show weekly and monthly expense summary from Google Sheets via n8n
    if (args.length < 2) {
        const raw = await fetchSheetData();
        console.log('/expense fetched records:', raw);

        // Helpers
        const parseYmd = (ts) => {
            const parts = String(ts || '').split('-');
            const y = Number(parts[0]);
            const m = Number(parts[1]);
            const d = Number(parts[2]);
            if (!y || !m || !d) return null;
            return new Date(y, m - 1, d);
        };

        const normalized = raw.map((r) => {
            const amountNumber = typeof r.MONTO === 'string' ? parseFloat(r.MONTO) : Number(r.MONTO);
            const safeAmount = Number.isFinite(amountNumber) ? amountNumber : 0;
            const typeLower = String(r['TIPO DE TRANSACCIÓN'] || '').toLowerCase().trim();
            const dateObj = parseYmd(r['FECHA ']);
            return { amount: safeAmount, type: typeLower, category: r['CATEGORÍA '], timestamp: r['FECHA '], dateObj };
        }).filter((r) => (r.type === 'expense' || r.type === 'gastos') && r.dateObj instanceof Date && !isNaN(r.dateObj));

        const today = new Date();
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

        const isWithin = (d, start, end) => d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && d <= new Date(end.getFullYear(), end.getMonth(), end.getDate());

        const weekly = normalized.filter((r) => isWithin(r.dateObj, weekStart, weekEnd));
        const monthly = normalized.filter((r) => r.dateObj.getFullYear() === today.getFullYear() && r.dateObj.getMonth() === today.getMonth());

        const sum = (arr) => arr.reduce((s, r) => s + r.amount, 0);
        const weeklyTotal = sum(weekly);
        const monthlyTotal = sum(monthly);

        const formatDate = (d) => d.toISOString().split('T')[0];
        const weeklyLines = weekly.length
            ? weekly
                  .sort((a, b) => a.dateObj - b.dateObj)
                  .map((r) => `- $${r.amount.toFixed(2)} • ${r.category} (${r.timestamp})`) 
                  .join('\n')
            : '- No expense records this week';

        const message = `💸 Resumen de Gastos\n\n🗓️ Esta Semana (${formatDate(weekStart)} → ${formatDate(weekEnd)}): $${weeklyTotal.toFixed(2)}\n${weeklyLines}\n\n📅 Este Mes (${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}): $${monthlyTotal.toFixed(2)}`;
        return ctx.reply(message);
    }

    // Otherwise, treat as adding a new expense entry (amount + description)
    const amount = parseFloat(args[0]);
    const description = args.slice(1).join(' ');
    
    if (isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Por favor proporciona un monto válido y positivo.');
    }
    
    // Fetch and log current sheet data via n8n (for context)
    const records = await fetchSheetData();
    console.log('/expense fetched records (after add):', records);

    // Acknowledge the manual expense entry
    ctx.reply(`💸 Gasto registrado: $${amount.toFixed(2)} - ${description}`);
});

// Handle /income command
bot.command('income', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);

    // If no args provided, show weekly and monthly income summary from Google Sheets via n8n
    if (args.length < 2) {
        const raw = await fetchSheetData();
        console.log('/income fetched records:', raw);

        // Helpers
        const parseYmd = (ts) => {
            const parts = String(ts || '').split('-');
            const y = Number(parts[0]);
            const m = Number(parts[1]);
            const d = Number(parts[2]);
            if (!y || !m || !d) return null;
            return new Date(y, m - 1, d);
        };

        const normalized = raw.map((r) => {
            const amountNumber = typeof r.MONTO === 'string' ? parseFloat(r.MONTO) : Number(r.MONTO);
            const safeAmount = Number.isFinite(amountNumber) ? amountNumber : 0;
            const typeLower = String(r['TIPO DE TRANSACCIÓN'] || '').toLowerCase().trim();
            const dateObj = parseYmd(r['FECHA ']);
            return { amount: safeAmount, type: typeLower, category: r['CATEGORÍA '], timestamp: r['FECHA '], dateObj };
        }).filter((r) => (r.type === 'income' || r.type === 'ingresos') && r.dateObj instanceof Date && !isNaN(r.dateObj));

        const today = new Date();
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

        const isWithin = (d, start, end) => d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && d <= new Date(end.getFullYear(), end.getMonth(), end.getDate());

        const weekly = normalized.filter((r) => isWithin(r.dateObj, weekStart, weekEnd));
        const monthly = normalized.filter((r) => r.dateObj.getFullYear() === today.getFullYear() && r.dateObj.getMonth() === today.getMonth());

        const sum = (arr) => arr.reduce((s, r) => s + r.amount, 0);
        const weeklyTotal = sum(weekly);
        const monthlyTotal = sum(monthly);

        const formatDate = (d) => d.toISOString().split('T')[0];
        const weeklyLines = weekly.length
            ? weekly
                  .sort((a, b) => a.dateObj - b.dateObj)
                  .map((r) => `- $${r.amount.toFixed(2)} • ${r.category} (${r.timestamp})`) 
                  .join('\n')
            : '- No income records this week';

        const message = `💰 Resumen de Ingresos\n\n🗓️ Esta Semana (${formatDate(weekStart)} → ${formatDate(weekEnd)}): $${weeklyTotal.toFixed(2)}\n${weeklyLines}\n\n📅 Este Mes (${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}): $${monthlyTotal.toFixed(2)}`;
        return ctx.reply(message);
    }

    // Otherwise, treat as adding a new income entry (amount + description)
    const amount = parseFloat(args[0]);
    const description = args.slice(1).join(' ');
    
    if (isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Por favor proporciona un monto válido y positivo.');
    }
    
    // Fetch and log current sheet data via n8n
    const records = await fetchSheetData();
    console.log('/income fetched records (after add):', records);

    // Acknowledge the manual income entry
    ctx.reply(`💰 Ingreso registrado: $${amount.toFixed(2)} - ${description}`);
});

// Handle /balance command
bot.command('balance', async (ctx) => {
    // Fetch data
    const raw = await fetchSheetData();
    console.log('/balance fetched records:', raw);

    // Helpers
    const parseYmd = (ts) => {
        const parts = String(ts || '').split('-');
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        const d = Number(parts[2]);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    };

    const normalized = raw.map((r) => {
        const amountNumber = typeof r.MONTO === 'string' ? parseFloat(r.MONTO) : Number(r.MONTO);
        const amount = Number.isFinite(amountNumber) ? amountNumber : 0;
        const type = String(r['TIPO DE TRANSACCIÓN'] || '').toLowerCase().trim();
        const dateObj = parseYmd(r['FECHA ']);
        return { amount, type, category: r['CATEGORÍA '], timestamp: r['FECHA '], dateObj };
    }).filter((r) => r.dateObj instanceof Date && !isNaN(r.dateObj));

    // Week range (Mon-Sun) containing today
    const today = new Date();
    const day = today.getDay(); // 0 Sun - 6 Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

    const isWithin = (d, start, end) => d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && d <= new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const weekly = normalized.filter((r) => isWithin(r.dateObj, weekStart, weekEnd));
    const monthly = normalized.filter((r) => r.dateObj.getFullYear() === today.getFullYear() && r.dateObj.getMonth() === today.getMonth());

    const sumByType = (arr, t) => arr.filter((r) => r.type === t || r.type === (t === 'income' ? 'ingresos' : 'gastos')).reduce((s, r) => s + r.amount, 0);

    const weeklyIncome = sumByType(weekly, 'income');
    const weeklyExpenses = sumByType(weekly, 'expense');
    const weeklyBalance = weeklyIncome - weeklyExpenses;

    const monthlyIncome = sumByType(monthly, 'income');
    const monthlyExpenses = sumByType(monthly, 'expense');
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    const formatDate = (d) => d.toISOString().split('T')[0];

    const message = `💳 Resumen de Balance\n\n🗓️ Esta Semana (${formatDate(weekStart)} → ${formatDate(weekEnd)})\n- Ingresos: $${weeklyIncome.toFixed(2)}\n- Gastos: $${weeklyExpenses.toFixed(2)}\n- Balance: $${weeklyBalance.toFixed(2)}\n\n📅 Este Mes (${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')})\n- Ingresos: $${monthlyIncome.toFixed(2)}\n- Gastos: $${monthlyExpenses.toFixed(2)}\n- Balance: $${monthlyBalance.toFixed(2)}`;

    ctx.reply(message);
});

// Handle /report command
bot.command('report', async (ctx) => {
    // Fetch data from n8n and log it
    const records = await fetchSheetData();

    // Aggregate totals
    const normalized = records.map((r) => {
        const amountNumber = typeof r.MONTO === 'string' ? parseFloat(r.MONTO) : Number(r.MONTO);
        const safeAmount = Number.isFinite(amountNumber) ? amountNumber : 0;
        const typeLower = String(r['TIPO DE TRANSACCIÓN'] || '').toLowerCase().trim();
        return { amount: safeAmount, type: typeLower, category: r['CATEGORÍA '], timestamp: r['FECHA '], row_number: r.row_number };
    });

    const totalIncome = normalized
        .filter((r) => r.type === 'income' || r.type === 'ingresos')
        .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = normalized
        .filter((r) => r.type === 'expense' || r.type === 'gastos')
        .reduce((sum, r) => sum + r.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Build recent transactions list (last 5)
    const sorted = normalized.slice().sort((a, b) => (a.row_number ?? 0) - (b.row_number ?? 0));
    const recent = sorted.slice(-5).reverse();
    const recentLines = recent.length
        ? recent
              .map((r) => {
                  const emoji = (r.type === 'income' || r.type === 'ingresos') ? '💰' : '💸';
                  return `${emoji} $${r.amount.toFixed(2)} - ${r.category} (${r.timestamp})`;
              })
              .join('\n')
        : '- No se han registrado transacciones aún';

    const reportMessage = `📊 Reporte Financiero

💰 Balance Actual: $${balance.toFixed(2)}
📈 Total de Ingresos: $${totalIncome.toFixed(2)}
📉 Total de Gastos: $${totalExpenses.toFixed(2)}

📋 Transacciones Recientes:
${recentLines}

💡 ¡Usa los comandos /expense, /income o /balance para comenzar a rastrear tus finanzas!`;
    
    ctx.reply(reportMessage);
});

// Function to send financial data to n8n webhook
async function sendToN8n(data) {
    console.log(data,"datadata");
    
    try {
        const webhookUrl = 'https://jhonhelard951112.app.n8n.cloud/webhook/77e99372-1a70-4916-9783-05f96e8b8a77';
        const response = await axios.post(webhookUrl, data);
        console.log('Data sent to n8n successfully:', response.status);
        return true;
    } catch (error) {
        console.error('Failed to send data to n8n:', error.message);
        return false;
    }
}

// Function to fetch sheet data via n8n webhook
async function fetchSheetData() {
    try {
        const url = 'https://jhonhelard951112.app.n8n.cloud/webhook/868d2bdb-b3ff-44b2-9458-adadd915202f';
        const { data, status } = await axios.get(url);
        console.log('n8n fetch status:', status);
        console.log('n8n fetch data:', data);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
    } catch (error) {
        console.error('Failed to fetch data from n8n:', error.message);
        return [];
    }
}
 
// Function to process and categorize messages
async function processMessage(userMessage) {
    let analysisRaw;
    try {
        analysisRaw = await analyzeText(userMessage);
        const analysis = JSON.parse(analysisRaw);
        
        return analysis;
    } catch (error) {
        console.error('Message processing error:', error);
        if (analysisRaw) {
            console.error('OpenAI response:', analysisRaw);
        }
        return null;
    }
}



bot.on('text', async (ctx) => {
    try {
        const userMessage = ctx.message.text;
        if (userMessage.startsWith('/')) {
            return;
        }
        
        const result = await processMessage(userMessage);
        
        if (!result) {
            await ctx.reply("Lo siento, no pudimos procesar ese mensaje. Por favor intenta de nuevo.");
            return;
        }
        console.log(result, 'result');
        
        // Handle different message categories
        switch (result.category) {
            case 'general':
                await ctx.reply(result.response);
                break;
                
            case 'financial':
                // Extract financial data
                const { amount, category, type, timestamp } = result.data;
                
                // Send data to n8n webhook with Spanish column names
                const dataSent = await sendToN8n({ 
                    MONTO: amount, 
                    'CATEGORÍA ': category, 
                    'TIPO DE TRANSACCIÓN': type, 
                    'FECHA ': timestamp 
                });
                
                const emoji = (type === 'income' || type === 'ingresos') ? '💰' : '💸';
                const typeText = (type === 'income' || type === 'ingresos') ? 'Ingreso' : 'Gasto';
                const statusEmoji = dataSent ? '✅' : '⚠️';
                const statusText = dataSent ? 'guardado' : 'registrado (no guardado)';
                
                await ctx.reply(`${emoji} ${typeText} ${statusText}: $${amount.toFixed(2)} - ${category} (${timestamp}) ${statusEmoji}`);
                break;
                
            case 'statistics':
                // Display the same content as /report command
                const reportMessage = `📊 Reporte Financiero

                💰 Balance Actual: $0.00
                📈 Total de Ingresos: $0.00
                📉 Total de Gastos: $0.00

                📋 Transacciones Recientes:
                - No se han registrado transacciones aún

                💡 ¡Usa los comandos /expense o /income para comenzar a rastrear tus finanzas!`;
                                await ctx.reply(reportMessage);
                                break;
                                
                            default:
                                await ctx.reply("Lo siento, no pudimos procesar ese mensaje. Por favor intenta de nuevo.");
            }
        
    } catch (error) {
        console.error('OpenAI analysis failed:', error);
        await ctx.reply('❌ No se pudo analizar tu mensaje en este momento.');
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Lo siento, algo salió mal. Por favor intenta de nuevo más tarde.');
});

// Launch the bot
console.log('🤖 Starting Finance Tracker Bot...');
bot.launch()
    .then(() => {
        console.log('✅ Bot is running successfully!');
        console.log('📱 Send /start to your bot in Telegram to test it.');
    })
    .catch((error) => {
        console.error('❌ Failed to start bot:', error.message);
        if (error.message.includes('Unauthorized')) {
            console.error('💡 Make sure you have set the correct BOT_TOKEN in your environment variables or bot.js file.');
        }
    });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
