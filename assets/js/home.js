/* ═══════════════════════════════════════════════
   home.js — منطق الصفحة الرئيسية
   مؤتمر الشباب 2026
═══════════════════════════════════════════════ */
(async function () {
    'use strict';

    await YC.loadPartials();

    let program = [];
    try {
        const data = await DataService.loadConference();
        program = data.program || [];
    } catch (e) {
        console.warn('تعذر تحميل بيانات البرنامج في الصفحة الرئيسية:', e);
    }

    /* ─── 1. تحية ديناميكية ─── */
    var greetingEl = document.getElementById('main-greeting');
    var profile = JSON.parse(localStorage.getItem('yc2_user_profile') || 'null');
    if (greetingEl) {
        var hour = new Date().getHours();
        var greet = 'اهلاً بك في خلطبيطة بالصلصة ❤️';
        if      (hour >= 5  && hour < 12) greet = 'صباح الخير، منور المؤتمر ☀️';
        else if (hour >= 12 && hour < 17) greet = 'يومك سعيد، وقت مبارك 🌟';
        else if (hour >= 17 && hour < 22) greet = 'مساء النور، المؤتمر في انتظارك 🌙';
        else                              greet  = 'سهرة مباركة في خلطبيطة بالصلصة ✨';
        if (profile && profile.name) greet = 'مرحباً يا ' + profile.name.split(' ')[0] + ' 👋';
        greetingEl.textContent = greet;
    }

    /* ─── 2. شريط الفعالية الحية (مضغوط) ─── */
    function updateLiveActivities() {
        if (program.length === 0) return;
        var pill = document.getElementById('live-compact');
        if (!pill) return;

        var now    = new Date();
        var nowMin = now.getHours() * 60 + now.getMinutes();
        var day    = now.getDate();
        var month  = now.getMonth();
        var year   = now.getFullYear();

        var dayNum = 1;
        if (year === 2026 && month === 7) { // 7 = أغسطس
            if (day === 11)      dayNum = 2;
            else if (day === 12) dayNum = 3;
            else if (day >= 13)  dayNum = 4;
        }

        var parseMin = function(t) {
            if (!t) return 0;
            var parts = t.split(':').map(Number);
            return parts[0] * 60 + parts[1];
        };

        var dayActs = program.filter(function(a) { return a.day === dayNum; });

        var currentAct = null, nextAct = null;
        for (var i = 0; i < dayActs.length; i++) {
            var a = dayActs[i];
            var s = parseMin(a.time);
            var e = parseMin(a.endTime || a.time);
            if (nowMin >= s && nowMin < e) { currentAct = a; nextAct = dayActs[i+1] || null; break; }
            else if (nowMin < s) { nextAct = a; break; }
        }

        if (!currentAct && !nextAct) { pill.style.display = 'none'; return; }
        pill.style.display = 'flex';

        var set = function(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        if (currentAct) {
            var rem = parseMin(currentAct.endTime) - nowMin;
            set('lp-now-title',     currentAct.title || '—');
            set('lp-now-remaining', rem > 0 ? 'باقي ' + rem + 'د' : 'تنتهي');
        } else {
            set('lp-now-title', 'وقت حر 🌴');
            set('lp-now-remaining', '');
        }

        var nextWrap = document.getElementById('lp-next-wrap');
        if (nextAct && nextWrap) {
            nextWrap.style.display = 'flex';
            var diff = parseMin(nextAct.time) - nowMin;
            set('lp-next-title', nextAct.title || '—');
            set('lp-next-in',    diff > 0 ? 'بعد ' + diff + 'د' : 'قريباً');
        } else if (nextWrap) {
            nextWrap.style.display = 'none';
        }
    }

    updateLiveActivities();
    setInterval(updateLiveActivities, 30000);

    /* ══════════════════════════════════════════════
       3. الدائرة التفاعلية
    ══════════════════════════════════════════════ */
    var dialWheel   = document.getElementById('dial-wheel');
    var dialNodes   = document.querySelectorAll('.dial-node');
    var dialDots    = document.querySelectorAll('.dial-dot');
    var dialWrapper = document.getElementById('dash-wheel-container');

    var nodeDetails = [
        { icon:'🎤', title:'المحاضرات الروحية',   desc:'محاضرات الأيام الثلاثة',          href:'lectures.html'      },
        { icon:'🛠', title:'ورش العمل التفاعلية', desc:'ورش عملية ومجموعات تفكير',        href:'workshops.html'     },
        { icon:'🎵', title:'ترانيم المؤتمر',      desc:'ترانيم وحلقة الصلاة والباند',     href:'hymns.html'         },
        { icon:'🗓', title:'برنامج المؤتمر',      desc:'الجدول الزمني للأيام الثلاثة',    href:'program.html'       },
        { icon:'🛏', title:'التسكين والغرف',       desc:'توزيع الغرف والأسرّة',            href:'accommodation.html' },
        { icon:'🚌', title:'الأتوبيس والمقاعد',   desc:'مقعدك ومشرف الرحلة وزملاءك',     href:'buses.html'         },
        { icon:'🙏', title:'الصلوات والأجبية',    desc:'صلوات باكر والنوم',               href:'prayer.html'        },
        { icon:'🎮', title:'الألعاب والمسابقات',   desc:'ألعاب XO وذاكرة ومتاهة المؤتمر',href:'games.html'         }
    ];

    var activeIndex     = 0;
    var isTransitioning = false;

    function navigateTo(href) {
        document.body.classList.add('page-transition-out');
        setTimeout(function() { window.location.href = href; }, 200);
    }

    /* ─── تحديث البادج ─── */
    function updateBadge(idx) {
        var nd  = nodeDetails[idx];
        var badge = document.getElementById('dial-active-badge');

        var setEl = function(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('dab-icon', nd.icon);
        setEl('dab-name', nd.title);
        setEl('dab-desc', nd.desc);

        if (badge) {
            badge.dataset.href = nd.href;
            /* تأثير الحركة */
            badge.classList.remove('changing');
            void badge.offsetWidth; /* reflow */
            badge.classList.add('changing');
        }
    }

    function rotateDialTo(index, instant) {
        if (isTransitioning && !instant) return;
        activeIndex = ((index % 8) + 8) % 8;

        var rotation = -90 - (activeIndex * 45);
        var ease     = 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)';

        if (dialWheel) {
            dialWheel.style.transition = instant ? 'none' : ease;
            dialWheel.style.transform  = 'rotate(' + rotation + 'deg)';
        }

        dialNodes.forEach(function(node, idx) {
            node.classList.toggle('active', idx === activeIndex);
        });

        dialDots.forEach(function(dot, i) {
            dot.classList.toggle('active', i === activeIndex);
        });

        if (!instant) updateBadge(activeIndex);

        if (!instant) {
            isTransitioning = true;
            setTimeout(function() { isTransitioning = false; }, 480);
        }
    }

    /* ─── نقر على عقدة ─── */
    dialNodes.forEach(function(node, idx) {
        node.addEventListener('click', function() {
            if (idx === activeIndex) {
                navigateTo(node.dataset.href);
            } else {
                rotateDialTo(idx);
            }
        });
    });

    /* ─── نقر على البادج → دخول مباشر ─── */
    var badge = document.getElementById('dial-active-badge');
    if (badge) {
        badge.addEventListener('click', function() {
            navigateTo(nodeDetails[activeIndex].href);
        });
        badge.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateTo(nodeDetails[activeIndex].href);
            }
        });
    }

    /* ─── أزرار التنقل (أعلى / أسفل) ─── */
    var btnUp   = document.getElementById('dial-btn-up');
    var btnDown = document.getElementById('dial-btn-down');
    if (btnUp)   btnUp.addEventListener('click',   function() { if (!isTransitioning) rotateDialTo(activeIndex - 1); });
    if (btnDown) btnDown.addEventListener('click',  function() { if (!isTransitioning) rotateDialTo(activeIndex + 1); });

    /* ─── نقاط المؤشر ─── */
    dialDots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            rotateDialTo(parseInt(this.dataset.index));
        });
    });

    /* ─── عجلة الماوس ─── */
    if (dialWrapper) {
        dialWrapper.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (!isTransitioning) rotateDialTo(activeIndex + (e.deltaY > 0 ? 1 : -1));
        }, { passive: false });
    }

    /* ─── سحب اللمس ─── */
    var tX = 0, tY = 0;
    if (dialWrapper) {
        dialWrapper.addEventListener('touchstart', function(e) {
            if (!e.touches.length) return;
            tX = e.touches[0].clientX;
            tY = e.touches[0].clientY;
        }, { passive: true });

        dialWrapper.addEventListener('touchmove', function(e) {
            if (isTransitioning || !e.touches.length) return;
            var dx = e.touches[0].clientX - tX;
            var dy = e.touches[0].clientY - tY;
            /* السحب العمودي يدور الدائرة */
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 25) {
                rotateDialTo(activeIndex + (dy > 0 ? 1 : -1));
                tX = e.touches[0].clientX;
                tY = e.touches[0].clientY;
            } else if (Math.abs(dx) > 28) {
                rotateDialTo(activeIndex + (dx > 0 ? -1 : 1));
                tX = e.touches[0].clientX;
                tY = e.touches[0].clientY;
            }
        }, { passive: true });
    }

    /* ─── تلميح السحب (يظهر مرة واحدة) ─── */
    if (!localStorage.getItem('yc2_hint_seen')) {
        var hint = document.querySelector('.dial-swipe-hint');
        if (hint) {
            setTimeout(function() { hint.classList.add('visible'); }, 1500);
            setTimeout(function() {
                hint.classList.remove('visible');
                localStorage.setItem('yc2_hint_seen', '1');
            }, 5000);
        }
    }

    /* ─── الحالة الابتدائية ─── */
    rotateDialTo(0, true);
    updateBadge(0);

})();
