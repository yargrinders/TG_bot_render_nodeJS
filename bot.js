require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_BOT_TOKEN;
const port = process.env.PORT || 3000;
const webhookUrl = process.env.WEBHOOK_URL; // URL сервера
const bot = new TelegramBot(token);
const app = express();
app.use(express.json());
app.use(express.static('public'));

// ======= ДАННЫЕ И СОСТОЯНИЕ =======
// Массив обычных пользователей
const users = [
  { name: "🔥 Коля", id: 7160070476, username: "nikolai kerankov" },
  { name: "⚡ Саша", id: 5297933809, username: "aleksshtanko6" },
  { name: "🎮 Витя", id: 7884535660, username: "poltorashkaexe" },
  { name: "🕶️ Ральф", id: 284203271, username: "R.G" },
  { name: "👨‍💻 Ярик", id: 910176803, username: "Yargrinders" },
];

// Массив скрытых пользователей
const hiddenUsers = [
  { name: "👤 Admin", id: 5199037185, username: "Ярослав Ющенко" },
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
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function generateKeyboard(users, hiddenUsers) {
  const keyboard = [
    [{ text: "🔊 Позвать всех", callback_data: "call_all" }]
  ];
  
  for (let i = 0; i < users.length; i += 2) {
    const row = [];
    row.push({ text: users[i].name, callback_data: users[i].id.toString() });
    if (users[i + 1]) {
      row.push({ text: users[i + 1].name, callback_data: users[i + 1].id.toString() });
    }
    keyboard.push(row);
  }
  
  const hiddenRow = hiddenUsers.map(user => ({
    text: user.name,
    callback_data: `hidden_${user.id}`
  }));
  if(hiddenRow.length > 0) {
    keyboard.push(hiddenRow);
  }

  return keyboard;
}

function getUserName(userId, defaultUser = {}, isHidden = false) {
  const userFromArray = [...users, ...hiddenUsers].find(u => u.id === userId);
  if (userFromArray) {
    return isHidden ? userFromArray.username : userFromArray.name.replace("👤 ", "");
  }
  return defaultUser.first_name || "пользователь";
}

function getUserUsername(userId, defaultUser = {}, isHidden = false) {
  const userFromArray = [...users, ...hiddenUsers].find(u => u.id === userId);
  if (userFromArray && userFromArray.username) {
    return isHidden ? userFromArray.username : `@${userFromArray.username}`;
  }
  return defaultUser.username || "пользователь";
}

// ======= НАСТРОЙКА EXPRESS =======
bot.setWebHook(`${webhookUrl}/bot${token}`);

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/ping', (req, res) => {
  const now = new Date();
  botStatus.totalPings++;
  const timeSinceLastPing = now - botStatus.lastPingTime;
  botStatus.lastPingTime = now;
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

app.get('/', (req, res) => {
  const now = new Date();
  const uptimeSeconds = Math.floor((now - botStatus.startTime) / 1000);
  const uptimeFormatted = formatUptime(uptimeSeconds);
  const lastPingDelta = Math.floor((now - botStatus.lastPingTime) / 1000);
  const lastPingFormatted = lastPingDelta > 60 
    ? `${Math.floor(lastPingDelta / 60)} мин ${lastPingDelta % 60} сек назад` 
    : `${lastPingDelta} сек назад`;
  const formatDate = (date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Telegram Bot Status</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/styles/bot-status.css">
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Telegram Bot Status</h1>
            <p class="subtitle">Мониторинг состояния бота</p>
            <div class="status-indicator">
              <div class="status-dot"></div>
              Онлайн
            </div>
          </div>
          <div class="card">
            <div class="card-header">Общая информация</div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Запущен</div>
                  <div class="info-value" id="start-time" data-start-time="${botStatus.startTime.toISOString()}">${formatDate(botStatus.startTime)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Время работы</div>
                  <div class="info-value" id="uptime-value">${uptimeFormatted}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Последний пинг</div>
                  <div class="info-value">${formatDate(botStatus.lastPingTime)} (${lastPingFormatted})</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Всего пингов</div>
                  <div class="info-value">${botStatus.totalPings.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">Системная информация</div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Текущее время сервера</div>
                  <div class="info-value">${formatDate(now)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Порт сервера</div>
                  <div class="info-value">${port}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Node.js версия</div>
                  <div class="info-value">${process.version}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Платформа</div>
                  <div class="info-value">${process.platform}</div>
                </div>
              </div>
              <div class="info-item" style="margin-top: 1rem;">
                <div class="info-label">Endpoint для мониторинга</div>
                <div class="info-value highlight">/ping</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Telegram Bot Server</p>
            <p id="last-update">Обновлено: ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <script src="/scripts/bot-status.js"></script>
      </body>
    </html>
  `);
});

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
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = getUserName(userId, msg.from);
  bot.sendMessage(chatId, `Привет, ${userName} 
Выбери действие - 🤖:`, {
    reply_markup: { inline_keyboard: generateKeyboard(users, hiddenUsers) }
  });
});

bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const callbackData = query.data;
  const isHiddenUser = callbackData.startsWith('hidden_');
  
  const callerId = query.from.id;
  const callerUsername = getUserUsername(callerId, query.from);
  const callerName = getUserName(callerId, query.from);
  
  if (callbackData === "call_all") {
    const mentionList = [...users, ...hiddenUsers]
      .filter(user => user.username)
      .map(user => (user.id in hiddenUsers ? user.username : `@${user.username}`))
      .join(" ");
    bot.sendMessage(
      chatId, 
      `📢 У кого есть желание сегодня поиграть?! ${mentionList} - Вызывает ${callerName}`
    );
    return;
  }
  
  let userId;
  if(isHiddenUser){
    userId = parseInt(callbackData.replace('hidden_', ''));
  } else {
    userId = parseInt(callbackData);
  }
  
  const user = [...users, ...hiddenUsers].find(u => u.id === userId);
  if (user) {
    if (user.username) {
      let message = getRandomMessage()
        .replace('@$username', getUserUsername(userId, {}, isHiddenUser))
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