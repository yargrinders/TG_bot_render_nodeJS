require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера

const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

// ======= ДАННЫЕ И СОСТОЯНИЕ =======

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

// Массив шаблонов сообщений для случайного выбора
const messages = [
  "Привет @$username, играем? 🚀 - Тебя вызывает @$caller_name",
  "@$username, присоединяйся к игре! 🎮 - Тебя вызывает @$caller_name",
  "Эй, @$username! Время для игры! ⏰ - Тебя вызывает @$caller_name",
  "@$username, как на счет поиграть в Fortnite ?! 👋 - Тебя вызывает @$caller_name"
];

// Состояние бота для мониторинга
const botStatus = {
  startTime: new Date(),
  lastPingTime: new Date(),
  totalPings: 0
};

// ======= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =======

/**
 * Возвращает случайное сообщение из массива шаблонов
 * @returns {string} - Случайное сообщение
 */
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Генерирует клавиатуру с кнопками пользователей (по 2 в ряд)
 * и кнопкой "Позвать всех" сверху
 * @param {Array} users - Массив пользователей
 * @returns {Array} - Массив кнопок для inline клавиатуры
 */
function generateKeyboard(users) {
  const keyboard = [
    [{ text: "🔊 Позвать всех", callback_data: "call_all" }]
  ];
  
  // Группируем кнопки пользователей по 2 в ряд
  for (let i = 0; i < users.length; i += 2) {
    const row = [];
    row.push({ text: users[i].name, callback_data: users[i].id.toString() });
    
    // Добавляем вторую кнопку в ряд, если она существует
    if (users[i + 1]) {
      row.push({ text: users[i + 1].name, callback_data: users[i + 1].id.toString() });
    }
    
    keyboard.push(row);
  }
  
  return keyboard;
}

/**
 * Находит пользователя по id и возвращает его имя без эмодзи
 * @param {number} userId - ID пользователя
 * @param {Object} defaultUser - Объект пользователя по умолчанию
 * @returns {string} - Имя пользователя без эмодзи
 */
function getUserName(userId, defaultUser = {}) {
  const userFromArray = users.find(u => u.id === userId);
  
  if (userFromArray) {
    return userFromArray.name.replace("👤 ", "");
  }
  
  return defaultUser.first_name || "пользователь";
}

/**
 * Находит пользователя по id и возвращает его username
 * @param {number} userId - ID пользователя
 * @param {Object} defaultUser - Объект пользователя по умолчанию
 * @returns {string} - Username пользователя
 */
function getUserUsername(userId, defaultUser = {}) {
  const userFromArray = users.find(u => u.id === userId);
  
  if (userFromArray && userFromArray.username) {
    return userFromArray.username;
  }
  
  return defaultUser.username || "пользователь";
}

// ======= НАСТРОЙКА EXPRESS =======

// Устанавливаем webhook для бота
bot.setWebHook(`${webhookUrl}/bot${token}`);

// Обрабатываем запросы от Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Эндпоинт для UptimeRobot
app.get('/ping', (req, res) => {
  const now = new Date();
  botStatus.totalPings++;
  
  // Вычисляем время с последнего пинга
  const timeSinceLastPing = now - botStatus.lastPingTime;
  botStatus.lastPingTime = now;
  
  // Отправляем информацию о состоянии бота
  res.status(200).json({
    status: 'ok',
    message: 'Bot is running',
    uptime: Math.floor((now - botStatus.startTime) / 1000) + ' seconds',
    since_last_ping: Math.floor(timeSinceLastPing / 1000) + ' seconds',
    total_pings: botStatus.totalPings,
    server_time: now.toISOString()
  });
  
  console.log(`[UptimeRobot] Bot pinged at ${now.toISOString()} (ping #${botStatus.totalPings})`);
});

// Корневой эндпоинт для проверки работоспособности сервера
app.get('/', (req, res) => {
  const now = new Date();
  const uptimeSeconds = Math.floor((now - botStatus.startTime) / 1000);
  const uptimeFormatted = formatUptime(uptimeSeconds);
  
  res.status(200).send(`
    <html>
      <head>
        <title>Telegram Bot Status</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .status { color: green; font-weight: bold; }
          .info { margin: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; display: inline-block; text-align: left; }
          h1 { color: #0088cc; }
        </style>
      </head>
      <body>
        <h1>Telegram Bot Server</h1>
        <p>Status: <span class="status">Online</span></p>
        <div class="info">
          <p><strong>Server started:</strong> ${botStatus.startTime.toISOString()}</p>
          <p><strong>Last ping:</strong> ${botStatus.lastPingTime.toISOString()}</p>
          <p><strong>Total pings:</strong> ${botStatus.totalPings}</p>
          <p><strong>Uptime:</strong> ${uptimeFormatted}</p>
        </div>
        <p><small>Use /ping endpoint for UptimeRobot monitoring</small></p>
      </body>
    </html>
  `);
});

/**
 * Форматирует время в читаемый формат (дни, часы, минуты, секунды)
 * @param {number} seconds - Время в секундах
 * @returns {string} - Отформатированное время
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  
  if (days > 0) parts.push(`${days} ${pluralize(days, 'день', 'дня', 'дней')}`);
  if (hours > 0) parts.push(`${hours} ${pluralize(hours, 'час', 'часа', 'часов')}`);
  if (minutes > 0) parts.push(`${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')}`);
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} ${pluralize(remainingSeconds, 'секунда', 'секунды', 'секунд')}`);
  }
  
  return parts.join(', ');
}

/**
 * Склоняет слова в зависимости от числа
 * @param {number} number - Число
 * @param {string} one - Форма для 1
 * @param {string} few - Форма для 2-4
 * @param {string} many - Форма для 5-20
 * @returns {string} - Правильно склоненное слово
 */
function pluralize(number, one, few, many) {
  if (number % 10 === 1 && number % 100 !== 11) {
    return one;
  }
  if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) {
    return few;
  }
  return many;
}

// ======= НАСТРОЙКА TELEGRAM БОТА =======

// Команда /start с клавиатурой
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  const userName = getUserName(userId, msg.from);
  
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
  const callerUsername = getUserUsername(callerId, query.from);
  const callerName = getUserName(callerId, query.from);
  
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
    
    return;
  }
  
  // Обычное поведение для кнопок пользователей
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

// ======= ЗАПУСК СЕРВЕРА =======

app.listen(port, () => {
  console.log(`Бот запущен на порту ${port}`);
  console.log(`Мониторинг доступен по адресу ${webhookUrl}/ping`);
  console.log(`Статус бота доступен по адресу ${webhookUrl}`);
});