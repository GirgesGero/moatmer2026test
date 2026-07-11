/* hymns.js — منطق عرض الترانيم */
(function () {
    'use strict';

    let conferenceHymns = [];
    let prayerCircleHymns = [];
    let bandHymns = [];

    function renderHymn(hymn, isBand) {
        const card = document.createElement('div');
        card.className = 'hymn-card';
        card.id = `hymn-${hymn.id}`;

        const isFav = YC.FavoritesManager.isFavorite(hymn.id);

        card.innerHTML = `
            <div class="hymn-header">
                <div class="hymn-icon"><i class="bi bi-music-note-beamed"></i></div>
                <div class="hymn-title">${hymn.title}</div>
                <button class="hymn-fav-btn ${isFav ? 'active' : ''}" data-id="${hymn.id}" aria-label="أضف للمفضلة">
                    <i class="bi bi-heart${isFav ? '-fill' : ''}"></i>
                </button>
                <button class="hymn-toggle" aria-label="اعرض الكلمات"><i class="bi bi-chevron-down"></i></button>
            </div>
            <div class="hymn-lyrics">
                <div class="hymn-lyrics-inner">${hymn.lyrics || ''}
                    ${isBand && hymn.chords ? `<div class="band-chords"><i class="bi bi-music-note-list me-1"></i>${hymn.chords}</div>` : ''}
                </div>
            </div>
        `;

        // Toggle lyrics
        const toggle = card.querySelector('.hymn-toggle');
        const lyrics = card.querySelector('.hymn-lyrics');
        toggle.addEventListener('click', () => {
            lyrics.classList.toggle('open');
            toggle.classList.toggle('open');
        });

        // Favorite
        const favBtn = card.querySelector('.hymn-fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = favBtn.dataset.id;
            const nowFav = YC.FavoritesManager.toggle(id);
            favBtn.classList.toggle('active', nowFav);
            favBtn.querySelector('i').className = `bi bi-heart${nowFav ? '-fill' : ''}`;
            renderFavorites();
        });

        return card;
    }

    function renderList(panelId, hymns, isBand) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        panel.innerHTML = '';

        if (!hymns || hymns.length === 0) {
            panel.innerHTML = '<div class="empty-state"><i class="bi bi-music-note"></i><p>لا توجد ترانيم بعد</p></div>';
            return;
        }

        hymns.forEach(h => panel.appendChild(renderHymn(h, isBand)));
    }

    function renderFavorites() {
        const favIds = YC.FavoritesManager.getAll();
        const panel = document.getElementById('panel-favorites');
        if (!panel) return;
        panel.innerHTML = '';

        const allHymns = [...(conferenceHymns||[]), ...(prayerCircleHymns||[]), ...(bandHymns||[])];
        const favHymns = allHymns.filter(h => favIds.includes(h.id));

        if (favHymns.length === 0) {
            panel.innerHTML = '<div class="empty-state"><i class="bi bi-heart"></i><p>لم تضف أي ترنيمة للمفضلة بعد<br>اضغط ❤️ على أي ترنيمة لإضافتها</p></div>';
            return;
        }
        favHymns.forEach(h => panel.appendChild(renderHymn(h, !!(h.chords))));
    }

    // Tabs
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const panel = document.getElementById(`panel-${this.dataset.tab}`);
            if (panel) panel.classList.add('active');
            if (this.dataset.tab === 'favorites') renderFavorites();
        });
    });

    // تحميل البيانات وإطلاق التطبيق
    DataService.loadConference().then(data => {
        const h = data.hymns || {};
        conferenceHymns = h.conference || [];
        prayerCircleHymns = h.prayerCircle || [];
        bandHymns = h.band || [];

        renderList('panel-conference', conferenceHymns, false);
        renderList('panel-prayer', prayerCircleHymns, false);
        renderList('panel-band', bandHymns, true);
    });
})();
