// Автоматическое обновление страницы каждые 30 секунд
setTimeout(() => {
    window.location.reload();
  }, 30000);
  
  // Обновление счетчика времени
  window.onload = function() {
    const startTimeEl = document.getElementById('start-time');
    const startTime = new Date(startTimeEl.getAttribute('data-start-time'));
    const uptimeElement = document.getElementById('uptime-value');
    const lastUpdateElement = document.getElementById('last-update');
    
    setInterval(() => {
      const now = new Date();
      const uptimeSeconds = Math.floor((now - startTime) / 1000);
      
      // Расчет дней, часов, минут и секунд
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      
      // Форматирование строки аптайма
      let uptimeStr = '';
      if (days > 0) uptimeStr += days + ' д ';
      if (hours > 0) uptimeStr += hours + ' ч ';
      if (minutes > 0) uptimeStr += minutes + ' мин ';
      uptimeStr += seconds + ' сек';
      
      uptimeElement.textContent = uptimeStr;
      lastUpdateElement.textContent = 'Обновлено: ' + now.toLocaleTimeString();
    }, 1000);
  };