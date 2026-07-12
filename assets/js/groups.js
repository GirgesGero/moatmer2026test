/* ═══════════════════════════════════════════════
   groups.js — منطق عرض مجموعات مؤتمر الشباب
   مؤتمر الشباب 2026
   ═══════════════════════════════════════════════ */
(function () {
    'use strict';

    async function init() {
        try {
            // تحميل البيانات من أفضل مصدر (يأخذ بالاعتبار draft الـ localStorage الأحدث)
            const data = await DataService.loadConference();
            const groups = data.groups || [];
            
            // قراءة المشاركين مع أخذ مسودة المتصفح بعين الاعتبار إن وجدت
            let participants = data.participants || [];
            try {
                const saved = localStorage.getItem('conference_db_draft');
                if (saved) {
                    const draft = JSON.parse(saved);
                    if (draft && draft.db && Array.isArray(draft.db.participants)) {
                        participants = draft.db.participants;
                    }
                }
            } catch (err) {
                console.warn('تعذر قراءة مسودة المشتركين من localStorage لصفحة المجموعات:', err);
            }

            const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
            const grid = document.getElementById('groups-grid');
            if (!grid) return;

            if (groups.length === 0) {
                grid.innerHTML = `<div style="text-align:center;padding:50px 20px;color:#94a3b8;font-size:0.9rem;" class="w-100">لا توجد مجموعات مسجلة بعد.</div>`;
                return;
            }

            grid.innerHTML = groups.map((g, i) => {
                const members = participants.filter(p => p.groupId === g.id);
                const color = colors[i % colors.length];
                
                const membersHtml = members.map(m => `
                    <div class="group-member">
                        <i class="bi bi-person-fill"></i>
                        <span>${escapeHTML(m.name)}</span>
                    </div>
                `).join('') || `<div class="group-empty-msg">لسه محدش اتضاف للمجموعة دي</div>`;

                return `
                <div class="group-card" style="--group-color: ${color};">
                    <div class="group-card-header">
                        <div class="group-card-badge">${i + 1}</div>
                        <div>
                            <div class="group-card-title">${escapeHTML(g.name)}</div>
                            <div class="group-card-count">${members.length} عضو</div>
                        </div>
                    </div>
                    <div class="group-members-list">
                        ${membersHtml}
                    </div>
                </div>`;
            }).join('');

        } catch (e) {
            console.error('فشل تحميل المجموعات:', e);
            const grid = document.getElementById('groups-grid');
            if (grid) {
                grid.innerHTML = `<div style="text-align:center;padding:50px 20px;color:#ef4444;font-size:0.9rem;" class="w-100">عذراً، فشل تحميل بيانات المجموعات.</div>`;
            }
        }
    }

    function escapeHTML(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function startApp() {
        if (!window.DataService) {
            setTimeout(startApp, 50);
            return;
        }
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }
})();
