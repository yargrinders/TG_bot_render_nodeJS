require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера

const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

// Основной массив пользователей (обычные и скрытые)
const users = [
  { name: "👤 Иван", id: 123456789, username: "ivan_username" },
  { name: "👤 Мария", id: 987654321, username: "maria_username" },
  { name: "👤 Алексей", id: 112233445, username: "alexey_username" },
  { name: "👤 Ольга", id: 556677889, username: "olga_username" },
  { name: "👤 Дмитрий", id: 998877665, username: "dmitry_username" },
  { name: "👤 Елена", id: 223344556, username: "elena_username" },
  { name: "👤 🔒 Тайный Агент", id: 111222333, username: "secret_agent" },
  { name: "👤 🔒 Неизвестный", id: 444555666, username: "unknown_user" }
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

  // Создаём кнопки для всех пользователей
  const keyboard = {
    inline_keyboard: users.map(user => [
      { text: user.name, callback_data: user.username }
    ])
  };

  bot.sendMessage(chatId, "Выбери пользователя для упоминания:", {
    reply_markup: keyboard
  });
});

// Обработчик нажатий на кнопки
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const username = query.data;

  // Ищем пользователя по username
  const user = users.find(u => u.username === username);

  if (user) {
    bot.sendMessage(chatId, `@${user.username}`, { parse_mode: "Markdown" });
  } else {
    bot.sendMessage(chatId, "Ошибка: Пользователь не найден.");
  }
});

// Запускаем сервер
app.listen(port, () => {
    console.log(`Бот запущен на порту ${port}`);
});
