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
            
            // محاولة جلب النقاط الحية من Google Apps Script سحابياً
            let isLive = false;
            const googleScriptUrl = localStorage.getItem('group_eval_google_script_url') || (data.meta && data.meta.googleScriptUrl);
            if (googleScriptUrl) {
                try {
                    const response = await fetch(`${googleScriptUrl}?action=getScores&t=${Date.now()}`);
                    if (response.ok) {
                        const liveScores = await response.json();
                        if (Array.isArray(liveScores)) {
                            liveScores.forEach(ls => {
                                const group = groups.find(g => g.id === ls.id);
                                if (group) {
                                    group.score = ls.score;
                                }
                            });
                            isLive = true;
                            console.log('DataService: تم تحديث درجات المجموعات بنجاح من خادم جوجل!');
                        }
                    }
                } catch (err) {
                    console.warn('تعذر جلب الدرجات الحية من السحاب، سيتم استخدام درجات الكاش المحلي:', err);
                }
            }

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
                            <span style="filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.5));">🔥</span>
                            <span>دوري المجموعات: <span style="color: #c084fc; text-shadow: 0 0 10px rgba(192, 132, 252, 0.3);">مين</span> واخد التحدي لحسابه؟</span>
                            <span style="filter: hue-rotate(270deg) drop-shadow(0 0 5px rgba(239, 68, 68, 0.5));">🔥</span>
                        </div>
                        <div class="leaderboard-subtitle">
                            <span class="sub-line left"></span>
                            <span class="sub-sparkle">✨</span>
                            <span class="sub-txt">${isLive ? 'نقاط التحدي حية ومباشرة ⚡' : 'كل مجموعة ليها شغفها، والتحدي واحد!'}</span>
                            <span class="sub-sparkle">✨</span>
                            <span class="sub-line right"></span>
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
                            <div class="group-card-title">${escapeHTML(getGroupDisplayName(g.name))}</div>
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
            1: { 
                icon: '👑', 
                rankStr: '01',
                class: 'first', 
                rankColor: '#fbbf24', 
                rankGlow: 'rgba(251, 191, 36, 0.45)', 
                bgGrad: 'linear-gradient(135deg, #ffd700 0%, #ff9800 100%)', 
                badgeLabel: 'المركز الأول'
            },
            2: { 
                icon: '🎯', 
                rankStr: '02',
                class: 'second', 
                rankColor: '#c084fc', 
                rankGlow: 'rgba(192, 132, 252, 0.35)', 
                bgGrad: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)', 
                badgeLabel: ''
            },
            3: { 
                icon: '⚡', 
                rankStr: '03',
                class: 'third', 
                rankColor: '#0ea5e9', 
                rankGlow: 'rgba(14, 165, 233, 0.35)', 
                bgGrad: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)', 
                badgeLabel: ''
            }
        };
        const badge = rankBadges[rank];
        const scoreVal = g.score || 0;
        
        const wreathSvg = rank === 1 
            ? `<svg class="laurel-wreath" viewBox="0 0 100 100">
                <path d="M 32,70 C 18,60 14,40 18,20" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
                <path d="M 18,20 C 12,23 7,16 14,13" fill="#fbbf24"/>
                <path d="M 20,35 C 13,38 9,30 16,27" fill="#fbbf24"/>
                <path d="M 23,50 C 16,52 12,44 19,40" fill="#fbbf24"/>
                <path d="M 28,63 C 21,65 17,57 24,53" fill="#fbbf24"/>
                <path d="M 68,70 C 82,60 86,40 82,20" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
                <path d="M 82,20 C 88,23 93,16 86,13" fill="#fbbf24"/>
                <path d="M 80,35 C 87,38 91,30 84,27" fill="#fbbf24"/>
                <path d="M 77,50 C 84,52 88,44 81,40" fill="#fbbf24"/>
                <path d="M 72,63 C 79,65 83,57 76,53" fill="#fbbf24"/>
               </svg>` 
            : '';

        return `
        <div class="podium-card-panel ${badge.class}" style="--rank-color: ${badge.rankColor}; --rank-glow: ${badge.rankGlow};">
            <div class="hexagon-wrap">
                ${wreathSvg}
                <span class="hexagon-badge">${badge.icon}</span>
                <div class="hexagon" style="background: ${badge.bgGrad};">${badge.rankStr}</div>
            </div>
            <div class="podium-ribbon" style="--ribbon-color: ${badge.rankColor};">${escapeHTML(getGroupDisplayName(g.name))}</div>
            <div class="progress-ring-wrap" style="--progress-color: ${badge.rankColor}; --percentage: ${scoreVal}%;">
                <div class="progress-ring-inner">
                    <span class="progress-percent">${scoreVal}%</span>
                    <span class="progress-lbl">التقدم</span>
                </div>
            </div>
            <div class="podium-stars-row">
                ${renderStars(scoreVal)}
            </div>
            ${badge.badgeLabel ? `<div class="podium-pill-label"><i class="bi bi-trophy-fill"></i> ${badge.badgeLabel}</div>` : ''}
        </div>
        `;
    }

    function renderRunnerUpRow(g, rank, colors, groups) {
        const originalIndex = groups.findIndex(orig => orig.id === g.id);
        const color = colors[originalIndex % colors.length];
        const scoreVal = g.score || 0;
        
        return `
        <div class="runner-card-row" style="--group-color: ${color};">
            <div class="runner-row-left">
                <div class="runner-avatar-icon"><i class="bi bi-people-fill"></i></div>
                <div class="progress-ring-wrap mini" style="--progress-color: ${color}; --percentage: ${scoreVal}%;">
                    <div class="progress-ring-inner">
                        <span class="progress-percent">${scoreVal}%</span>
                        <span class="progress-lbl">التقدم</span>
                    </div>
                </div>
                <div class="runner-info">
                    <span class="runner-name">${escapeHTML(getGroupDisplayName(g.name))}</span>
                    <div class="runner-stars-row">${renderStars(scoreVal)}</div>
                </div>
            </div>
            <div class="runner-row-right">
                <div class="runner-stat-badge">
                    <div class="runner-avatar-icon" style="width:20px;height:20px;font-size:0.65rem;background:transparent;border:none;box-shadow:none;color:#94a3b8;"><i class="bi bi-people-fill"></i></div>
                    <div class="runner-stat-text">
                        <span class="stat-num">${groups.length}</span>
                        <span class="stat-lbl">مجموعات</span>
                    </div>
                </div>
                <div class="runner-rank-badge">#${rank}</div>
            </div>
        </div>
        `;
    }

    function getGroupDisplayName(name) {
        const mapping = {
            'مجموعة 1': 'المجموعة الأولى',
            'مجموعة 2': 'المجموعة الثانية',
            'مجموعة 3': 'المجموعة الثالثة',
            'مجموعة 4': 'المجموعة الرابعة'
        };
        return mapping[name.trim()] || name;
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
