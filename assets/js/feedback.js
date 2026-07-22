/* ═══════════════════════════════════════════════
   feedback.js — منطق نموذج إبداء الرأي
   مؤتمر الشباب 2026
   ═══════════════════════════════════════════════ */
(function () {
    'use strict';

    function checkFormValidity() {
        const name = $('#fb-name').val().trim();
        const experience = $('#fb-experience').val().trim();
        const destination = $('#fb-destination').val().trim();
        const rating = parseInt($('#fb-rating').val() || '0');
        
        const isValid = name !== '' && experience !== '' && destination !== '' && rating > 0;
        $('#fb-submit').prop('disabled', !isValid);
    }

    function getDeviceInfo() {
        const userAgent = navigator.userAgent;
        let deviceType = 'Unknown';
        if (/iPhone/i.test(userAgent)) deviceType = 'iPhone';
        else if (/iPad/i.test(userAgent)) deviceType = 'iPad';
        else if (/Android/i.test(userAgent)) deviceType = /Mobile/i.test(userAgent) ? 'Android Phone' : 'Android Tablet';
        else if (/Windows Phone/i.test(userAgent)) deviceType = 'Windows Phone';
        else if (/Mac/i.test(userAgent)) deviceType = 'Mac';
        else if (/Windows/i.test(userAgent)) deviceType = 'Windows PC';
        else if (/Linux/i.test(userAgent)) deviceType = 'Linux PC';

        let osInfo = 'Unknown OS', browserInfo = 'Unknown Browser';
        if (/Android/i.test(userAgent)) { 
            const v = userAgent.match(/Android\s([\d.]+)/); 
            osInfo = v ? `Android ${v[1]}` : 'Android'; 
        }
        if (/iPhone|iPad/i.test(userAgent)) { 
            const v = userAgent.match(/OS\s([\d_]+)/); 
            osInfo = v ? `iOS ${v[1].replace(/_/g, '.')}` : 'iOS'; 
        }
        if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browserInfo = 'Chrome';
        else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browserInfo = 'Safari';
        else if (/Firefox/i.test(userAgent)) browserInfo = 'Firefox';
        else if (/Edge/i.test(userAgent)) browserInfo = 'Edge';

        const now = new Date();
        return { 
            deviceType, 
            os: osInfo, 
            browser: browserInfo, 
            userAgent, 
            time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), 
            date: now.toLocaleDateString('ar-EG') 
        };
    }

    function submitFeedback() {
        const name = $('#fb-name').val().trim();
        const experience = $('#fb-experience').val().trim();
        const destination = $('#fb-destination').val().trim();
        const ratingVal = parseInt($('#fb-rating').val() || '0');

        if (!name || !experience || !destination || ratingVal === 0) { 
            alert('لو سمحت كمّل كل البيانات وقيّم المؤتمر بالنجوم!'); 
            return; 
        }

        const starsString = '⭐'.repeat(ratingVal);
        const formattedExperience = `[التقييم: ${starsString}] ${experience}`;

        // 1. الإرسال إلى طبقة Google Apps Script الموحدة
        if (window.DataService && typeof window.DataService.submitFeedback === 'function') {
            window.DataService.submitFeedback(name, formattedExperience, destination);
        }

        const deviceInfo = getDeviceInfo();
        const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfw4IwP36zSLoYRO5k5YKCkC7BMcnxmr3emWVtMZr-QDF52Fw/formResponse';

        $.ajax({
            url: formUrl,
            method: 'POST',
            data: {
                'entry.1430254715': name,
                'entry.216982914': destination,
                'entry.1118671607': formattedExperience,
                'entry.2017420717': `${deviceInfo.date} ${deviceInfo.time}`,
                'entry.661154536': `${deviceInfo.deviceType} - ${deviceInfo.os} - ${deviceInfo.browser}`
            },
            dataType: 'xml',
            crossDomain: true
        }).always(function() {
            showSuccessCelebration();
            $('#fb-destination').val('');
            $('#fb-experience').val('');
            $('#fb-rating').val('0');
            $('.rating-star').removeClass('active bi-star-fill').addClass('bi-star');
            checkFormValidity();
        });
    }

    function showSuccessCelebration() {
        const $celebration = $('#success-celebration');
        $celebration.addClass('show');
        createConfetti();
        setTimeout(function() {
            $celebration.css({ transition: 'all 0.5s ease', opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' });
            setTimeout(function() {
                $celebration.removeClass('show').css({ opacity: '', transform: '', transition: '' });
            }, 500);
        }, 3000);
    }

    function createConfetti() {
        const colors = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#22d3ee', '#34d399', '#fbbf24', '#a78bfa'];
        const shapes = ['50%', '3px', '0']; // circle, rounded square, square
        for (let i = 0; i < 60; i++) {
            setTimeout(function() {
                const $confetti = $('<div class="confetti"></div>');
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                const size = 6 + Math.random() * 10;
                $confetti.css({
                    left: Math.random() * 100 + 'vw',
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    width: size + 'px',
                    height: size + 'px',
                    borderRadius: shape,
                    animationDuration: (2 + Math.random() * 3) + 's',
                    animationDelay: Math.random() * 0.5 + 's'
                });
                $('body').append($confetti);
                setTimeout(function() { $confetti.remove(); }, 5000);
            }, i * 25);
        }
    }

    $(document).ready(function() {
        // التحقق من المدخلات بشكل فوري
        $('#fb-name, #fb-experience, #fb-destination').on('input', checkFormValidity);
        
        // ربط النجوم التفاعلية
        $('.rating-star').on('click', function () {
            const val = parseInt($(this).data('value'));
            $('#fb-rating').val(val);
            
            // تحديث كلاسات النجوم
            $('.rating-star').each(function () {
                const starVal = parseInt($(this).data('value'));
                if (starVal <= val) {
                    $(this).removeClass('bi-star').addClass('bi-star-fill active');
                } else {
                    $(this).removeClass('bi-star-fill active').addClass('bi-star');
                }
            });
            
            checkFormValidity();
        });
        
        // ربط الإرسال
        $('#fb-submit').on('click', submitFeedback);

        // جلب اسم المستخدم تلقائياً من المسودة المتاحة بالمتصفح
        try {
            const savedProfile = localStorage.getItem('yc2_user_profile');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                if (profile && profile.name) {
                    $('#fb-name').val(profile.name);
                    checkFormValidity();
                }
            }
        } catch (e) {
            console.log('لا توجد بيانات مستخدم محفوظة.');
        }
    });
})();
