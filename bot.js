require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера (Render его даст)

const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

// Устанавливаем webhook
bot.setWebHook(`${webhookUrl}/bot${token}`);

// Обрабатываем запросы от Telegram
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Отвечаем на сообщения
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Привет, ${msg.from.first_name}! Ты написал: "${msg.text}"`);
});

// Запускаем сервер
app.listen(port, () => {
    console.log(`Бот запущен на порту ${port}`);
});
