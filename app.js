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
    if (!countryCode || countryCode.length !== 2) return '🌐';
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
    list.innerHTML = '<div style="color: #2ea6ff; text-align:center; padding: 20px;">Загрузка...</div>';
    
    try {
        await fetch(PING_URL);
        list.innerHTML = '<div style="color: #888; text-align:center; padding: 20px;">Поиск лотов...</div>';
        const r = await fetch(`${API_URL}?category=${currentCategory}&q=${q}`);
        const data = await r.json();
        
        let items = data.items;
        
        if (sortSelect.value === 'low') {
            items.sort((a, b) => a.price_stars - b.price_stars);
        } else if (sortSelect.value === 'high') {
            items.sort((a, b) => b.price_stars - a.price_stars);
        }
        
        if (items.length === 0) {
            list.innerHTML = '<div style="color: #888; text-align:center; padding: 20px;">Ничего не найдено</div>';
            return;
        }
        
        list.innerHTML = items.map(i => {
            const badgeColor = i.quality_score >= 80 ? '#4caf50' : (i.quality_score >= 50 ? '#ff9800' : '#f44336');
            const days = Math.floor(i.age_days);
            let ageText = `Отлега: ${days} дн.`;
            if (days >= 30 && days < 365) ageText = `Отлега: ${Math.floor(days/30)} мес.`;
            else if (days >= 365) ageText = `Отлега: ${Math.floor(days/365)} г.`;
            
            let premText = i.is_premium ? '<br><span style="color: #FFD700;">💎 Premium</span>' : '';
            const flag = getFlagEmoji(i.country);
            
            return `
            <div class="card" style="border: 1px solid #333; border-radius: 12px; padding: 12px; margin-bottom: 12px; background: #1e1e1e;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div style="font-size: 24px;">${flag}</div>
                        <div>
                            <div style="font-weight: bold; color: #fff;">${i.phone_prefix} ***</div>
                            <div style="color: #888; font-size: 12px;">${ageText}</div>
                        </div>
                    </div>
                    <div style="background: ${badgeColor}; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #fff;">
                        🛡 ${i.quality_score} / 100
                    </div>
                </div>
                
                <div style="font-size: 13px; color: #ccc; margin-top: 10px; margin-bottom: 10px;">
                    ${premText}<br>${i.description}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: #FFD700; font-weight: bold; font-size: 16px;">${i.price_stars} ⭐</div>
                    <button style="background: #2ea6ff; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold;" onclick="buy(${i.item_id}, ${i.price_stars})">Купить</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = `<div style="color: #f44336; text-align:center; padding: 20px;">Ошибка сети: ${e.message}</div>`;
    }
}

async function buy(itemId, price) {
    tg.showPopup({
        title: 'Подтверждение',
        message: `Купить этот аккаунт за ${price} ⭐? (Тестовый режим)`,
        buttons: [
            {id: 'cancel', type: 'cancel', text: 'Отмена'},
            {id: 'ok', type: 'default', text: 'Купить'}
        ]
    }, async function(id) {
        if (id === 'ok') {
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
                
                if (data.error === "no_lolz_funds") {
                    tg.showAlert("❌ На балансе магазина (Lolz) нет средств.");
                } else if (data.error) {
                    tg.showAlert(`❌ ${data.error}`);
                } else {
                    tg.showAlert("✅ Аккаунт куплен! Перейдите в бота и нажмите 'Получить номер и код'.");
                    setTimeout(() => { tg.close(); }, 1500); 
                }
            } catch (e) {
                tg.showAlert("❌ Ошибка сети. Сервер не отвечает.");
            }
        }
    });
}

input.addEventListener('input', load);
load();
