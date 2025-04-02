require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера

const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

// Основной массив пользователей
const users = [
  { name: "👤 АРТ", id: 1472395097, username: "Amontearx" },
  { name: "👤 Дмитрий", id: 998877665, username: null },
  { name: "👤 Елена", id: 223344556, username: "elena_username" },
  { name: "👤 🔒 Тайный Агент", id: 111222333, username: null },
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
      { text: user.name, callback_data: user.id.toString() } // Передаём ID вместо username
    ])
  };

  bot.sendMessage(chatId, "Выбери пользователя для упоминания:", {
    reply_markup: keyboard
  });
});

// Обработчик нажатий на кнопки
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const userId = parseInt(query.data); // Получаем ID пользователя

  // Ищем пользователя по ID
  const user = users.find(u => u.id === userId);

  if (user) {
    if (user.username) {
      // Если у пользователя есть username — упоминаем через @
      bot.sendMessage(chatId, `@${user.username}`);
    } else {
      // Если нет username — упоминаем по ID (с MarkdownV2)
      const mention = `[${user.name}](tg://user?id=${user.id})`.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); // Экранируем символы
      bot.sendMessage(chatId, mention, { parse_mode: "MarkdownV2" });
    }
  } else {
    bot.sendMessage(chatId, "Ошибка: Пользователь не найден.");
  }
});

// Запускаем сервер
app.listen(port, () => {
    console.log(`Бот запущен на порту ${port}`);
});
