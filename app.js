const tg = window.Telegram.WebApp;
tg.ready();

const list = document.getElementById('list');
const input = document.getElementById('search');
let currentCategory = 'all';

// ВАЖНО: Замени ссылку ниже на свою актуальную ссылку от туннеля Termux!
const API_URL = "https://kalashop-777.loca.lt/api/catalog";

function switchTab(category, btn) {
  currentCategory = category;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  load();
}

async function load() {
  const q = encodeURIComponent(input.value.trim());
  try {
    const r = await fetch(`${API_URL}?category=${currentCategory}&country=${q}&q=${q}`);
    const data = await r.json();
    
    if (data.items.length === 0) {
      list.innerHTML = '<div style="color: #888; text-align: center; margin-top: 20px;">Ничего не найдено</div>';
      return;
    }

    list.innerHTML = data.items.map(i => {
      const badgeColor = i.quality_score >= 100 ? '#1b4332' : '#4a3b1a';
      const textColor = i.quality_score >= 100 ? '#40c057' : '#f5c518';
      
      const days = Math.floor(i.age_days);
      let ageText = `Отлега: ${days} дн.`;
      if (days >= 30 && days < 365) ageText = `Отлега: ${Math.floor(days / 30)} мес. (${days} дн.)`;
      else if (days >= 365) ageText = `Отлега: ${Math.floor(days / 365)} г. (${days} дн.)`;

      let premText = i.is_premium ? `<br><span style="color: #f5c518;">⭐ Premium: ${Math.floor(i.premium_days)} дн.</span>` : '';

      return `
        <div class="card" style="border: 1px solid #2a2a2a; border-radius: 10px; padding: 12px; margin-bottom: 10px; background: #0f0f0f;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <div style="font-weight: bold; font-size: 15px;">${i.country || 'Неизвестно'}</div>
              <div style="color: #888; font-size: 12px; margin-bottom: 4px;">${i.phone_prefix || '+'}</div>
              <div style="font-size: 13px; color: #ccc; margin-top: 6px;">
                <span style="color: #2ea6ff; font-weight: bold;">${ageText}</span>
                ${premText}<br>${i.description || 'Telegram аккаунт'}
              </div>
            </div>
            <div style="background: ${badgeColor}; color: ${textColor}; padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              🛡 ${i.quality_score} / 100
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid #222; padding-top: 12px;">
            <button style="background: #28a745; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;" onclick="buy(${i.item_id})">Купить</button>
            <div style="color: #f5c518; font-weight: bold; font-size: 16px;">${i.price_stars} ⭐</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = `<div style="color: red; text-align: center;">Ошибка загрузки. Проверь туннель.</div>`;
  }
}

async function buy(itemId) {
  tg.showAlert("Функция оплаты появится чуть позже.");
}

input.addEventListener('input', load);
load();
