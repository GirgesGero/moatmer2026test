/* workshops.js — منطق عرض ورش العمل المحدث بشكل ثابت وحتمي مع عداد تنازلي للمهام */
(function () {
    'use strict';

    const modal      = document.getElementById('workshopModal');
    const modalTitle = document.getElementById('ws-modal-title');
    const modalBody  = document.getElementById('ws-modal-body');
    let bsModal;
    let countdownInterval = null;

    // البيانات الثابتة والمضمونة 100% لورش العمل (لتفادي مشاكل الكاش والظهور)
    const workshopsData = {
        1: {
            day: 1,
            title: "فك الشفرة: من يقود فكرك؟ 🧠",
            speaker: "فريق الورش والتدريب",
            time: "7:00 pm - 9:00 pm",
            midTimeStr: "20:00", // منتصف الوقت الفعلي (8:00 مساءً)
            place: "قاعة ورش العمل",
            summary: "اكتشف المؤثرات الخفية التي تشكل أفكارك اليومية وقراراتك الشخصية في جلسة تفاعلية شيقة.",
            practicalApplication: "تحدي 'فرز الأصوات': تمرين تفاعلي للتمييز بين ضجيج السوشيال ميديا وصوت الضمير الهادئ، وفرز القناعات المنتشرة لاكتشاف الحقيقة.",
            objectives: [
                "مصادر المؤثرة علي فكر الشباب",
                "الفرق بين صوت المجتمع و صوت الله",
                "ليس كل ماهو منتشر صحيح"
            ],
            tasks: [
                "1 قريبا",
                "تحديد أهم 3 مصادر مؤثرة على فكر مجموعتكم وعرضها",
                "كتابة الفرق الجوهري بين صوت المجتمع وصوت الله",
                "تسليم ورقة التحدي الأول للمشرف"
            ]
        },
        2: {
            day: 2,
            title: "البوصلة والذكاء الاصطناعي: من القائد؟ 🧭🤖",
            speaker: "فريق الورش والتدريب",
            time: "7:00 pm - 9:00 pm",
            midTimeStr: "20:00", // منتصف الوقت الفعلي (8:00 مساءً)
            place: "قاعة ورش العمل",
            summary: "رحلة ممتعة لمعرفة ما يقود حياتك، وكيف تكون قائداً متميزاً في عصر التكنولوجيا والذكاء الاصطناعي.",
            practicalApplication: "محاكاة 'القيادة الذكية': مواقف حية لمواجهة التضليل التكنولوجي، وتمثيل أدوار للفرق بين القائد والمسيطر في الحياة اليومية.",
            objectives: [
                "اكتشاف ما يقود حياتي",
                "فهم الفرق بين القيادي و المسيطر",
                "التعامل الصحيح مع التكنولوجيا و AI"
            ],
            tasks: [
                "1 قريبا",
                "تحديد المحرك الأساسي لحياة أعضاء المجموعة",
                "إعداد مقارنة عملية بين صفات القائد والمسيطر",
                "كتابة ميثاق المجموعة للتعامل الصحيح مع الـ AI"
            ]
        },
        3: {
            day: 3,
            title: "خريطة الطريق والشخصيات السبعة 🗺️👤",
            speaker: "فريق الورش والتدريب",
            time: "2:00 pm - 4:00 pm",
            midTimeStr: "15:00", // منتصف الوقت الفعلي (3:00 مساءً)
            place: "قاعة ورش العمل",
            summary: "تعلم المعايير الذهبية لتقييم مسارك الشخصي والروحي، واكتشف أسرار الشخصيات السبعة.",
            practicalApplication: "اختبار 'الشخصيات السبعة': تمرين ممتع لاكتشاف نمط شخصيتك وتحديد خطوات عملية للتأكد من السير في الطريق الصحيح.",
            objectives: [
                "أزاي أعرف اني ماشي صح",
                "شخصيات السابعة"
            ],
            tasks: [
                "1 قريبا",
                "تحديد 3 معايير عملية للتأكد من السير في الطريق الصحيح",
                "تحديد أنماط الشخصيات السبعة لأعضاء مجموعتك",
                "تقديم التقييم النهائي لورش العمل"
            ]
        }
    };

    function openModal(dayNum) {
        const ws = workshopsData[dayNum];
        if (!ws || !modal) return;
        
        // إيقاف أي عداد تنازلي نشط سابقاً لمنع التعارض
        if (countdownInterval) clearInterval(countdownInterval);

        modalTitle.innerHTML = `<span style="color:#fb7185">${ws.title}</span>`;
        
        const objectivesHtml = (ws.objectives || []).map((obj, idx) => `
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

            <!-- حاوية العداد التنازلي التفاعلي -->
            <div id="ws-lock-container" class="ws-countdown-wrap">
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">
                    <i class="bi bi-lock-fill text-warning me-1"></i> سيتم فتح المهام والتحديات المطلوبة بعد:
                </div>
                <div class="ws-countdown-timer" id="ws-countdown-display">00:00:00</div>
                <div style="font-size:0.7rem; color:rgba(251, 191, 36, 0.6); font-weight:600;">(تنبيه: تُفتح المهام تلقائياً في منتصف وقت الورشة)</div>
            </div>

            <!-- حاوية المهام التفاعلية -->
            <div id="ws-tasks-container" class="ws-tasks-wrap" style="display:none;">
                <div class="section-label mb-3" style="color:#10b981; font-size:0.95rem; font-weight:800; display:flex; align-items:center; gap:6px;">
                    <i class="bi bi-unlock-fill text-success"></i> 
                    <span>المهام والتحديات النشطة للمجموعات</span>
                </div>
                <div id="ws-tasks-list"></div>
            </div>
        `;
        
        if (!bsModal) bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // تشغيل العداد التنازلي التفاعلي
        setupCountdown(ws);
    }

    function setupCountdown(ws) {
        const display = document.getElementById('ws-countdown-display');
        const lockWrap = document.getElementById('ws-lock-container');
        const tasksWrap = document.getElementById('ws-tasks-container');
        const tasksList = document.getElementById('ws-tasks-list');
        
        if (!display || !lockWrap || !tasksWrap || !tasksList) return;

        // توليد HTML المهام
        const savedCompleted = JSON.parse(localStorage.getItem(`ws_completed_tasks_${ws.day}`) || '[]');
        tasksList.innerHTML = (ws.tasks || []).map((task, idx) => {
            const isCompleted = savedCompleted.includes(idx);
            const compClass = isCompleted ? 'completed' : '';
            const checkIcon = isCompleted ? '<i class="bi bi-check-lg"></i>' : '';
            return `
                <div class="ws-task-item ${compClass}" onclick="toggleTask(${ws.day}, ${idx}, this)">
                    <div class="ws-task-checkbox">${checkIcon}</div>
                    <span class="ws-task-text">${task}</span>
                </div>
            `;
        }).join('');

        // حساب وقت منتصف الورشة الفعلي المعتمد 100%
        // تواريخ المؤتمر الفعلية: اليوم 1 (10 أغسطس 2026)، اليوم 2 (11 أغسطس 2026)، اليوم 3 (12 أغسطس 2026)
        const conferenceDates = {
            1: new Date(2026, 7, 10, 20, 0, 0), // 10 أغسطس الساعة 8:00 مساءً
            2: new Date(2026, 7, 11, 20, 0, 0), // 11 أغسطس الساعة 8:00 مساءً
            3: new Date(2026, 7, 12, 15, 0, 0)  // 12 أغسطس الساعة 3:00 مساءً
        };
        
        const targetMs = (conferenceDates[ws.day] || new Date()).getTime();

        function updateTimer() {
            const diff = targetMs - Date.now();
            if (diff <= 0) {
                // انتهاء الوقت وفتح المهام!
                clearInterval(countdownInterval);
                lockWrap.style.display = 'none';
                tasksWrap.style.display = 'block';
                return;
            }

            const hrs = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            
            const formatNum = (n) => String(n).padStart(2, '0');
            display.textContent = `${formatNum(hrs)}:${formatNum(mins)}:${formatNum(secs)}`;
        }

        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    }

    // دالة تفاعلية لتبديل حالة المهمة وحفظها
    window.toggleTask = function(dayNum, idx, el) {
        if (!el) return;
        const savedCompleted = JSON.parse(localStorage.getItem(`ws_completed_tasks_${dayNum}`) || '[]');
        
        let newSaved;
        if (savedCompleted.includes(idx)) {
            newSaved = savedCompleted.filter(i => i !== idx);
            el.classList.remove('completed');
            el.querySelector('.ws-task-checkbox').innerHTML = '';
        } else {
            newSaved = [...savedCompleted, idx];
            el.classList.add('completed');
            el.querySelector('.ws-task-checkbox').innerHTML = '<i class="bi bi-check-lg"></i>';
            
            // صوت أو توست نجاح عند إتمام المهمة
            if (window.showToast) {
                window.showToast('أحسنت! تم إتمام المهمة بنجاح 🎉', 'success');
            }
        }
        localStorage.setItem(`ws_completed_tasks_${dayNum}`, JSON.stringify(newSaved));
    };

    // تصدير الدالة للنطاق العالمي ليتم استدعاؤها من الـ onclick بالـ HTML
    window.openWorkshopModal = openModal;

    // ربط التنقل بالتبويبات
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.day-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`ws-panel-day-${this.dataset.day}`)?.classList.add('active');
        });
    });

    // عند التحميل: هل يوجد id محدد في الرابط لتوجيه المستخدم للورشة مباشرة؟
    // المعرفات المتوقعة من برنامج المؤتمر: d1-w1, d2-w1, d3-w1
    const params = new URLSearchParams(location.search);
    const directId = params.get('id');
    if (directId) {
        let targetDay = null;
        if (directId === 'd1-w1') targetDay = 1;
        else if (directId === 'd2-w1') targetDay = 2;
        else if (directId === 'd3-w1') targetDay = 3;

        if (targetDay) {
            document.querySelector(`.day-tab[data-day="${targetDay}"]`)?.click();
            setTimeout(() => openModal(targetDay), 200);
        }
    }
})();
