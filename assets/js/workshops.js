/* workshops.js — منطق عرض ورش العمل */
(function () {
    'use strict';

    const modal      = document.getElementById('workshopModal');
    const modalTitle = document.getElementById('ws-modal-title');
    const modalBody  = document.getElementById('ws-modal-body');
    let bsModal;

    let workshops = [];

    const wsIcons = {
        1: 'bi-brain-fill',
        2: 'bi-compass-fill',
        3: 'bi-map-fill'
    };

    function renderCard(ws) {
        const iconClass = wsIcons[ws.day] || 'bi-tools';
        const div = document.createElement('div');
        div.className = 'workshop-card';
        div.innerHTML = `
            <div class="d-flex align-items-start gap-3 mb-3">
                <div class="ws-icon"><i class="bi ${iconClass}"></i></div>
                <div>
                    <div class="lecture-card-title fw-bold" style="font-size:1.05rem; color:#fff; line-height:1.4">${ws.title}</div>
                    <div class="lecture-card-meta mt-2" style="gap: 8px;">
                        <span class="meta-chip" style="font-size:0.75rem"><i class="bi bi-clock-fill text-danger"></i>${ws.time}</span>
                        <span class="meta-chip" style="font-size:0.75rem"><i class="bi bi-geo-alt-fill text-info"></i>${ws.place}</span>
                    </div>
                </div>
            </div>
            ${ws.summary ? `<p class="lecture-card-summary" style="font-size:0.82rem; color:var(--text-secondary); margin:0; line-height:1.5">${ws.summary}</p>` : ''}
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
        modalTitle.innerHTML = `<span style="color:#fb7185">${ws.title}</span>`;
        
        const objectivesHtml = (ws.skillsGained || []).map((obj, idx) => `
            <div class="objective-item">
                <div class="objective-num">${idx + 1}</div>
                <div class="objective-text">${obj}</div>
            </div>
        `).join('');

        modalBody.innerHTML = `
            <div class="d-flex flex-wrap gap-2 mb-4">
                <span class="meta-chip"><i class="bi bi-person-fill text-warning"></i>${ws.speaker}</span>
                <span class="meta-chip"><i class="bi bi-clock-fill text-danger"></i>${ws.time}</span>
                <span class="meta-chip"><i class="bi bi-geo-alt-fill text-info"></i>${ws.place}</span>
            </div>
            
            ${ws.summary ? `<p class="mb-4" style="color:var(--text-secondary);font-size:.9rem;line-height:1.6;text-align:justify;">${ws.summary}</p>` : ''}
            
            ${objectivesHtml ? `
                <div class="mb-4">
                    <div class="section-label mb-3" style="color:#fbbf24; font-size:0.95rem; font-weight:800;"><i class="bi bi-bullseye me-1"></i> أهداف الورشة الأساسية</div>
                    <div class="objectives-list">${objectivesHtml}</div>
                </div>
            ` : ''}

            ${ws.practicalApplication ? `
                <div class="mb-2">
                    <div class="section-label mb-3" style="color:#06b6d4; font-size:0.95rem; font-weight:800;"><i class="bi bi-laptop me-1"></i> التطبيق العملي والتحدي</div>
                    <div class="practical-box">${ws.practicalApplication}</div>
                </div>
            ` : ''}
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
