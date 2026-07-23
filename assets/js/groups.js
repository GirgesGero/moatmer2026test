/* ═══════════════════════════════════════════════
   groups.js — منطق عرض مجموعات مؤتمر الشباب
   مؤتمر الشباب 2026
   ═══════════════════════════════════════════════ */
(function () {
    'use strict';

    /* خريطة الأسماء العربية للمجموعات */
    const GROUP_NAMES = {
        'مجموعة 1': 'المجموعة الأولى',
        'مجموعة 2': 'المجموعة الثانية',
        'مجموعة 3': 'المجموعة الثالثة',
        'مجموعة 4': 'المجموعة الرابعة',
        'g1': 'المجموعة الأولى',
        'g2': 'المجموعة الثانية',
        'g3': 'المجموعة الثالثة',
        'g4': 'المجموعة الرابعة'
    };

    /* ألوان المجموعات الثابتة */
    const GROUP_COLORS = {
        'g1': '#06b6d4',
        'g2': '#10b981',
        'g3': '#f59e0b',
        'g4': '#ec4899'
    };
    const FALLBACK_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

    /* ─── دالة التشغيل الرئيسية ─── */
    async function init() {
        const grid = document.getElementById('groups-grid');
        const leaderboardSlot = document.getElementById('leaderboard-slot');
        if (!grid) return;

        try {
            const data = await DataService.loadConference();
            const groups = data.groups || [];
            const participants = data.participants || [];
            const isLive = Boolean(DataService.getGasUrl());

            /* ── 1. احتساب نقاط كل مجموعة ── */
            groups.forEach((g, i) => {
                // جمع كل أعضاء المجموعة (مطابقة بـ groupId أو group أو اسم المجموعة)
                const members = participants.filter(p =>
                    p.groupId === g.id ||
                    p.group === g.name ||
                    p.group === getDisplayName(g.name) ||
                    p.groupId === g.id
                );
                g._members = members;

                // النقاط = أعلى نقطة بين أعضاء المجموعة أو نقاط المجموعة المباشرة
                let pts = Number(g.points || g.score || 0);
                if (members.length > 0) {
                    const memberMax = Math.max(...members.map(m => Number(m.points || 0)));
                    pts = Math.max(pts, memberMax);
                }
                g.overallPoints = pts;
                g._color = GROUP_COLORS[g.id] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            });

            /* ── 2. ترتيب المجموعات حسب النقاط (تنازلي) ── */
            const sorted = [...groups].sort((a, b) => (b.overallPoints || 0) - (a.overallPoints || 0));

            /* ── 3. بناء منصة التتويج ── */
            if (leaderboardSlot && groups.length > 0) {
                leaderboardSlot.innerHTML = buildLeaderboard(sorted, isLive);
            }

            /* ── 4. كروت المجموعات مرتبة حسب النقاط ── */
            grid.innerHTML = sorted.map((g, rank) => buildGroupCard(g, rank + 1)).join('');

        } catch (err) {
            console.error('فشل تحميل المجموعات:', err);
            grid.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:#f87171; width:100%;">
                    <i class="bi bi-exclamation-triangle-fill" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
                    <div style="font-size:0.95rem; font-weight:700;">عذراً، تعذّر تحميل بيانات المجموعات.</div>
                </div>`;
        }
    }

    /* ─── بناء لوحة الصدارة ─── */
    function buildLeaderboard(sorted, isLive) {
        const first  = sorted[0];
        const second = sorted[1];
        const third  = sorted[2];

        // الترتيب البصري: الثاني يسار، الأول وسط (أطول)، الثالث يمين
        const podiumCards = [
            second ? buildPodiumCard(second, 2) : '',
            first  ? buildPodiumCard(first, 1)  : '',
            third  ? buildPodiumCard(third, 3)  : '',
        ].join('');

        // المجموعات من المرتبة الرابعة فصاعداً
        const runnersRows = sorted.length > 3
            ? `<div class="leaderboard-runners-up">
                ${sorted.slice(3).map((g, idx) => buildRunnerRow(g, idx + 4)).join('')}
               </div>`
            : '';

        return `
        <div class="leaderboard-container">
            <div class="leaderboard-title">
                <span>🔥</span>
                <span>دوري المجموعات:
                    <span style="color:#c084fc;">مين</span> واخد التحدي لحسابه؟
                </span>
                <span>🔥</span>
            </div>
            <div class="leaderboard-subtitle">
                <span class="sub-line left"></span>
                <span class="sub-sparkle">✨</span>
                <span class="sub-txt">${isLive ? 'إجمالي النقاط حية ومباشرة من السحابة ⚡' : 'المجموع الكلي التراكمي لكافة الفعاليات والألعاب!'}</span>
                <span class="sub-sparkle">✨</span>
                <span class="sub-line right"></span>
            </div>
            <div class="leaderboard-podium">
                ${podiumCards}
            </div>
            ${runnersRows}
        </div>`;
    }

    /* ─── كارت المنصة (1 / 2 / 3) ─── */
    function buildPodiumCard(g, rank) {
        const cfg = {
            1: { class: 'first',  icon: '👑', num: '01', color: '#fbbf24', glow: 'rgba(251,191,36,0.45)',  grad: 'linear-gradient(135deg,#ffd700,#ff9800)', label: 'المركز الأول' },
            2: { class: 'second', icon: '🥈', num: '02', color: '#c084fc', glow: 'rgba(192,132,252,0.35)', grad: 'linear-gradient(135deg,#c084fc,#7e22ce)', label: 'المركز الثاني' },
            3: { class: 'third',  icon: '🥉', num: '03', color: '#38bdf8', glow: 'rgba(14,165,233,0.35)',  grad: 'linear-gradient(135deg,#38bdf8,#0369a1)', label: 'المركز الثالث' },
        }[rank];

        const pts = g.overallPoints || 0;
        const pct = Math.min(100, Math.round((pts / 340) * 100));
        const displayName = getDisplayName(g.name);

        // إكليل الغار للأول فقط
        const wreath = rank === 1 ? `
            <svg class="laurel-wreath" viewBox="0 0 100 100">
                <path d="M32,70 C18,60 14,40 18,20" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
                <path d="M18,20 C12,23 7,16 14,13" fill="#fbbf24"/>
                <path d="M20,35 C13,38 9,30 16,27" fill="#fbbf24"/>
                <path d="M23,50 C16,52 12,44 19,40" fill="#fbbf24"/>
                <path d="M28,63 C21,65 17,57 24,53" fill="#fbbf24"/>
                <path d="M68,70 C82,60 86,40 82,20" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
                <path d="M82,20 C88,23 93,16 86,13" fill="#fbbf24"/>
                <path d="M80,35 C87,38 91,30 84,27" fill="#fbbf24"/>
                <path d="M77,50 C84,52 88,44 81,40" fill="#fbbf24"/>
                <path d="M72,63 C79,65 83,57 76,53" fill="#fbbf24"/>
            </svg>` : '';

        return `
        <div class="podium-card-panel ${cfg.class}" style="--rank-color:${cfg.color}; --rank-glow:${cfg.glow};">
            <div class="hexagon-wrap">
                ${wreath}
                <span class="hexagon-badge">${cfg.icon}</span>
                <div class="hexagon" style="background:${cfg.grad};">${cfg.num}</div>
            </div>
            <div class="podium-ribbon" style="--ribbon-color:${cfg.color};">${escapeHTML(displayName)}</div>
            <div class="progress-ring-wrap" style="--progress-color:${cfg.color}; --percentage:${pct}%;">
                <div class="progress-ring-inner">
                    <span class="progress-percent">${pts}</span>
                    <span class="progress-lbl">نقطة</span>
                </div>
            </div>
            <div class="podium-stars-row">${renderStars(pts)}</div>
            <div class="podium-pill-label"><i class="bi bi-trophy-fill"></i> ${cfg.label}</div>
        </div>`;
    }

    /* ─── صف للمجموعات الأقل من المرتبة 3 ─── */
    function buildRunnerRow(g, rank) {
        const pts = g.overallPoints || 0;
        const pct = Math.min(100, Math.round((pts / 340) * 100));
        const color = g._color || '#94a3b8';

        return `
        <div class="runner-card-row" style="--group-color:${color};">
            <div class="runner-row-left">
                <div class="runner-avatar-icon"><i class="bi bi-people-fill"></i></div>
                <div class="progress-ring-wrap mini" style="--progress-color:${color}; --percentage:${pct}%;">
                    <div class="progress-ring-inner">
                        <span class="progress-percent">${pts}</span>
                        <span class="progress-lbl">نقطة</span>
                    </div>
                </div>
                <div class="runner-info">
                    <span class="runner-name">${escapeHTML(getDisplayName(g.name))}</span>
                    <div class="runner-stars-row">${renderStars(pts)}</div>
                </div>
            </div>
            <div class="runner-row-right">
                <div class="runner-rank-badge">#${rank}</div>
            </div>
        </div>`;
    }

    /* ─── كارت المجموعة في الشبكة ─── */
    function buildGroupCard(g, rank) {
        const pts = g.overallPoints || 0;
        const members = g._members || [];
        const color = g._color || '#94a3b8';
        const displayName = getDisplayName(g.name);
        const isFirst = rank === 1;

        const rankIcons = { 1: '🥇', 2: '🥈', 3: '🥉' };
        const rankIcon = rankIcons[rank] || `#${rank}`;

        const memberRows = members.length > 0
            ? members.map((m, idx) => `
                <div class="member-item" style="display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:10px; background: rgba(255,255,255,0.03); margin-bottom:4px;">
                    <span style="font-size:0.7rem; color:${color}; font-weight:900; min-width:18px;">${idx + 1}</span>
                    <span style="flex:1; font-size:0.85rem; font-weight:700; color:#e2e8f0;">${escapeHTML(m.name)}</span>
                    ${m.busNumber ? `<span style="font-size:0.68rem; color:#94a3b8;"><i class="bi bi-bus-front-fill"></i> ${m.busNumber}</span>` : ''}
                    ${m.bedNumber ? `<span style="font-size:0.68rem; color:#94a3b8;"><i class="bi bi-moon-stars-fill"></i> سرير ${m.bedNumber}</span>` : ''}
                </div>`).join('')
            : `<div style="text-align:center; padding:16px; color:#64748b; font-size:0.82rem;">
                <i class="bi bi-person-plus" style="font-size:1.2rem; display:block; margin-bottom:4px;"></i>
                لم يُضاف أعضاء لهذه المجموعة بعد
               </div>`;

        return `
        <div style="
            background: ${isFirst
                ? 'linear-gradient(160deg, rgba(251,191,36,0.07) 0%, rgba(10,15,30,0.95) 100%)'
                : 'linear-gradient(160deg, rgba(10,15,30,0.9) 0%, rgba(7,11,22,0.98) 100%)'};
            border: ${isFirst ? '2px solid rgba(251,191,36,0.55)' : `1px solid ${color}30`};
            border-radius: 22px;
            padding: 0;
            overflow: hidden;
            box-shadow: ${isFirst
                ? '0 12px 35px rgba(0,0,0,0.5), 0 0 20px rgba(251,191,36,0.15)'
                : '0 8px 25px rgba(0,0,0,0.4)'};
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            position: relative;
        " onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform='translateY(0)'">

            ${isFirst ? `<div style="position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#ffd700,#ff9800,#ffd700); border-radius:22px 22px 0 0;"></div>` : `<div style="position:absolute; top:0; left:0; right:0; height:2px; background:${color}; opacity:0.5; border-radius:22px 22px 0 0;"></div>`}

            <!-- رأس الكارت -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 18px 12px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="
                        width:42px; height:42px; border-radius:14px;
                        background:${color}15; border:1px solid ${color}40;
                        display:flex; align-items:center; justify-content:center;
                        font-size:1.2rem;
                    ">${rankIcon}</div>
                    <div>
                        <div style="font-size:1rem; font-weight:900; color:#f1f5f9; line-height:1.2;">${escapeHTML(displayName)}</div>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${members.length} عضو مسجل</div>
                    </div>
                </div>
                <div style="
                    background:${isFirst ? 'rgba(251,191,36,0.15)' : `${color}15`};
                    border:1px solid ${isFirst ? 'rgba(251,191,36,0.5)' : `${color}40`};
                    border-radius:14px; padding:8px 14px; text-align:center;
                ">
                    <div style="font-size:1.5rem; font-weight:900; color:${isFirst ? '#fbbf24' : color}; line-height:1;">${pts}</div>
                    <div style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-top:1px;">نقطة إجمالية</div>
                </div>
            </div>

            <!-- شريط التقدم -->
            <div style="padding:0 18px 14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.7rem; color:#64748b; font-weight:700;">التقدم الكلي</span>
                    <span style="font-size:0.7rem; color:${color}; font-weight:800;">${Math.min(100, Math.round((pts / 340) * 100))}%</span>
                </div>
                <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden;">
                    <div style="
                        height:100%; width:${Math.min(100, Math.round((pts / 340) * 100))}%;
                        background:linear-gradient(90deg,${color},${color}cc);
                        border-radius:99px;
                        transition: width 1s ease;
                    "></div>
                </div>
            </div>

            <!-- الفاصل -->
            <div style="border-top:1px solid rgba(255,255,255,0.05); margin:0 18px;"></div>

            <!-- قائمة الأعضاء -->
            <div style="padding:12px 18px 16px; max-height:240px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:${color}30 transparent;">
                <div style="font-size:0.72rem; color:#64748b; font-weight:800; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="bi bi-people-fill me-1" style="color:${color};"></i> أعضاء المجموعة
                </div>
                ${memberRows}
            </div>
        </div>`;
    }

    /* ─── نجوم التقييم ─── */
    function renderStars(pts) {
        const filled = Math.min(5, Math.max(0, Math.round(pts / 50)));
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= filled
                ? '<i class="bi bi-star-fill star-icon filled"></i>'
                : '<i class="bi bi-star star-icon empty"></i>';
        }
        return html;
    }

    /* ─── اسم العرض العربي للمجموعة ─── */
    function getDisplayName(name) {
        return GROUP_NAMES[name ? name.trim() : ''] || name || '';
    }

    /* ─── تشفير HTML ─── */
    function escapeHTML(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* ─── تأكد من تحميل DataService أولاً ─── */
    function startApp() {
        if (!window.DataService) { setTimeout(startApp, 60); return; }
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }
})();
