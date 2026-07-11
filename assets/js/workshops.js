/* workshops.js — منطق عرض ورش العمل */
(function () {
    'use strict';

    const modal      = document.getElementById('workshopModal');
    const modalTitle = document.getElementById('ws-modal-title');
    const modalBody  = document.getElementById('ws-modal-body');
    let bsModal;

    let workshops = [];

    function renderCard(ws) {
        const div = document.createElement('div');
        div.className = 'workshop-card';
        div.innerHTML = `
            <div class="d-flex align-items-start gap-3 mb-2">
                <div class="ws-icon"><i class="bi bi-tools"></i></div>
                <div class="lecture-card-title">${ws.title}</div>
            </div>
            <div class="lecture-card-meta">
                <span class="meta-chip"><i class="bi bi-person-fill"></i>${ws.speaker}</span>
                <span class="meta-chip"><i class="bi bi-clock-fill"></i>${ws.time}</span>
                <span class="meta-chip"><i class="bi bi-geo-alt-fill"></i>${ws.place}</span>
            </div>
            ${ws.summary ? `<p class="lecture-card-summary mt-2">${ws.summary}</p>` : ''}
        `;
        div.addEventListener('click', () => openModal(ws));
        return div;
    }

    function renderAll() {
        [1, 2, 3].forEach(day => {
            const panel = document.getElementById(`ws-panel-day-${day}`);
            if (!panel) return;
            panel.innerHTML = '';
            const dayWs = workshops.filter(w => w.day === day);
            if (dayWs.length === 0) {
                YC.renderEmptyState(panel, `هيتم إضافة ورش اليوم ${day === 1 ? 'الأول' : day === 2 ? 'الثاني' : 'الثالث'} قريباً`);
                return;
            }
            dayWs.forEach(ws => panel.appendChild(renderCard(ws)));
        });
    }

    function openModal(ws) {
        if (!modal) return;
        modalTitle.textContent = ws.title;
        const skillsHtml = (ws.skillsGained || []).map(s => `<span class="skill-chip">${s}</span>`).join('');
        modalBody.innerHTML = `
            <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="meta-chip"><i class="bi bi-person-fill"></i>${ws.speaker}</span>
                <span class="meta-chip"><i class="bi bi-clock-fill"></i>${ws.time}</span>
                <span class="meta-chip"><i class="bi bi-geo-alt-fill"></i>${ws.place}</span>
            </div>
            ${ws.summary ? `<p class="mb-3" style="color:var(--text-secondary);font-size:.9rem;line-height:1.6">${ws.summary}</p>` : ''}
            ${ws.practicalApplication ? `<div class="mb-3"><div class="section-label mb-2">التطبيق العملي</div><p style="color:var(--text-secondary);font-size:.88rem">${ws.practicalApplication}</p></div>` : ''}
            ${skillsHtml ? `<div><div class="section-label mb-2">المهارات المكتسبة</div>${skillsHtml}</div>` : ''}
        `;
        if (!bsModal) bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`ws-panel-day-${this.dataset.day}`)?.classList.add('active');
        });
    });

    DataService.loadConference().then(data => {
        workshops = data.workshops || [];
        renderAll();

        // عند التحميل: هل يوجد id محدد في الرابط؟
        const params = new URLSearchParams(location.search);
        const directId = params.get('id');
        if (directId) {
            const ws = workshops.find(w => w.id === directId);
            if (ws) {
                // التبديل التلقائي لتبويب اليوم الصحيح ثم فتح المودال
                document.querySelector(`.day-tab[data-day="${ws.day}"]`)?.click();
                setTimeout(() => openModal(ws), 200);
            }
        }
    });
})();
