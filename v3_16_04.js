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

// Переменная для отслеживания состояния бота
const botStatus = {
  startTime: new Date(),
  lastPingTime: new Date(),
  totalPings: 0
};

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

// Добавляем эндпоинт для UptimeRobot
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

// Добавляем корневой эндпоинт для проверки работоспособности сервера
app.get('/', (req, res) => {
  res.status(200).send(`
    <html>
      <head>
        <title>Telegram Bot Status</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .status { color: green; font-weight: bold; }
          .info { margin: 20px; padding: 10px; background: #f0f0f0; display: inline-block; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Telegram Bot Server</h1>
        <p>Status: <span class="status">Online</span></p>
        <div class="info">
          <p>Server started: ${botStatus.startTime.toISOString()}</p>
          <p>Last ping: ${botStatus.lastPingTime.toISOString()}</p>
          <p>Total pings: ${botStatus.totalPings}</p>
          <p>Uptime: ${Math.floor((new Date() - botStatus.startTime) / 1000)} seconds</p>
        </div>
        <p><small>Use /ping endpoint for UptimeRobot monitoring</small></p>
      </body>
    </html>
  `);
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
  console.log(`Мониторинг доступен по адресу ${webhookUrl}/ping`);
  console.log(`Статус бота доступен по адресу ${webhookUrl}`);
});