const tg = window.Telegram.WebApp;
tg.ready();

const list = document.getElementById('list');
const input = document.getElementById('search');
const sortSelect = document.getElementById('sort');
let currentCategory = 'all';

const API_URL = "https://kalashop-server.onrender.com/api/catalog";
const BUY_URL = "https://kalashop-server.onrender.com/api/buy";
const PING_URL = "https://kalashop-server.onrender.com/api/ping";

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2 || countryCode === "UNKNOWN") return "🌐";
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function switchTab(category, btn) {
  currentCategory = category;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  load();
}

async function load() {
  const q = encodeURIComponent(input.value.trim());
  list.innerHTML = '<div style="color: #2ea6ff; text-align: center; margin-top: 20px;">Пробуждение сервера...</div>';
  
  try {
    await fetch(PING_URL);
    
    list.innerHTML = '<div style="color: #2ea6ff; text-align: center; margin-top: 20px;">Загрузка каталога...</div>';
    const r = await fetch(`${API_URL}?category=${currentCategory}&country=${q}&q=${q}`);
    const data = await r.json();
    
    let items = data.items;
    
    if (sortSelect.value === 'low') {
        items.sort((a, b) => a.price_stars - b.price_stars);
    } else if (sortSelect.value === 'high') {
        items.sort((a, b) => b.price_stars - a.price_stars);
    }
    
    if (items.length === 0) {
      list.innerHTML = '<div style="color: #888; text-align: center; margin-top: 20px;">Ничего не найдено</div>';
      return;
    }

    list.innerHTML = items.map(i => {
      const badgeColor = i.quality_score >= 80 ? '#1b4332' : '#4a3b1a';
      const textColor = i.quality_score >= 80 ? '#40c057' : '#f5c518';
      
      const days = Math.floor(i.age_days);
      let ageText = `Отлега: ${days} дн.`;
      if (days >= 30 && days < 365) ageText = `Отлега: ${Math.floor(days / 30)} мес. (${days} дн.)`;
      else if (days >= 365) ageText = `Отлега: ${Math.floor(days / 365)} г. (${days} дн.)`;

      let premText = i.is_premium ? `<br><span style="color: #f5c518; font-weight: bold;">⭐ Premium: ${Math.floor(i.premium_days)} дн.</span>` : '';

      return `
        <div class="card" style="border: 1px solid #2a2a2a; border-radius: 10px; padding: 12px; margin-bottom: 10px; background: #0f0f0f; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <div style="font-size: 24px;">${getFlagEmoji(i.country)}</div>
              <div>
                <div style="font-weight: bold; font-size: 16px; color: #fff;">${i.country}</div>
                <div style="color: #888; font-size: 12px;">${i.phone_prefix}</div>
              </div>
            </div>
            <div style="background: ${badgeColor}; color: ${textColor}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
              🛡 ${i.quality_score} / 100
            </div>
          </div>
          
          <div style="font-size: 13px; color: #ccc; margin-bottom: 12px; line-height: 1.4;">
            <span style="color: #2ea6ff; font-weight: bold;">${ageText}</span>
            ${premText}<br>${i.description}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #222; padding-top: 12px;">
            <button style="background: #28a745; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer;" onclick="buy(${i.item_id}, ${i.price_stars})">Купить</button>
            <div style="color: #FFD700; font-weight: 900; font-size: 20px; text-shadow: 0 0 10px rgba(255,215,0,0.3);">${i.price_stars} ⭐</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div style="color: #ff4d4d; text-align: center; padding: 20px;">Ошибка загрузки. Подождите 30 секунд и обновите.</div>`;
  }
}

// ИСПРАВЛЕНО: Теперь ждем ответа от сервера
async function buy(itemId, price) {
  tg.showPopup({
    title: 'Подтверждение',
    message: `Выставить счет на ${price} ⭐ за этот аккаунт?`,
    buttons: [
      {id: 'cancel', type: 'cancel', text: 'Отмена'},
      {id: 'ok', type: 'default', text: 'Оплатить'}
    ]
  }, async function(id) {
    if (id === 'ok') {
      tg.showAlert("Отправляем счет...");
      
      try {
        const res = await fetch(BUY_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            user_id: tg.initDataUnsafe.user.id,
            item_id: itemId,
            price: price
          })
        });
        
        const data = await res.json();
        
        if (data.error) {
          tg.showAlert(`❌ Ошибка: ${data.msg}`);
        } else {
          tg.showAlert("✅ Счет отправлен в чат! Перейдите в бота для оплаты.");
          tg.close();
        }
      } catch (e) {
        tg.showAlert("❌ Ошибка сети. Попробуйте позже.");
      }
    }
  });
}

input.addEventListener('input', load);
load();
