/* ═══════════════════════════════════════════════
   bg-3d.js — تحريك وتشغيل الخلفية ثلاثية الأبعاد المطورة
   مؤتمر خلطبيطة بالصلصة 2026
   ═══════════════════════════════════════════════ */

(function() {
    'use strict';

    const prefix = location.pathname.includes('/pages/') ? '../' : '';
    // ترميز اسم الملف لتجنب مشاكل خوادم الويب وتشفير الحروف العربية
    const logoPath = prefix + 'assets/img/%D9%84%D9%88%D8%AC%D9%88%20%D8%A7%D9%84%D9%85%D8%A4%D8%AA%D9%85%D8%B1%20.png';
    const cssPath = prefix + 'assets/css/bg-3d.css?v=2.6';

    // 1. تحميل ملف التنسيق bg-3d.css ديناميكياً
    if (!document.querySelector(`link[href*="bg-3d.css"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
    }

    // 2. تحميل مكتبة GSAP من CDN عند الحاجة
    if (typeof gsap === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
        script.async = true;
        script.onload = init3D;
        document.head.appendChild(script);
    } else {
        init3D();
    }

    function init3D() {
        // التحقق من وجود body لتجنب الأخطاء البرمجية لو تم استدعاء الملف في الهيدر مبكراً
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', init3D);
            return;
        }

        // تجنب التكرار لو تم استدعاؤه بالفعل
        if (document.getElementById('gsap-3d-bg-container')) return;

        // 3. إنشاء حاوية الـ DOM للخلفية
        const container = document.createElement('div');
        container.id = 'gsap-3d-bg-container';
        container.className = 'gsap-3d-bg-container';

        // محتوى الخلفية (الهالات النيون والشبكة المنظورية والشظايا وحقل الغبار)
        container.innerHTML = `
            <div class="gsap-3d-bg">
                <div class="bg-3d-orb bg-3d-orb-cyan"></div>
                <div class="bg-3d-orb bg-3d-orb-pink"></div>
                <div class="bg-3d-orb bg-3d-orb-purple"></div>
                <div class="bg-3d-grid"></div>
                <div class="bg-3d-card bg-3d-card-cyan bg-3d-card-1">
                    <img src="${logoPath}" alt="شظية الشعار 1">
                </div>
                <div class="bg-3d-card bg-3d-card-pink bg-3d-card-2">
                    <img src="${logoPath}" alt="شظية الشعار 2">
                </div>
                <div class="bg-3d-card bg-3d-card-purple bg-3d-card-3">
                    <img src="${logoPath}" alt="شظية الشعار 3">
                </div>
                <div class="bg-3d-dust-field" id="bg-3d-dust-field" style="position:absolute;width:100%;height:100%;transform-style:preserve-3d;"></div>
            </div>
        `;

        // إدراج الحاوية كأول عنصر في الـ body لضمان بقائها في الخلفية
        document.body.insertBefore(container, document.body.firstChild);

        // 4. توليد جزيئات الغبار الفضائي عشوائياً في الفضاء ثلاثي الأبعاد
        const dustField = document.getElementById('bg-3d-dust-field');
        const DUST_COUNT = 25;
        for (let i = 0; i < DUST_COUNT; i++) {
            const dust = document.createElement('div');
            dust.className = 'bg-3d-dust';
            
            // توزيع عشوائي على المحاور X و Y و Z
            const x = Math.random() * 100; // نسبة مئوية لعرض الشاشة
            const y = Math.random() * 100; // نسبة مئوية لارتفاع الشاشة
            const initialZ = -800 + Math.random() * 650; // عمق عشوائي من -800 إلى -150
            const speedFactor = 0.2 + Math.random() * 0.45; // سرعة تحرك مختلفة مع التمرير

            dust.style.left = `${x}%`;
            dust.style.top = `${y}%`;
            
            // تخزين القيم كبيانات مخصصة للتحكم بها في مستمع التمرير
            dust.dataset.initialZ = initialZ;
            dust.dataset.speedFactor = speedFactor;

            // ضبط الموضع ثلاثي الأبعاد المبدئي للجزيء
            gsap.set(dust, { z: initialZ });
            dustField.appendChild(dust);
        }

        // 5. إطلاق حركة عائمة انسيابية مستمرة للهالات الملونة
        gsap.to('.bg-3d-orb-cyan', {
            x: '20vw',
            y: '12vh',
            duration: 25,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.bg-3d-orb-pink', {
            x: '-18vw',
            y: '-20vh',
            duration: 29,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.bg-3d-orb-purple', {
            x: '12vw',
            y: '-8vh',
            duration: 22,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.5
        });

        // 6. التحريك المبدئي والاهتزاز العائم للشظايا ثلاثية الأبعاد
        // (تأثير تمايل مستمر لإعطاء انطباع عدم الجاذبية)
        gsap.to('.bg-3d-card-1', {
            y: '+=10',
            rotationZ: '+=4',
            duration: 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.bg-3d-card-2', {
            y: '-=8',
            rotationZ: '-=5',
            duration: 6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.3
        });

        gsap.to('.bg-3d-card-3', {
            y: '+=6',
            rotationZ: '+=3',
            duration: 4.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.7
        });

        // 7. التحريك التفاعلي مع حركة الفأرة (تميل الخلفية بالكامل كأنها عالم ثلاثي الأبعاد)
        let hasMovedMouse = false;
        
        // تحريك تلقائي هادئ قبل تحرك الفأرة (أو على الموبايل)
        const ambientTween = gsap.to('.gsap-3d-bg', {
            rotateY: 2,
            rotateX: 1.5,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        document.addEventListener('mousemove', function(e) {
            if (!hasMovedMouse) {
                hasMovedMouse = true;
                ambientTween.kill(); // إيقاف التحريك التلقائي بمجرد استشعار حركة الفأرة
            }

            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx; // من -1 إلى 1
            const dy = (e.clientY - cy) / cy; // من -1 إلى 1

            // تدوير الفضاء بالكامل
            gsap.to('.gsap-3d-bg', {
                rotateY: dx * 8,
                rotateX: -dy * 8,
                duration: 1.2,
                ease: 'power2.out'
            });
        });

        // 8. التحريك والربط مع التمرير (تحريك عناصر الشعار في العمق Z وتدويرها وتلاشيها)
        let lastScrollY = window.scrollY;
        
        document.addEventListener('scroll', function() {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            
            // بطاقة الشعار 1 - تطير للأمام وتدور وتتلاشى
            const z1 = -100 + scrollY * 0.8; // حركة سريعة للأمام
            const op1 = z1 > 200 ? Math.max(0, 1 - (z1 - 200) / 150) : 1; // تتلاشى بعد عبور z=200px
            gsap.to('.bg-3d-card-1', {
                z: z1,
                opacity: op1,
                rotationX: scrollY * 0.12,
                rotationY: scrollY * 0.08,
                duration: 0.8,
                ease: 'power1.out'
            });

            // بطاقة الشعار 2 - حركة متوسطة
            const z2 = -350 + scrollY * 0.6;
            const op2 = z2 > 200 ? Math.max(0, 1 - (z2 - 200) / 150) : 1;
            gsap.to('.bg-3d-card-2', {
                z: z2,
                opacity: op2,
                rotationX: -scrollY * 0.08,
                rotationY: scrollY * 0.15,
                duration: 1.0,
                ease: 'power1.out'
            });

            // بطاقة الشعار 3 - حركة أعمق وأبطأ
            const z3 = -600 + scrollY * 0.45;
            const op3 = z3 > 200 ? Math.max(0, 1 - (z3 - 200) / 150) : 1;
            gsap.to('.bg-3d-card-3', {
                z: z3,
                opacity: op3,
                rotationX: scrollY * 0.15,
                rotationY: -scrollY * 0.10,
                duration: 1.2,
                ease: 'power1.out'
            });

            // تحريك الشبكة التكنولوجية في العمق كذلك مع التمرير
            gsap.to('.bg-3d-grid', {
                z: -300 + scrollY * 0.25,
                duration: 1.4,
                ease: 'power1.out'
            });

            // تحريك جزيئات الغبار الفضائي عشوائية العمق
            const dustElements = document.querySelectorAll('.bg-3d-dust');
            dustElements.forEach(function(dust, idx) {
                const initialZ = parseFloat(dust.dataset.initialZ);
                const speedFactor = parseFloat(dust.dataset.speedFactor);
                const currentZ = initialZ + scrollY * speedFactor;
                
                // تلاشي الجزيئات بعد اقترابها من الكاميرا
                const opDust = currentZ > 100 ? Math.max(0, 0.6 - (currentZ - 100) / 150) : 0.6;

                gsap.to(dust, {
                    z: currentZ,
                    opacity: opDust,
                    duration: 0.8 + (idx % 3) * 0.2,
                    ease: 'power1.out'
                });
            });

            lastScrollY = scrollY;
        });
    }
})();
