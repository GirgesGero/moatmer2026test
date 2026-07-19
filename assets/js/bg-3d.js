/* ═══════════════════════════════════════════════
   bg-3d.js — تحريك وتشغيل الخلفية ثلاثية الأبعاد
   مؤتمر خلطبيطة بالصلصة 2026
   ═══════════════════════════════════════════════ */

(function() {
    'use strict';

    const prefix = location.pathname.includes('/pages/') ? '../' : '';
    const logoPath = prefix + 'assets/img/لوجو المؤتمر .png';
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
        // تجنب التكرار لو تم استدعاؤه بالفعل
        if (document.getElementById('gsap-3d-bg-container')) return;

        // 3. إنشاء حاوية الـ DOM للخلفية
        const container = document.createElement('div');
        container.id = 'gsap-3d-bg-container';
        container.className = 'gsap-3d-bg-container';

        // محتوى الخلفية (الهالات النيون والشبكة المنظورية والشظايا)
        container.innerHTML = `
            <div class="gsap-3d-bg">
                <div class="bg-3d-orb bg-3d-orb-cyan"></div>
                <div class="bg-3d-orb bg-3d-orb-pink"></div>
                <div class="bg-3d-orb bg-3d-orb-purple"></div>
                <div class="bg-3d-grid"></div>
                <div class="bg-3d-card bg-3d-card-1">
                    <img src="${logoPath}" alt="شظية الشعار 1">
                </div>
                <div class="bg-3d-card bg-3d-card-2">
                    <img src="${logoPath}" alt="شظية الشعار 2">
                </div>
                <div class="bg-3d-card bg-3d-card-3">
                    <img src="${logoPath}" alt="شظية الشعار 3">
                </div>
            </div>
        `;

        // إدراج الحاوية كأول عنصر في الـ body لضمان بقائها في الخلفية
        document.body.insertBefore(container, document.body.firstChild);

        // 4. إطلاق حركة عائمة انسيابية للهالات الملونة
        gsap.to('.bg-3d-orb-cyan', {
            x: '25vw',
            y: '15vh',
            duration: 24,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.bg-3d-orb-pink', {
            x: '-20vw',
            y: '-25vh',
            duration: 28,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.bg-3d-orb-purple', {
            x: '15vw',
            y: '-10vh',
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1
        });

        // 5. حركة اهتزاز بطيئة للشظايا ثلاثية الأبعاد
        gsap.to('.bg-3d-card-1', {
            y: '+=15',
            rotationZ: '+=6',
            duration: 6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.bg-3d-card-2', {
            y: '-=12',
            rotationZ: '-=8',
            duration: 7,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.5
        });

        gsap.to('.bg-3d-card-3', {
            y: '+=8',
            rotationZ: '+=4',
            duration: 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.2
        });

        // 6. التحريك التفاعلي ثلاثي الأبعاد مع حركة الفأرة
        let hasMovedMouse = false;
        
        // تحريك تلقائي بطيء جداً كحالة افتراضية للهواتف وشاشات اللمس
        const ambientTween = gsap.to('.gsap-3d-bg', {
            rotateY: 3,
            rotateX: 2,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        document.addEventListener('mousemove', function(e) {
            if (!hasMovedMouse) {
                hasMovedMouse = true;
                ambientTween.kill(); // إيقاف التحريك التلقائي بمجرد بدء تفاعل الفأرة
            }

            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx; // من -1 إلى 1
            const dy = (e.clientY - cy) / cy; // من -1 إلى 1

            // تدوير الخلفية بالكامل لإعطاء منظور العمق ثلاثي الأبعاد
            gsap.to('.gsap-3d-bg', {
                rotateY: dx * 10,
                rotateX: -dy * 10,
                duration: 1.2,
                ease: 'power2.out'
            });

            // تحريك الشظايا بنسب إزاحة مختلفة وتدويرها في الفراغ
            gsap.to('.bg-3d-card-1', {
                x: dx * 45,
                y: dy * 45,
                rotationY: dx * 15,
                rotationX: -dy * 15,
                duration: 1.2,
                ease: 'power2.out'
            });

            gsap.to('.bg-3d-card-2', {
                x: dx * -35,
                y: dy * -35,
                rotationY: dx * -10,
                rotationX: -dy * -10,
                duration: 1.5,
                ease: 'power2.out'
            });

            gsap.to('.bg-3d-card-3', {
                x: dx * 25,
                y: dy * -25,
                rotationY: dx * 8,
                rotationX: -dy * 8,
                duration: 1.8,
                ease: 'power2.out'
            });
        });
    }
})();
