/* lectures.js — منطق عرض المحاضرات */

(function () {
    'use strict';

    const modal     = document.getElementById('lectureModal');
    const modalTitle= document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    let bsModal;

    let lectures = [];

    /* ─── رسم بطاقة محاضرة ─── */
    function renderCard(lec) {
        const div = document.createElement('div');
        div.className = 'lecture-card';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.innerHTML = `
            <div class="lecture-card-header">
                <div class="lecture-card-icon"><i class="bi bi-mic-fill"></i></div>
                <div class="lecture-card-title">${lec.title}</div>
            </div>
            <div class="lecture-card-meta">
                <span class="meta-chip"><i class="bi bi-person-fill"></i>${lec.speaker}</span>
                <span class="meta-chip"><i class="bi bi-clock-fill"></i>${lec.time}</span>
                <span class="meta-chip"><i class="bi bi-geo-alt-fill"></i>${lec.place}</span>
            </div>
            ${lec.summary ? `<p class="lecture-card-summary">${lec.summary}</p>` : ''}
            <i class="bi bi-chevron-left lecture-card-arrow"></i>
        `;

        const open = () => openModal(lec);
        div.addEventListener('click', open);
        div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
        return div;
    }

    /* ─── رسم كل الأيام ─── */
    function renderAll() {
        [1, 2, 3].forEach(day => {
            const panel = document.getElementById(`panel-day-${day}`);
            if (!panel) return;
            panel.innerHTML = '';

            const dayLectures = lectures.filter(l => l.day === day);
            if (dayLectures.length === 0) {
                YC.renderEmptyState(panel, `هيتم إضافة محاضرات اليوم ${day === 1 ? 'الأول' : day === 2 ? 'الثاني' : 'الثالث'} قريباً`);
                return;
            }

            dayLectures.forEach(lec => panel.appendChild(renderCard(lec)));
        });
    }

    /* ─── فتح Modal ─── */
    function openModal(lec) {
        if (!modal) return;
        modalTitle.textContent = lec.title;

        const goalsHtml = (lec.goals || []).map(g =>
            `<span class="goal-chip"><i class="bi bi-check2-circle me-1"></i>${g}</span>`
        ).join('');

        const keyHtml = (lec.keyTakeaways || []).map(k =>
            `<li class="mb-1">${k}</li>`
        ).join('');

        modalBody.innerHTML = `
            <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="meta-chip"><i class="bi bi-person-fill"></i>${lec.speaker}</span>
                <span class="meta-chip"><i class="bi bi-clock-fill"></i>${lec.time}</span>
                <span class="meta-chip"><i class="bi bi-geo-alt-fill"></i>${lec.place}</span>
            </div>
            ${lec.summary ? `<p class="mb-3" style="color:var(--text-secondary);font-size:.9rem;line-height:1.6">${lec.summary}</p>` : ''}
            ${goalsHtml ? `<div class="mb-3"><div class="section-label mb-2">الأهداف</div>${goalsHtml}</div>` : ''}
            ${keyHtml ? `<div><div class="section-label mb-2">النقاط الرئيسية</div><ul style="color:var(--text-secondary);font-size:.9rem;padding-right:1.2rem">${keyHtml}</ul></div>` : ''}
        `;

        if (!bsModal) bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /* ─── Tabs ─── */
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            const panel = document.getElementById(`panel-day-${this.dataset.day}`);
            if (panel) panel.classList.add('active');
        });
    });

    // تحميل البيانات وإطلاق التطبيق
    DataService.loadConference().then(data => {
        lectures = data.lectures || [];
        renderAll();

        /* ─── URL param: lectures.html?id=d1-l1 ─── */
        const params = new URLSearchParams(location.search);
        const directId = params.get('id');

        if (directId) {
            const lec = lectures.find(l => l.id === directId);
            if (lec) {
                // تفعيل التبويب المناسب
                const tab = document.querySelector(`.day-tab[data-day="${lec.day}"]`);
                if (tab) tab.click();
                setTimeout(() => openModal(lec), 300);
            }
        }
    });
})();
