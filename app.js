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
