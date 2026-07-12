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

            // ─── لوحة الصدارة التنافسية ───
            const leaderboardSlot = document.getElementById('leaderboard-slot');
            if (leaderboardSlot && groups.length > 0) {
                const sortedGroups = [...groups].sort((a, b) => (b.score || 0) - (a.score || 0));
                
                const podiumHtml = `
                    <!-- الثاني -->
                    ${sortedGroups[1] ? renderPodiumColumn(sortedGroups[1], 2, colors, groups) : ''}
                    <!-- الأول -->
                    ${sortedGroups[0] ? renderPodiumColumn(sortedGroups[0], 1, colors, groups) : ''}
                    <!-- الثالث -->
                    ${sortedGroups[2] ? renderPodiumColumn(sortedGroups[2], 3, colors, groups) : ''}
                `;
                
                const runnersHtml = sortedGroups.length > 3 
                    ? `<div class="leaderboard-runners-up">
                        ${sortedGroups.slice(3).map((g, idx) => renderRunnerUpRow(g, idx + 4, colors, groups)).join('')}
                       </div>`
                    : '';

                leaderboardSlot.innerHTML = `
                    <div class="leaderboard-container">
                        <div class="leaderboard-title">
                            <i class="bi bi-fire trophy-glow"></i>
                            <span>دوري المجموعات: مين واخد التحدي لحسابه؟ 🔥</span>
                        </div>
                        <div class="leaderboard-podium">
                            ${podiumHtml}
                        </div>
                        ${runnersHtml}
                    </div>
                `;
            }

            grid.innerHTML = groups.map((g, i) => {
                const members = participants.filter(p => p.groupId === g.id);
                const color = colors[i % colors.length];
                
                const membersHtml = members.map((m, idx) => {
                    const firstLetter = (m.name || '').trim().charAt(0) || '👤';
                    return `
                    <div class="group-member" style="--delay: ${idx * 0.05}s;">
                        <div class="member-avatar">${escapeHTML(firstLetter)}</div>
                        <span>${escapeHTML(m.name)}</span>
                    </div>
                    `;
                }).join('') || `<div class="group-empty-msg"><i class="bi bi-people-fill"></i> لسه محدش اتضاف للمجموعة دي</div>`;

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

    function renderStars(score) {
        const starsOutOfFive = (score / 20);
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (starsOutOfFive >= i) {
                starsHtml += '<i class="bi bi-star-fill star-icon filled"></i>';
            } else if (starsOutOfFive >= i - 0.5) {
                starsHtml += '<i class="bi bi-star-half star-icon filled"></i>';
            } else {
                starsHtml += '<i class="bi bi-star star-icon empty"></i>';
            }
        }
        return starsHtml;
    }

    function renderPodiumColumn(g, rank, colors, groups) {
        const originalIndex = groups.findIndex(orig => orig.id === g.id);
        
        const rankBadges = {
            1: { icon: '👑', class: 'first', rankColor: '#ffb300', rankGlow: 'rgba(255, 179, 0, 0.55)', label: 'البطل الحالي 👑' },
            2: { icon: '⚡', class: 'second', rankColor: '#00e5ff', rankGlow: 'rgba(0, 229, 255, 0.45)', label: 'المنافس الأقرب ⚡' },
            3: { icon: '🎯', class: 'third', rankColor: '#ff1744', rankGlow: 'rgba(255, 23, 68, 0.4)', label: 'في المعركة 🎯' }
        };
        const badge = rankBadges[rank];
        const scoreVal = g.score || 0;
        const groupShort = g.name.replace('مجموعة', 'م').trim();
        
        return `
        <div class="podium-col ${badge.class}">
            <div class="podium-avatar-wrap">
                <span class="podium-rank-badge">${badge.icon}</span>
                <div class="podium-avatar" style="--rank-color: ${badge.rankColor}; --rank-glow: ${badge.rankGlow};">${escapeHTML(groupShort)}</div>
            </div>
            <div class="podium-name">${escapeHTML(g.name)}</div>
            <div class="podium-status-tag" style="color: ${badge.rankColor};">${badge.label}</div>
            <div class="podium-stars">${renderStars(scoreVal)}</div>
            <div class="podium-score">${scoreVal} <span class="score-lbl">نقطة</span></div>
            <div class="podium-pedestal"></div>
        </div>
        `;
    }

    function renderRunnerUpRow(g, rank, colors, groups) {
        const originalIndex = groups.findIndex(orig => orig.id === g.id);
        const color = colors[originalIndex % colors.length];
        const scoreVal = g.score || 0;
        const groupShort = g.name.replace('مجموعة', 'م').trim();
        
        return `
        <div class="runner-row">
            <span class="runner-rank">#${rank}</span>
            <div class="runner-avatar-sm" style="background: ${color};">${escapeHTML(groupShort)}</div>
            <span class="runner-name">${escapeHTML(g.name)}</span>
            <div class="runner-stars">${renderStars(scoreVal)}</div>
            <span class="runner-score">${scoreVal} نقطة</span>
        </div>
        `;
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
