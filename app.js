// === 每日 Chiikawa 角色圖庫 ===
const chiikawaImages = [
    'usagi.png',
    'hachiware.png',
    'momonga.png',
    'chiikawa.png'
];

let lastCheckedDate = '';

function updateDailyChiikawa() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    if (lastCheckedDate !== todayStr) {
        lastCheckedDate = todayStr;

        let dateHash = 0;
        for (let i = 0; i < todayStr.length; i++) {
            dateHash += todayStr.charCodeAt(i);
        }
        
        const dayIndex = dateHash % chiikawaImages.length;
        const imgEl = document.getElementById('chiikawa-img');
        if (imgEl) {
            imgEl.src = chiikawaImages[dayIndex];
        }
    }
}

// === 1. 實時時鐘 ===
function updateClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = weekDays[now.getDay()];

    document.getElementById('clock-time').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clock-date').textContent = `${year}-${month}-${date} ${dayName}`;

    updateDailyChiikawa();
}

// === 2. 天文台天氣數據 ===
async function fetchWeather() {
    try {
        const res = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc');
        const data = await res.json();

        let tempVal = '--';
        if (data.temperature && data.temperature.data) {
            const placeItem = data.temperature.data.find(item => 
                item.place.includes('筲箕灣') || item.place.includes('鰂魚涌') || item.place.includes('香港公園')
            );
            if (placeItem) {
                tempVal = placeItem.value;
            } else if (data.temperature.data.length > 0) {
                tempVal = data.temperature.data[0].value;
            }
        }
        document.getElementById('weather-temp').textContent = tempVal;

        if (data.icon && data.icon.length > 0) {
            const iconImg = document.getElementById('weather-icon');
            const iconNum = data.icon[0];
            iconImg.src = `https://www.hko.gov.hk/images/HKOWeb_Icon/pic${iconNum}.png`;
            iconImg.style.display = 'inline-block';
            iconImg.onerror = function() {
                this.style.display = 'none';
            };
        }

        const warningEl = document.getElementById('weather-warning');
        if (data.warningMessage && Array.isArray(data.warningMessage) && data.warningMessage.length > 0) {
            warningEl.textContent = `⚠️ ${data.warningMessage.join(' | ')}`;
            warningEl.style.color = '#c0392b';
        } else {
            warningEl.textContent = '🌸 現時沒有特別天氣警告';
            warningEl.style.color = '#27ae60';
        }

    } catch (err) {
        console.error('天氣數據讀取失敗:', err);
        document.getElementById('weather-warning').textContent = '天氣數據載入失敗';
    }
}

// === 3. 港鐵太古站實時報站 ===
async function fetchMTR() {
    try {
        const res = await fetch('https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=ISL&sta=TAK');
        const data = await res.json();

        if (data.status === 1 && data.data && data.data['ISL-TAK']) {
            const takData = data.data['ISL-TAK'];

            const parseMinutes = (trainList) => {
                if (!trainList || trainList.length === 0) return '暫無班次';
                return trainList.slice(0, 2).map(train => {
                    const ttnt = parseInt(train.ttnt, 10);
                    if (isNaN(ttnt) || ttnt <= 0) {
                        return '即將到站';
                    }
                    return `${ttnt} 分鐘`;
                }).join(' / ');
            };

            document.getElementById('mtr-down').textContent = parseMinutes(takData.DOWN);
            document.getElementById('mtr-up').textContent = parseMinutes(takData.UP);
        }
    } catch (err) {
        console.error('港鐵數據讀取失敗:', err);
        document.getElementById('mtr-down').textContent = '讀取失敗';
        document.getElementById('mtr-up').textContent = '讀取失敗';
    }
}

// === 4. 城巴 A12（機場方向） ===
async function fetchA12() {
    const el = document.getElementById('bus-a12-eta');
    try {
        // 加上 ?t=${Date.now()} 防止瀏覽器讀取快取舊資料
        const res = await fetch(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/route-eta/CTB/A12?t=${Date.now()}`);
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            // 篩選出往機場方向，且有 ETA 的資料
            const airportETAs = data.data.filter(item => 
                item.eta && (item.dest_tc.includes('機場') || item.dir === 'O')
            );

            if (airportETAs.length > 0) {
                // 依時間排序，取最近一班
                airportETAs.sort((a, b) => new Date(a.eta) - new Date(b.eta));
                const minLeft = Math.max(0, Math.round((new Date(airportETAs[0].eta) - new Date()) / 60000));
                
                if (minLeft === 0) {
                    el.textContent = '即將到站';
                } else {
                    el.textContent = `${minLeft} 分鐘`;
                }
                return;
            }
        }
        el.textContent = '非服務時間 / 暫無班次';
    } catch (e) {
        console.error('A12 抓取失敗:', e);
        el.textContent = '讀取失敗';
    }
}

// === 5. 九巴 33X（數碼港方向） ===
async function fetch33X() {
    const el = document.getElementById('bus-33x-eta');
    try {
        // 加上 ?t=${Date.now()} 防止瀏覽器讀取快取舊資料
        const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/33X/1?t=${Date.now()}`);
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            // 篩選出往數碼港方向，且有 ETA 的資料
            const cyberportETAs = data.data.filter(item => 
                item.eta && item.dest_tc.includes('數碼港')
            );

            if (cyberportETAs.length > 0) {
                cyberportETAs.sort((a, b) => new Date(a.eta) - new Date(b.eta));
                const minLeft = Math.max(0, Math.round((new Date(cyberportETAs[0].eta) - new Date()) / 60000));
                
                if (minLeft === 0) {
                    el.textContent = '即將到站';
                } else {
                    el.textContent = `${minLeft} 分鐘`;
                }
                return;
            }
        }
        el.textContent = '非服務時間 / 暫無班次';
    } catch (e) {
        console.error('33X 抓取失敗:', e);
        el.textContent = '讀取失敗';
    }
}

// === 6. 自動儲存備忘板 ===
function initMemo() {
    const memoInput = document.getElementById('memo-input');
    const memoStatus = document.getElementById('memo-status');
    
    // 載入先前的文字
    const savedMemo = localStorage.getItem('ipad_dashboard_memo');
    if (savedMemo !== null) {
        memoInput.value = savedMemo;
    }

    let saveTimeout;
    memoInput.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem('ipad_dashboard_memo', memoInput.value);
            memoStatus.classList.add('visible');
            setTimeout(() => memoStatus.classList.remove('visible'), 1500);
        }, 500); // 輸入停止 0.5 秒後自動儲存
    });
}

// === 初始化與定時器 ===
updateClock();
setInterval(updateClock, 1000);
initMemo();

function refreshAllData() {
    fetchWeather();
    fetchMTR();
    fetchA12();
    fetch33X();
}

refreshAllData();
setInterval(refreshAllData, 30000);
