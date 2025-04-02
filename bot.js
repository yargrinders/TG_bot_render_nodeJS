require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера

const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

// Массив пользователей
const users = [
  { name: "👤 АРТ", id: 1472395097, username: "Amontearx" },
  // { name: "👤 Коля", id: 7160070476, username: "nikolai" },
  // { name: "👤 Саша", id: 5297933809, username: "aleksshtanko6" },
  // { name: "👤 Витя", id: 7884535660, username: "poltorashkaexe" },
  // { name: "👤 Ральф", id: 284203271, username: "R_G" },
  { name: "👤 Ярик", id: 910176803, username: "Yargrinders" },
  { name: "👤 Ярик2", id: 5199037185, username: "Yargrinders2" },
];

// Массив сообщений для случайного выбора
const messages = [
  "Привет @$username, играем? 🚀 - Тебя вызывает @$caller_name",
  "@$username, присоединяйся к игре! 🎮 - Тебя вызывает @$caller_name",
  "Эй, @$username! Время для игры! ⏰ - Тебя вызывает @$caller_name",
  "@$username, как на счет поиграть в Fortnite ?! 👋 - Тебя вызывает @$caller_name"
];

// Функция для получения случайного сообщения
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Функция для группировки кнопок по 2 в ряд с кнопкой "Позвать всех" сверху
function generateKeyboard(users) {
  const keyboard = [
    // Добавляем кнопку "Позвать всех" в первую строку
    [{ text: "🔊 Позвать всех", callback_data: "call_all" }]
  ];
  
  // Добавляем остальные кнопки пользователей
  for (let i = 0; i < users.length; i += 2) {
    if (users[i + 1]) {
      // Если есть пара, добавляем две кнопки в ряд
      keyboard.push([
        { text: users[i].name, callback_data: users[i].id.toString() },
        { text: users[i + 1].name, callback_data: users[i + 1].id.toString() }
      ]);
    } else {
      // Если последний без пары, добавляем его в одиночку
      keyboard.push([{ text: users[i].name, callback_data: users[i].id.toString() }]);
    }
  }
  return keyboard;
}

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
  const userId = msg.from.id;
  
  // Ищем пользователя в массиве по ID
  const userFromArray = users.find(u => u.id === userId);
  
  // Используем имя из массива, если пользователь найден, иначе используем имя из Telegram или "пользователь"
  const userName = userFromArray 
    ? userFromArray.name.replace("👤 ", "") // Убираем эмодзи из имени 
    : (msg.from.first_name || "пользователь");
  
  bot.sendMessage(chatId, `Привет, ${userName} 🤖\n\nВыберите действие:`, {
    reply_markup: { inline_keyboard: generateKeyboard(users) }
  });
});

// Обработчик нажатий на кнопки
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const callbackData = query.data;
  
  // Получаем информацию о пользователе, который вызвал колбэк
  const callerId = query.from.id;
  const callerFromArray = users.find(u => u.id === callerId);
  const callerUsername = callerFromArray ? callerFromArray.username : (query.from.username || "пользователь");
  const callerName = callerFromArray 
    ? callerFromArray.name.replace("👤 ", "") 
    : (query.from.first_name || "пользователь");
  
  // Если нажата кнопка "Позвать всех"
  if (callbackData === "call_all") {
    // Создаем список упоминаний всех пользователей
    const mentionList = users
      .filter(user => user.username) // Только те, у кого есть username
      .map(user => `@${user.username}`)
      .join(" ");
    
    // Отправляем сообщение со всеми упоминаниями
    bot.sendMessage(
      chatId, 
      `📢 У кого есть желание сегодня поиграть?! ${mentionList} - Вызывает ${callerName}`
    );
    
    // Важно! Добавляем return, чтобы прервать выполнение остального кода
    return;
  }
  
  // Обычное поведение для других кнопок
  const userId = parseInt(callbackData);
  const user = users.find(u => u.id === userId);

  if (user) {
    if (user.username) {
      // Получаем случайное сообщение и заменяем плейсхолдеры
      let message = getRandomMessage()
        .replace('@$username', `@${user.username}`)
        .replace('@$caller_name', `@${callerUsername}`);
      
      bot.sendMessage(chatId, message);
    } else {
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