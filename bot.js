require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера

const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

// Массив пользователей (добавь реальных)
const users = [
  { name: "👤 АРТ", id: 1472395097, username: "Amontearx" },
  { name: "👤 Yargrinders", id: 910176803, username: "Yargrinders" },
  { name: "👤 R.G", id: 284203271, username: "R_G" },
  { name: "👤 nikolai kerankov", id: 7160070476, username: "nikolai" }
];

// Устанавливаем webhook
bot.setWebHook(`${webhookUrl}/bot${token}`);

// Обрабатываем запросы от Telegram
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Команда /start с кнопками
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Кнопки с пользователями
  const keyboard = {
    inline_keyboard: users.map(user => [
      { text: user.name, callback_data: user.id.toString() }
    ])
  };

  bot.sendMessage(chatId, "Выбери пользователя для упоминания:", {
    reply_markup: keyboard
  });
});

// Обработчик нажатий на кнопки
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const userId = parseInt(query.data); 

  // Ищем пользователя по ID
  const user = users.find(u => u.id === userId);

  if (user) {
    if (user.username) {
      // Если у пользователя есть username — тегаем @username
      bot.sendMessage(chatId, `@${user.username}`);
    } else {
      // Если нет username — тегаем через ID (работает в группах)
      bot.sendMessage(chatId, `[${user.name}](tg://user?id=${user.id})`, { parse_mode: "MarkdownV2" });
    }
  } else {
    bot.sendMessage(chatId, "Ошибка: Пользователь не найден.");
  }
});

// Запускаем сервер
app.listen(port, () => {
    console.log(`Бот запущен на порту ${port}`);
});
