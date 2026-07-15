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
    let currentConferenceDay = null; // اليوم الرقمي الفعلي للمؤتمر (1, 2, 3, 4)
    let dataMeta = null; // الميتا المجلوبة من ملف البيانات

    function formatArabicTimeSingle(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length !== 2) return timeStr;
        
        let h = parseInt(parts[0]);
        const m = parts[1];
        let ampm = 'am';
        
        if (h >= 12) {
            ampm = 'pm';
            if (h > 12) h -= 12;
        } else if (h === 0) {
            h = 12;
        }
        
        return `${h}:${m} ${ampm}`;
    }

    function formatArabicTimeRange(startTime, endTime) {
        const formatTime = (timeStr) => {
            if (!timeStr) return null;
            const parts = timeStr.split(':');
            if (parts.length !== 2) return null;
            
            let h = parseInt(parts[0]);
            const m = parts[1];
            let ampm = 'am';
            
            if (h >= 12) {
                ampm = 'pm';
                if (h > 12) h -= 12;
            } else if (h === 0) {
                h = 12;
            }
            
            return { formatted: `${h}:${m}`, ampm: ampm };
        };

        const start = formatTime(startTime);
        const end = formatTime(endTime);

        if (start && end) {
            return `
                <span class="time-prefix">من</span>
                <span class="time-num">${start.formatted}</span>
                <span class="time-suffix">${start.ampm}</span>
                <span class="time-connector">إلى</span>
                <span class="time-num">${end.formatted}</span>
                <span class="time-suffix">${end.ampm}</span>
            `;
        } else if (start) {
            return `
                <span class="time-prefix">الساعة</span>
                <span class="time-num">${start.formatted}</span>
                <span class="time-suffix">${start.ampm}</span>
            `;
        }
        return '';
    }

    /* ─── 1. رسم بطاقة نشاط ─── */
    function renderActivity(act) {
        const t   = TYPE_ICONS[act.type] || TYPE_ICONS.other;
        const div = document.createElement('div');
        div.className = `activity-item type-${act.type}`;
        div.id = act.id;

        const timeStr = formatArabicTimeRange(act.time, act.endTime);

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
            <div class="activity-title"><i class="${t.icon}" style="color:${t.color};margin-left:.4rem;font-size:.85em"></i>${escapeHTML(act.title)}</div>
            <div class="activity-meta">
                ${act.place ? `<span class="activity-chip"><i class="bi bi-geo-alt-fill"></i>${escapeHTML(act.place)}</span>` : ''}
                ${act.notes ? `<span class="activity-chip"><i class="bi bi-chat-text-fill"></i>${escapeHTML(act.notes)}</span>` : ''}
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

    function escapeHTML(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
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
        
        // إذا كنا خارج أيام المؤتمر، لا نميز أي فقرات بـ "الآن" أو "التالية" في الجدول
        if (currentConferenceDay === null) {
            YC.highlightCurrentActivity(program, { currentDay: null });
            return;
        }
        
        currentActivity = YC.highlightCurrentActivity(program, { currentDay: currentConferenceDay });

        // إضافة شارة "الآن" للنشاط الحالي وتفعيل تبويبه
        if (currentActivity) {
            const el = document.getElementById(currentActivity.id);
            if (el) {
                const badge = document.createElement('span');
                badge.className = 'now-badge';
                badge.innerHTML = '<span class="now-dot"></span> الآن';
                el.querySelector('.activity-title')?.prepend(badge);
            }
        }

        // حساب وإضافة شارة "التالية" للنشاط التالي لليوم المختار حالياً
        const targetDay = currentActivity ? currentActivity.day : parseInt(selectedDay);
        
        // نظهر شارة "التالية" فقط إذا كان التبويب المختار هو اليوم الحالي الفعلي للمؤتمر
        if (targetDay !== currentConferenceDay) return;

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

    function getDayDate(dayNum, meta) {
        if (!meta || !meta.days) return null;
        const found = meta.days.find(d => d.day === dayNum);
        if (!found) return null;
        
        const year = meta.year || 2026;
        const [d, m] = found.date.split('/').map(Number);
        return new Date(year, m - 1, d);
    }

    function getConferenceState(meta) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const day1Date = getDayDate(1, meta);
        const day4Date = getDayDate(4, meta);
        
        if (!day1Date || !day4Date) return { status: 'unknown' };
        
        if (today < day1Date) {
            const diffTime = Math.abs(day1Date - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { status: 'before', daysRemaining: diffDays };
        } else if (today > day4Date) {
            return { status: 'after' };
        } else {
            for (let day = 1; day <= 4; day++) {
                const dDate = getDayDate(day, meta);
                if (dDate && dDate.getTime() === today.getTime()) {
                    return { status: 'during', currentDay: day };
                }
            }
        }
        return { status: 'unknown' };
    }

    /* ─── 4. تحديث بطاقة الـ Widget للنشاط الجاري (Live Status) ─── */
    function updateLiveWidget() {
        const widget = document.getElementById('live-status-widget');
        if (!widget) return;

        const state = getConferenceState(dataMeta);

        // إعادة تعيين أنماط بادج الحالة الافتراضية
        const badge = widget.querySelector('.live-badge-now');
        if (badge) {
            badge.innerHTML = '<span class="blink-dot"></span> الآن';
            badge.style.background = '';
            badge.style.borderColor = '';
            badge.style.color = '';
        }

        // الحالة أ: قبل بدء المؤتمر
        if (state.status === 'before') {
            widget.style.display = 'block';
            if (badge) {
                badge.innerHTML = '⏳ قريباً';
                badge.style.background = 'rgba(245, 158, 11, 0.15)';
                badge.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                badge.style.color = '#fbbf24';
            }
            
            document.getElementById('live-activity-title').innerHTML = `
                <i class="bi bi-calendar-event-fill me-1" style="color:#fbbf24"></i> المؤتمر لم يبدأ بعد
            `;
            document.getElementById('live-time-left').textContent = `ينطلق المؤتمر يوم 10 أغسطس 2026`;
            document.getElementById('live-progress-percent').textContent = `باقي ${state.daysRemaining} يوم`;
            document.getElementById('live-progress-bar-fill').style.width = '0%';
            
            const nextTeaser = document.getElementById('live-next-teaser');
            if (nextTeaser) {
                nextTeaser.style.display = 'flex';
                document.getElementById('live-next-activity-text').textContent = 'النشاط الأول: التجمع والانطلاق (06:00 ص)';
            }
            return;
        }

        // الحالة ب: بعد انتهاء المؤتمر
        if (state.status === 'after') {
            widget.style.display = 'block';
            if (badge) {
                badge.innerHTML = '🕊️ ختام';
                badge.style.background = 'rgba(16, 185, 129, 0.15)';
                badge.style.borderColor = 'rgba(16, 185, 129, 0.35)';
                badge.style.color = '#34d399';
            }
            
            document.getElementById('live-activity-title').innerHTML = `
                <i class="bi bi-check-circle-fill me-1" style="color:#34d399"></i> انتهى المؤتمر بحمد الله
            `;
            document.getElementById('live-time-left').textContent = `نشوفكم في المؤتمر القادم!`;
            document.getElementById('live-progress-percent').textContent = `100%`;
            document.getElementById('live-progress-bar-fill').style.width = '100%';
            
            const nextTeaser = document.getElementById('live-next-teaser');
            if (nextTeaser) nextTeaser.style.display = 'none';
            return;
        }

        // الحالة ج: أثناء المؤتمر (نلتزم باليوم الحالي الفعلي)
        const now = new Date();
        const currentTotalMins = now.getHours() * 60 + now.getMinutes();

        const toMin = (str) => {
            if (!str) return null;
            const [h, m] = str.split(':').map(Number);
            return h * 60 + m;
        };

        const todayDay = state.currentDay;
        const viewingDay = parseInt(selectedDay);
        
        // إخفاء كارت البث المباشر للأنشطة إذا كان المستخدم يستعرض جدول يوم آخر غير اليوم الفعلي
        if (viewingDay !== todayDay) {
            widget.style.display = 'none';
            return;
        }

        const dayActivities = program.filter(a => a.day === todayDay)
            .sort((a, b) => a.time.localeCompare(b.time));
        
        let currentAct = null;
        let nextAct = null;

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

        if (!currentAct) {
            for (let i = 0; i < dayActivities.length; i++) {
                const start = toMin(dayActivities[i].time);
                if (start > currentTotalMins) {
                    nextAct = dayActivities[i];
                    break;
                }
            }
        }

        if (currentAct) {
            widget.style.display = 'block';
            document.getElementById('live-activity-title').innerHTML = `
                <i class="bi bi-play-circle-fill me-1" style="color:var(--primary-light)"></i> ${currentAct.title}
            `;
            
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
                document.getElementById('live-next-activity-text').textContent = `النشاط التالي: ${nextAct.title} (${formatArabicTimeSingle(nextAct.time)})`;
            } else {
                nextTeaser.style.display = 'none';
            }
        } else if (nextAct) {
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
            document.getElementById('live-next-activity-text').textContent = `النشاط القادم: ${nextAct.title} (${formatArabicTimeSingle(nextAct.time)})`;
        } else {
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

    /* ─── 6. ربط التبويبات (Days) عن طريق تفويض الأحداث (Vanilla JS) ─── */
    document.addEventListener('click', function(e) {
        const tab = e.target.closest('.day-tab');
        if (!tab) return;
        
        document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        selectedDay = tab.getAttribute('data-day');
        
        const panel = document.getElementById(`prog-panel-day-${selectedDay}`);
        if (panel) panel.classList.add('active');
        
        // تحديث كارت الحالة والفلتر فوراً
        highlightNow();
        updateLiveWidget();
        applyFilter();
    });

    function formatArabicDate(dateStr) {
        if (!dateStr) return '';
        const months = {
            '1': 'يناير', '2': 'فبراير', '3': 'مارس', '4': 'أبريل',
            '5': 'مايو', '6': 'يونيو', '7': 'يوليو', '8': 'أغسطس',
            '9': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
        };
        const parts = dateStr.split('/');
        if (parts.length === 2) {
            const day = parts[0];
            const month = months[parts[1]] || parts[1];
            return `${day} ${month}`;
        }
        return dateStr;
    }

    function renderDayTabs(days) {
        const container = document.querySelector('.day-tabs');
        if (!container || !days || !days.length) return;
        
        const defaultDay = currentConferenceDay || 1;
        selectedDay = String(defaultDay); // تحديث selectedDay الافتراضي
        
        container.innerHTML = days.map(d => {
            const activeCls = d.day === defaultDay ? 'active' : '';
            const departureCls = d.day === 4 ? 'day-tab-departure' : '';
            const labelSub = d.day === 4 ? 'يوم الرحيل ✈️' : d.label;
            const beautifulDate = formatArabicDate(d.date);
            return `<button class="day-tab ${activeCls} ${departureCls}" data-day="${d.day}" role="tab">${beautifulDate}<span class="day-tab-sub">${labelSub}</span></button>`;
        }).join('');
        
        // تفعيل لوحة اليوم الافتراضي المناسب وإلغاء البقية
        document.querySelectorAll('.day-panel').forEach(p => {
            if (p.id === `prog-panel-day-${defaultDay}`) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    }

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

    function startApp() {
        if (!window.DataService) {
            setTimeout(startApp, 50);
            return;
        }

        DataService.loadConference().then(data => {
            program = data.program || [];
            dataMeta = data.meta;
            
            // حساب اليوم الحالي الفعلي وتحديد التبويب الافتراضي
            if (dataMeta) {
                const state = getConferenceState(dataMeta);
                if (state.status === 'during') {
                    currentConferenceDay = state.currentDay;
                } else if (state.status === 'after') {
                    currentConferenceDay = 4; // اليوم الأخير
                } else {
                    currentConferenceDay = null; // قبل المؤتمر
                }
            }

            // رسم تابات الأيام ديناميكياً من الميتا (تتأثر باليوم الحالي الفعلي)
            if (dataMeta && dataMeta.days) {
                renderDayTabs(dataMeta.days);
                
                // تحديث العنوان الفرعي بذكر تاريخ ونطاق المؤتمر
                const subtitle = document.querySelector('.page-header-sub');
                if (subtitle && dataMeta.year) {
                    const firstDate = formatArabicDate(dataMeta.days[0].date);
                    const lastDate = formatArabicDate(dataMeta.days[dataMeta.days.length - 1].date);
                    subtitle.textContent = `مؤتمر الشباب ${dataMeta.year} — من ${firstDate} إلى ${lastDate}`;
                }
            }
            
            // تشغيل الرسم الأولي لجميع الأيام
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
        }).catch(err => {
            console.error('Failed to load conference-data in program page:', err);
        });
    }

    // إطلاق التطبيق عند جاهزية الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }
})();
