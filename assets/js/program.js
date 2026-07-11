/* program.js — منطق عرض البرنامج والتايم لاين المطور (v2.1) */
(function () {
    'use strict';

    const TYPE_ICONS = {
        prayer:   { icon: 'bi bi-book-fill',          color: 'var(--gold-light)' },
        lecture:  { icon: 'bi bi-mic-fill',            color: '#34d399' },
        workshop: { icon: 'bi bi-tools',               color: '#fb7185' },
        meal:     { icon: 'bi bi-cup-hot-fill',        color: '#fbbf24' },
        free:     { icon: 'bi bi-emoji-smile-fill',    color: '#818cf8' },
        travel:   { icon: 'bi bi-bus-front-fill',      color: 'var(--primary-light)' },
        other:    { icon: 'bi bi-circle-fill',         color: 'var(--text-muted)' }
    };

    let currentActivity = null;
    let activeFilter = 'all';
    let selectedDay = '1';
    let program = [];

    /* ─── 1. رسم بطاقة نشاط ─── */
    function renderActivity(act) {
        const t   = TYPE_ICONS[act.type] || TYPE_ICONS.other;
        const div = document.createElement('div');
        div.className = `activity-item type-${act.type}`;
        div.id = act.id;

        const timeStr = act.endTime ? `${act.time} – ${act.endTime}` : act.time;

        let linkedPage = 'lectures.html';
        if (act.type === 'workshop') {
            linkedPage = 'workshops.html';
        }
        const linkHtml = act.linkedId
            ? `<a href="${linkedPage}?id=${act.linkedId}" class="activity-chip" style="color:var(--primary);text-decoration:none"><i class="bi bi-link-45deg"></i>تفاصيل</a>`
            : '';

        let starredIds = JSON.parse(localStorage.getItem('yc2_starred_activities') || '[]');
        const isStarred = starredIds.includes(act.id);

        div.innerHTML = `
            <button class="activity-star-btn ${isStarred ? 'active' : ''}" data-id="${act.id}" title="أضف لجدولي">
                <i class="bi ${isStarred ? 'bi-star-fill' : 'bi-star'}"></i>
            </button>
            <div class="activity-time">${timeStr}</div>
            <div class="activity-title"><i class="${t.icon}" style="color:${t.color};margin-left:.4rem;font-size:.85em"></i>${act.title}</div>
            <div class="activity-meta">
                ${act.place ? `<span class="activity-chip"><i class="bi bi-geo-alt-fill"></i>${act.place}</span>` : ''}
                ${act.notes ? `<span class="activity-chip"><i class="bi bi-chat-text-fill"></i>${act.notes}</span>` : ''}
                ${linkHtml}
            </div>
        `;

        const starBtn = div.querySelector('.activity-star-btn');
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let currentStars = JSON.parse(localStorage.getItem('yc2_starred_activities') || '[]');
            const idx = currentStars.indexOf(act.id);
            let nowStarred = false;
            
            if (idx > -1) {
                currentStars.splice(idx, 1);
            } else {
                currentStars.push(act.id);
                nowStarred = true;
            }
            
            localStorage.setItem('yc2_starred_activities', JSON.stringify(currentStars));
            starBtn.classList.toggle('active', nowStarred);
            starBtn.querySelector('i').className = `bi bi-star${nowStarred ? '-fill' : ''}`;
            
            if (activeFilter === 'starred') {
                applyFilter();
            }
        });

        return div;
    }

    /* ─── 2. رسم كل الأيام ─── */
    function renderAll() {
        [1, 2, 3, 4].forEach(day => {
            const timeline = document.getElementById(`timeline-day-${day}`);
            if (!timeline) return;
            timeline.innerHTML = '';

            const acts = program.filter(a => a.day === day)
                .sort((a, b) => a.time.localeCompare(b.time));

            if (acts.length === 0) {
                const dayLabel = day === 1 ? 'الأول' : day === 2 ? 'الثاني' : day === 3 ? 'الثالث' : 'الرابع';
                timeline.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>هيتم إضافة برنامج اليوم ${dayLabel} قريباً</p></div>`;
                return;
            }

            acts.forEach(act => timeline.appendChild(renderActivity(act)));
        });
    }

    /* ─── 3. تمييز النشاط الحالي وتفعيل تبويبه ─── */
    function highlightNow() {
        // تنظيف الشارات السابقة
        document.querySelectorAll('.now-badge, .next-badge').forEach(b => b.remove());
        
        currentActivity = YC.highlightCurrentActivity(program);

        // إضافة شارة "الآن" للنشاط الحالي وتفعيل تبويبه
        if (currentActivity) {
            const el = document.getElementById(currentActivity.id);
            if (el) {
                const badge = document.createElement('span');
                badge.className = 'now-badge';
                badge.innerHTML = '<span class="now-dot"></span> الآن';
                el.querySelector('.activity-title')?.prepend(badge);

                // تفعيل تبويب اليوم المناسب تلقائياً فقط عند التحميل الأول
                if (!sessionStorage.getItem('program_loaded')) {
                    sessionStorage.setItem('program_loaded', 'true');
                    const dayTab = document.querySelector(`.day-tab[data-day="${currentActivity.day}"]`);
                    if (dayTab) dayTab.click();
                }
            }
        }

        // حساب وإضافة شارة "التالية" للنشاط التالي لليوم المختار حالياً
        const targetDay = currentActivity ? currentActivity.day : parseInt(selectedDay);
        const dayActs = program.filter(a => a.day === targetDay)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        let nextActivity = null;
        if (currentActivity && currentActivity.day === targetDay) {
            const idx = dayActs.findIndex(a => a.id === currentActivity.id);
            if (idx !== -1 && idx + 1 < dayActs.length) {
                nextActivity = dayActs[idx + 1];
            }
        } else {
            // إذا لم يكن هناك نشاط جاري، نبحث عن أول نشاط قادم اليوم
            const now = new Date();
            const currentTotalMins = now.getHours() * 60 + now.getMinutes();
            const toMin = (str) => {
                if (!str) return null;
                const [h, m] = str.split(':').map(Number);
                return h * 60 + m;
            };
            for (let i = 0; i < dayActs.length; i++) {
                const start = toMin(dayActs[i].time);
                if (start > currentTotalMins) {
                    nextActivity = dayActs[i];
                    break;
                }
            }
        }

        if (nextActivity) {
            const nextEl = document.getElementById(nextActivity.id);
            if (nextEl) {
                const nextBadge = document.createElement('span');
                nextBadge.className = 'next-badge';
                nextBadge.innerHTML = '<span class="next-dot"></span> التالية';
                nextEl.querySelector('.activity-title')?.prepend(nextBadge);
            }
        }
    }

    /* ─── 4. تحديث بطاقة الـ Widget للنشاط الجاري (Live Status) ─── */
    function updateLiveWidget() {
        const now = new Date();
        const currentTotalMins = now.getHours() * 60 + now.getMinutes();

        const toMin = (str) => {
            if (!str) return null;
            const [h, m] = str.split(':').map(Number);
            return h * 60 + m;
        };

        // فلترة فعاليات اليوم المختار حالياً
        const dayActivities = program.filter(a => a.day === parseInt(selectedDay))
            .sort((a, b) => a.time.localeCompare(b.time));
        
        let currentAct = null;
        let nextAct = null;

        // البحث عن النشاط الجاري
        for (let i = 0; i < dayActivities.length; i++) {
            const act = dayActivities[i];
            const start = toMin(act.time);
            const end = toMin(act.endTime) || (start + 60);

            if (currentTotalMins >= start && currentTotalMins < end) {
                currentAct = act;
                nextAct = dayActivities[i + 1] || null;
                break;
            }
        }

        // إذا لم يكن هناك نشاط جاري، نبحث عن القادم اليوم
        if (!currentAct) {
            for (let i = 0; i < dayActivities.length; i++) {
                const start = toMin(dayActivities[i].time);
                if (start > currentTotalMins) {
                    nextAct = dayActivities[i];
                    break;
                }
            }
        }

        const widget = document.getElementById('live-status-widget');
        if (!widget) return;

        if (currentAct) {
            widget.style.display = 'block';
            document.getElementById('live-activity-title').innerHTML = `
                <i class="bi bi-play-circle-fill me-1" style="color:var(--primary-light)"></i> ${currentAct.title}
            `;
            
            // حساب النسبة المئوية والوقت المتبقي
            const start = toMin(currentAct.time);
            const end = toMin(currentAct.endTime) || (start + 60);
            const duration = end - start;
            const elapsed = currentTotalMins - start;
            const percent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
            const minsLeft = end - currentTotalMins;

            document.getElementById('live-progress-percent').textContent = `${percent}%`;
            document.getElementById('live-progress-bar-fill').style.width = `${percent}%`;
            
            if (minsLeft > 60) {
                const h = Math.floor(minsLeft / 60);
                const m = minsLeft % 60;
                document.getElementById('live-time-left').textContent = `متبقي ${h} ساعة و ${m} دقيقة`;
            } else {
                document.getElementById('live-time-left').textContent = `متبقي ${minsLeft} دقيقة`;
            }

            const nextTeaser = document.getElementById('live-next-teaser');
            if (nextAct) {
                nextTeaser.style.display = 'flex';
                document.getElementById('live-next-activity-text').textContent = `النشاط التالي: ${nextAct.title} (${nextAct.time})`;
            } else {
                nextTeaser.style.display = 'none';
            }
        } else if (nextAct) {
            // لا يوجد نشاط جاري حالياً ولكن هناك نشاط قادم اليوم
            widget.style.display = 'block';
            document.getElementById('live-activity-title').textContent = "لا توجد فعاليات جارية حالياً";
            
            const start = toMin(nextAct.time);
            const minsToStart = start - currentTotalMins;
            
            if (minsToStart > 60) {
                const h = Math.floor(minsToStart / 60);
                const m = minsToStart % 60;
                document.getElementById('live-time-left').textContent = `الفعالية التالية تبدأ بعد ${h} ساعة و ${m} دقيقة`;
            } else {
                document.getElementById('live-time-left').textContent = `الفعالية التالية تبدأ بعد ${minsToStart} دقيقة`;
            }

            document.getElementById('live-progress-percent').textContent = `0%`;
            document.getElementById('live-progress-bar-fill').style.width = `0%`;

            const nextTeaser = document.getElementById('live-next-teaser');
            nextTeaser.style.display = 'flex';
            document.getElementById('live-next-activity-text').textContent = `النشاط القادم: ${nextAct.title} (${nextAct.time})`;
        } else {
            // اليوم انتهى تماماً
            widget.style.display = 'none';
        }
    }

    /* ─── 5. تصفية وفلترة الأنشطة ─── */
    function applyFilter() {
        const starredIds = JSON.parse(localStorage.getItem('yc2_starred_activities') || '[]');
        const items = document.querySelectorAll('.activity-item');
        items.forEach(el => {
            let matchFilter = false;
            if (activeFilter === 'all') {
                matchFilter = true;
            } else if (activeFilter === 'starred') {
                matchFilter = starredIds.includes(el.id);
            } else {
                matchFilter = el.classList.contains(`type-${activeFilter}`);
            }

            if (matchFilter) {
                el.style.display = 'block';
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 10);
            } else {
                el.style.opacity = '0';
                el.style.transform = 'translateY(8px)';
                setTimeout(() => {
                    el.style.display = 'none';
                }, 200);
            }
        });
    }

    /* ─── 6. ربط التبويبات (Days) ─── */
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            selectedDay = this.dataset.day;
            
            const panel = document.getElementById(`prog-panel-day-${selectedDay}`);
            if (panel) panel.classList.add('active');
            
            // تحديث كارت الحالة والفلتر فوراً
            highlightNow();
            updateLiveWidget();
            applyFilter();
        });
    });

    /* ─── 7. ربط الفلاتر (Filter Pills) ─── */
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            activeFilter = this.dataset.filter;
            applyFilter();
        });
    });

    /* ─── 8. زر الانتقال للنشاط الحالي ─── */
    document.getElementById('jump-now-btn')?.addEventListener('click', () => {
        if (currentActivity) {
            // تفعيل يوم النشاط الحالي أولاً
            const dayTab = document.querySelector(`.day-tab[data-day="${currentActivity.day}"]`);
            if (dayTab) dayTab.click();
            
            const el = document.getElementById(currentActivity.id);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 250);
            }
        }
    });

    // تحميل البيانات وإطلاق التطبيق
    DataService.loadConference().then(data => {
        program = data.program || [];
        
        // تشغيل الرسم الأولي
        renderAll();
        
        // تأخير التمييز ليعمل الفلتر وحفظ التبويب
        setTimeout(() => {
            highlightNow();
            updateLiveWidget();
            applyFilter();
        }, 200);

        // تحديثات الحالة الحية كل 10 ثواني لمزامنة أفضل لـ Progress Bar والجدول
        setInterval(() => {
            updateLiveWidget();
            highlightNow();
        }, 10000);
    });
})();
