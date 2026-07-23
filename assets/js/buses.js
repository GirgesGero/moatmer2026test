/* 
 * ==========================================
 * 1. تهيئة وإدارة بيانات مقاعد الأتوبيسات ديناميكياً
 * ==========================================
 */

let passengers = [];

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function generateBusHTML(busNum) {
    let rowsHtml = '';
    let seatNum = 1;

    // صفوف 1-5
    for (let r = 1; r <= 5; r++) {
        rowsHtml += `<div class="seat seat-col-1" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
        rowsHtml += `<div class="seat seat-col-2" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
        rowsHtml += `<div class="aisle-gap seat-col-3"></div>`;
        rowsHtml += `<div class="seat seat-col-4" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
        rowsHtml += `<div class="seat seat-col-5" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
    }

    // صف 6: باب + 2 مقاعد
    rowsHtml += `<div class="door-indicator">🪜🚪 سلم · باب</div>`;
    rowsHtml += `<div class="empty-space seat-col-2"></div>`;
    rowsHtml += `<div class="aisle-gap seat-col-3"></div>`;
    rowsHtml += `<div class="seat seat-col-4" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;
    rowsHtml += `<div class="seat seat-col-5" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;

    // صف 7
    rowsHtml += `<div class="empty-space seat-col-1"></div>`;
    rowsHtml += `<div class="empty-space seat-col-2"></div>`;
    rowsHtml += `<div class="aisle-gap seat-col-3"></div>`;
    rowsHtml += `<div class="seat seat-col-4" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;
    rowsHtml += `<div class="seat seat-col-5" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;

    // صفوف 8-12
    for (let r = 8; r <= 12; r++) {
        rowsHtml += `<div class="seat seat-col-1" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
        rowsHtml += `<div class="seat seat-col-2" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
        rowsHtml += `<div class="aisle-gap seat-col-3"></div>`;
        rowsHtml += `<div class="seat seat-col-4" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
        rowsHtml += `<div class="seat seat-col-5" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
        seatNum++;
    }

    // صف 13 خلفي
    rowsHtml += `<div class="seat seat-col-1" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;
    rowsHtml += `<div class="seat seat-col-2" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;
    rowsHtml += `<div class="seat seat-col-3 seat-middle" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;
    rowsHtml += `<div class="seat seat-col-4" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;
    rowsHtml += `<div class="seat seat-col-5" id="bus${busNum}-seat-${seatNum}" data-seat="${seatNum}"><div class="seat-number">${seatNum}</div><div class="passenger-name"></div></div>`;
    seatNum++;

    // نوافذ
    let windowsHtml = '';
    for (let w = 1; w <= 10; w++) {
        windowsHtml += `<div class="bus-window"><div class="window-glass"><div class="window-reflection"></div></div><div class="window-frame"></div></div>`;
    }

    const busObj = (window.conferenceData && window.conferenceData.buses)
        ? window.conferenceData.buses.find(b => b.busNumber === busNum)
        : null;
    const supervisor = busObj ? busObj.supervisorName : '—';

    return `
    <div class="bus-container" id="bus-${busNum}">
        <div class="bus-headlight-left"></div>
        <div class="bus-headlight-right"></div>
        <div class="bus-mirror-left"><div class="mirror-glass"></div></div>
        <div class="bus-mirror-right"><div class="mirror-glass"></div></div>
        <div class="bus-wheel-front"><div class="wheel-hub"></div></div>
        <div class="bus-wheel-back"><div class="wheel-hub"></div></div>
        <div class="bus-windows-right">${windowsHtml}</div>
        <div class="bus-windows-left">${windowsHtml}</div>
        <div class="bus-header">
            <div class="bus-title">أتوبيس ${busNum} 🚍</div>
            <div class="bus-subtitle">المشرف: ${escapeHTML(supervisor)}</div>
        </div>
        <div class="bus-front">
            <div class="front-stairs"><div class="stairs-door-icon">🪜🚪</div><div class="stairs-label">سلم · باب</div></div>
            <div class="front-aisle-space"></div>
            <div class="driver-seat"><div class="steering-wheel"></div><div class="driver-label">سواق</div></div>
        </div>
        <div class="seats-wrapper">
            <div class="seats-grid">${rowsHtml}</div>
        </div>
        <div class="legend d-flex justify-content-center gap-3 mt-3 flex-wrap">
            <div class="legend-item d-flex align-items-center gap-1"><div class="legend-box legend-available"></div><span>فاضي</span></div>
            <div class="legend-item d-flex align-items-center gap-1"><div class="legend-box legend-booked"></div><span>محجوز</span></div>
        </div>
        <div class="bus-stats d-flex justify-content-center gap-3 mt-2 mb-3 flex-wrap">
            <div class="stat-item"><span id="stats-total-${busNum}">49</span> الإجمالي</div>
            <div class="stat-item"><span class="stat-number stat-empty" id="stats-empty-${busNum}">49</span> فاضي</div>
            <div class="stat-item"><span class="stat-number stat-booked" id="stats-booked-${busNum}">0</span> محجوز</div>
        </div>
    </div>`;
}

// رسم الأوتوبيسين سيتم استدعاؤه بعد تحميل البيانات

// تأخير أنيميشن الأتوبيس الثاني - يتم التحكم من CSS الآن (bus3DEntrance)

// تعبئة البيانات
function populateData() {
    $.each(passengers, function(i, p) {
        const $seat = $('#' + p.elementId);
        if ($seat.length) {
            $seat.addClass('booked');
            $seat.find('.passenger-name').text(p.name);
        }
    });

    let globalTotal = 0, globalBooked = 0;

    [1, 2].forEach(function(busNum) {
        const totalSeats = $(`#bus-${busNum} .seats-wrapper .seat`).length;
        const busPassengers = passengers.filter(p => p.bus === busNum).length;
        $(`#stats-total-${busNum}`).text(totalSeats);
        $(`#stats-booked-${busNum}`).text(busPassengers);
        $(`#stats-empty-${busNum}`).text(totalSeats - busPassengers);
        globalTotal += totalSeats;
        globalBooked += busPassengers;
    });

    $('#global-total').text(globalTotal);
    $('#global-booked').text(globalBooked);
    $('#global-avail').text(globalTotal - globalBooked);
}
// تعبئة البيانات سيتم استدعاؤه بعد تحميل البيانات

// أنيميشن العداد للإحصائيات
function animateCounter($element, target) {
    const current = parseInt($element.text()) || 0;
    if (current === target) return;
    $({ count: current }).animate({ count: target }, {
        duration: 800,
        easing: 'swing',
        step: function() {
            $element.text(Math.floor(this.count));
        },
        complete: function() {
            $element.text(target);
        }
    });
}

/* 
 * ==========================================
 * 3. وظائف الواجهة باستخدام jQuery
 * ==========================================
 */

// دالة لمعالجة النصوص العربية
function normalizeArabic(text) {
    return text.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
}

// تفاعل الضغط على الكرسي + hover باللمس للموبايل
let $currentHoveredSeat = null;
let isTouchDevice = false;
let touchMoved = false;

function clearSeatHover() {
    if ($currentHoveredSeat) {
        $currentHoveredSeat.removeClass('hovered');
        $currentHoveredSeat = null;
    }
}

// كشف أجهزة اللمس
$(document).on('touchstart', function() {
    isTouchDevice = true;
}, { once: true });

$(document).on('touchstart', '.seat', function(e) {
    touchMoved = false;
});

$(document).on('touchmove', '.seat', function(e) {
    touchMoved = true;
    // إزالة hover عند التحرك (scroll)
    clearSeatHover();
});

$(document).on('touchend', '.seat', function(e) {
    if (touchMoved) return; // لا تفعل شيء إذا كان scroll
    
    e.preventDefault();
    const $seat = $(this);
    
    // إزالة hover من المقعد السابق
    if ($currentHoveredSeat && $currentHoveredSeat[0] !== $seat[0]) {
        clearSeatHover();
    }
    
    // تبديل hover على المقعد
    if ($seat.hasClass('hovered')) {
        $seat.removeClass('hovered');
        $currentHoveredSeat = null;
    } else {
        $seat.addClass('hovered');
        $currentHoveredSeat = $seat;
    }
});

// على الديسكتوب - إزالة hovered عند إزالة الماوس
$(document).on('mouseleave', '.seat', function() {
    if (!isTouchDevice && $(this).hasClass('hovered')) {
        $(this).removeClass('hovered');
        if ($currentHoveredSeat && $currentHoveredSeat[0] === this) {
            $currentHoveredSeat = null;
        }
    }
});

// إزالة hover عند الضغط على أي مكان آخر (ديسكتوب)
$(document).on('click', function(e) {
    if (!isTouchDevice && !$(e.target).closest('.seat').length) {
        clearSeatHover();
    }
});

// إزالة hover عند اللمس خارج المقاعد (موبايل)
$(document).on('touchstart', function(e) {
    if (!$(e.target).closest('.seat').length && $currentHoveredSeat) {
        clearSeatHover();
    }
});

// ========== نظام Error Handling ==========
let appLoadedSuccessfully = false;

// التحقق من تحميل البيانات بشكل سليم
function verifyAppIntegrity() {
    try {
        // التأكد إن الأوتوبيسات اترسمت
        if ($('#buses-wrapper').children().length === 0) {
            throw new Error('الأوتوبيسات متعملتش');
        }
        // التأكد إن المقاعد موجودة
        if ($('.seat').length === 0) {
            throw new Error('المقاعد مش موجودة');
        }
        appLoadedSuccessfully = true;
        return true;
    } catch (error) {
        console.error('خطأ في تحميل التطبيق:', error.message);
        showErrorOverlay(error.message);
        return false;
    }
}

// عرض شاشة الخطأ
function showErrorOverlay(errorMsg) {
    $('#error-overlay').addClass('show');
    $('#main-content').css({ opacity: 0.3, pointerEvents: 'none' });
    console.error('Error Details:', errorMsg);
}

// إخفاء شاشة الخطأ
function hideErrorOverlay() {
    $('#error-overlay').removeClass('show');
    $('#main-content').css({ opacity: 1, pointerEvents: 'auto' });
}

// التحقق من الاتصال بالإنترنت
window.addEventListener('offline', function() {
    showErrorOverlay('فقدت الاتصال بالإنترنت');
});

window.addEventListener('online', function() {
    if (appLoadedSuccessfully) {
        hideErrorOverlay();
    } else {
        location.reload();
    }
});

// خطأ JavaScript عام
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('JS Error:', msg, 'at', url, 'line', lineNo);
    // لو الخطأ حرج نعرض الشاشة
    if (msg && (msg.includes('passengers') || msg.includes('bus') || msg.includes('seat'))) {
        showErrorOverlay(msg);
    }
    return false;
};

// شاشة الترحيب - تم فصلها في welcome.html
// عند فتح صفحة المقاعد مباشرة، نظهر المحتوى ونفتح البحث

/**
 * يستخرج بيانات المشتركين إما من مسودة localStorage (conference_db_draft)
 * التي يحفظها manage-passengers.js، أو من DataService (conference-data.json).
 * يُعطي الأولوية دائماً لمسودة المتصفح لأنها الأحدث.
 */
function loadParticipantsFromBestSource() {
    return DataService.loadConference().then(data => {
        return (data && data.participants) ? data.participants : DataService.getParticipants();
    });
}

$(document).ready(function() {
    if (window.DataService) {
        loadParticipantsFromBestSource().then(function(participantsData) {
            // تعبئة مصفوفة الركاب من بيانات المشتركين
            passengers = participantsData
                .filter(p => p.busNumber !== null && p.busNumber !== undefined && p.busNumber !== '')
                .map(p => ({
                    name: p.name,
                    bus: parseInt(p.busNumber),
                    seat: parseInt(p.seatNumber),
                    elementId: `bus${p.busNumber}-seat-${p.seatNumber}`
                }));

            // رسم الأوتوبيسات
            $('#buses-wrapper').html(generateBusHTML(1) + generateBusHTML(2));

            // تعبئة بيانات المقاعد والإحصائيات
            populateData();

            // إخفاء أي شاشة خطأ وإعادة الصفحة لحالتها الطبيعية بشكل صحيح
            // (hideErrorOverlay تُعيد opacity:1 و pointerEvents:auto بعكس .show())
            hideErrorOverlay();

            // تشغيل أنيميشن الظهور السلس للأتوبيسات بعد اكتمال الرسم
            requestAnimationFrame(function() {
                $('#buses-wrapper').addClass('buses-loaded');
                
                // أنيميشن المقاعد - wave effect حسب الصف
                $('.seat').each(function(index) {
                    const $seat = $(this);
                    const delay = Math.floor(index / 4) * 60 + (index % 4) * 20; // stagger by row then column
                    setTimeout(function() {
                        $seat.addClass('animate-in');
                    }, 300 + delay);
                });

                const seatsObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            $(entry.target).addClass('animate-in');
                        }
                    });
                }, { threshold: 0.1 });

                $('.seat').each(function() {
                    seatsObserver.observe(this);
                });
            });

            // التحقق من سلامة التطبيق
            const isHealthy = verifyAppIntegrity();

            if (isHealthy) {
                // فتح نافذة البحث تلقائياً مرة واحدة فقط عند أول دخول
                if (!sessionStorage.getItem('search_shown')) {
                    setTimeout(function() {
                        if ($('#buses-wrapper').children().length > 0) {
                            openSearchPopup();
                            sessionStorage.setItem('search_shown', 'true');
                        }
                    }, 800);
                }
            }
        }).catch(function(err) {
            console.error('فشل تحميل بيانات الأتوبيسات:', err);
            showErrorOverlay('تعذّر تحميل بيانات المقاعد. الرجاء تحديث الصفحة.');
        });

        window.addEventListener('yc_live_data_updated', function(e) {
            if (e.detail && Array.isArray(e.detail.participants)) {
                passengers = e.detail.participants;
                renderBusSeats();
                renderBusStats();
            }
        });
    }
});

// Bootstrap Modal للبحث
let searchModal = null;

function openSearchPopup() {
    if (!searchModal) {
        searchModal = new bootstrap.Modal(document.getElementById('search-popup'));
    }
    $('#search-input').val('');
    $('#search-result').html('');
    $('#search-options').removeClass('show').html('');
    searchModal.show();
    setTimeout(function() { $('#search-input').trigger('focus'); }, 300);
}

function closeSearchPopup() {
    if (searchModal) searchModal.hide();
}

// زر البحث في Navbar
$(document).on('click', '#nav-search-btn', function() {
    openSearchPopup();
});

// زر البحث العائم
$('#open-search-btn').on('click', function() {
    openSearchPopup();
});

// تنفيذ البحث
function performSearch() {
    const rawName = $('#search-input').val().trim();
    if (!rawName) return;

    const searchName = normalizeArabic(rawName);
    $('.seat.highlight').removeClass('highlight');

    const found = passengers.filter(p => normalizeArabic(p.name).includes(searchName));

    const $options = $('#search-options');
    const $result = $('#search-result');
    $options.removeClass('show').html('');

    if (found.length === 0) {
        $result.html(`<div class="error-msg">
            <span style="font-size: 1rem;">😅</span><br>
            <strong>مش لاقيين الاسم</strong><br>
            <span style="opacity: 0.8;">جرّب تكتب الاسم كامل أو كلم المسؤول</span>
        </div>`);
        return;
    }

    if (found.length > 1) {
        $result.html(`<div class="choose-msg"><strong>لقيت ${found.length} شخص بنفس الاسم، اختار نفسك:</strong></div>`);
        $.each(found, function(i, p) {
            $options.append(`<div class="search-option-item" data-index="${i}">${p.name} - أتوبيس ${p.bus} مقعد ${p.seat}</div>`);
        });
        $options.addClass('show');

        $options.off('click', '.search-option-item').on('click', '.search-option-item', function() {
            const idx = $(this).data('index');
            $options.removeClass('show').html('');
            showSearchResult(found[idx]);
        });
    } else {
        showSearchResult(found[0]);
    }
}

function showSearchResult(person) {
    // حفظ الشخص الأخير للمشاركة
    lastFoundPerson = person;
    
    // حفظ البيانات في الملف التعريفي الموحد للمستخدم
    try {
        let profile = JSON.parse(localStorage.getItem('yc2_user_profile') || '{}');
        profile.name = person.name;
        profile.bus = person.bus;
        profile.seat = person.seat;
        localStorage.setItem('yc2_user_profile', JSON.stringify(profile));
    } catch(e) { console.error(e); }

    // جملتين ترحيبية عشوائية عشان الرسالة متبقاش مكررة كل مرة
    const warmMessages = [
        ['ربنا يرافقك في كل خطوة ويملا رحلتك بالفرح والسلام 🙏', 'استعد لأيام هتفضل عالقة في قلبك، مع أحلى رفقة وأجمل ذكريات 💙'],
        ['نورت الرحلة يا نجم، وربنا يكون معاك في كل لحظة ✨', 'جهّز نفسك لأيام مليانة بركة وضحك وذكريات ما تتنسيش 💫'],
        ['فرحانين إنك هتكون معانا، ربنا يبارك وجودك 🕊️', 'يلا نستعد لرحلة روحية حلوة، مليانة محبة وسط أحلى إخوات 💙']
    ];
    const msg = warmMessages[Math.floor(Math.random() * warmMessages.length)];

    $('#search-result').html(`<div class="success-msg">
        <span class="emoji">🎉</span>
        <span class="name">أهلاً بيك يا ${person.name}</span>
        <div class="ticket-box">
            <div class="ticket-item">
                <span class="ticket-label">الأتوبيس</span>
                <span class="ticket-value">${person.bus}</span>
            </div>
            <div class="ticket-divider">
                <span class="ticket-dot"></span><span class="ticket-dot"></span><span class="ticket-dot"></span>
            </div>
            <div class="ticket-item">
                <span class="ticket-label">المقعد</span>
                <span class="ticket-value">${person.seat}</span>
            </div>
        </div>
        <div class="welcome-message">
            <p>${msg[0]}</p>
            <p>${msg[1]}</p>
        </div>
        <button class="share-result-btn" onclick="openShareModal(); closeSearchPopup();">
            <i class="bi bi-share-fill me-1"></i>شارك مكانك
        </button>
    </div>`);

    const $seat = $('#' + person.elementId);
    if ($seat.length) {
        // إزالة أي hover سابق
        clearSeatHover();
        // إزالة أي highlight سابق
        $('.seat.highlight').removeClass('highlight');
        $seat.addClass('highlight');
        setTimeout(function() {
            closeSearchPopup();
            $('html, body').animate({ scrollTop: $seat.offset().top - 100 }, 600);
            // إزالة highlight بعد 5 ثواني
            setTimeout(function() {
                $seat.removeClass('highlight');
            }, 5000);
        }, 2000);
    }
}

$('#search-btn').on('click', performSearch);
$('#search-input').on('keypress', function(e) {
    if (e.which === 13) performSearch();
});

// تأثير Navbar عند الـ Scroll فقط (بدون parallax لتجنب تعارض مع أنيميشن الخلفية)
$(window).on('scroll', function() {
    const currentScrollY = window.scrollY;

    // Navbar تأثير عند الـ scroll
    if (currentScrollY > 50) {
        $('.app-navbar').addClass('scrolled');
        $('#nav-top-btn').fadeIn(300);
    } else {
        $('.app-navbar').removeClass('scrolled');
        $('#nav-top-btn').fadeOut(300);
    }
});

// زر العودة لأعلى
$(document).on('click', '#nav-top-btn', function() {
    $('html, body').animate({ scrollTop: 0 }, 500);
});

// تم نقل تفعيل أنيميشن المقاعد والـ IntersectionObserver إلى داخل دالة ready بعد رسم الأتوبيسات ديناميكياً لتجنب المشاكل البصرية.

// ========== نظام تكامل الخرائط ==========
const DESTINATION = {
    name: 'King Land Villa',
    address: 'جمعية أحمد عرابى، العبور، محافظة القاهرة',
    plusCode: '6GMP+W46',
    lat: 30.2219,
    lng: 31.4381,
    placeId: '6GMP+W46 جمعية احمد عرابى العبور',
    departure: 'كنيسة مارمرقس الرسول بالمنشية'
};

// ========== تهيئة وإعدادات نظام خريطة المسار المدمجة ==========
let mapIframeLoaded = false;

// إنشاء رابط الاتجاهات الديناميكي
function getDirectionsUrl() {
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const origin = encodeURIComponent(DESTINATION.departure);
    const destination = encodeURIComponent(DESTINATION.name + ', ' + DESTINATION.plusCode + ', ' + DESTINATION.address);
    return baseUrl + '&origin=' + origin + '&destination=' + destination + '&travelmode=driving';
}

// إنشاء رابط الموقع
function getPlaceUrl() {
    return 'https://www.google.com/maps/place/' + encodeURIComponent(DESTINATION.placeId);
}

// تحديث روابط الخريطة ديناميكياً
function initMapLinks() {
    const $navBtn = $('.map-btn-nav');
    const $locBtn = $('.map-btn-loc');
    
    if ($navBtn.length) {
        $navBtn.attr('href', getDirectionsUrl());
    }
    if ($locBtn.length) {
        $locBtn.attr('href', getPlaceUrl());
    }
}

// محاولة الحصول على الموقع الحالي للمستخدم لعرض المسافة
function tryGetUserLocation() {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // حساب المسافة التقريبية باستخدام قانون هافراين
        const distance = haversineDistance(userLat, userLng, DESTINATION.lat, DESTINATION.lng);
        
        if (distance) {
            const distanceText = distance < 1 ? 
                Math.round(distance * 1000) + ' متر' : 
                distance.toFixed(1) + ' كم';
            
            // إضافة معلومات المسافة داخل الكارت المدمج
            const $distanceInfo = $(`<div class="map-distance-info">
                <i class="bi bi-geo-alt-fill"></i>
                <span>أنت على بعد ${distanceText} من الوجهة</span>
            </div>`);
            
            $('#route-distance-info').html($distanceInfo);
            
            // تحديث رابط الاتجاهات ليشمل موقع المستخدم الحالي
            const $navBtn = $('.map-btn-nav');
            if ($navBtn.length) {
                const origin = encodeURIComponent(userLat + ',' + userLng);
                const destination = encodeURIComponent(DESTINATION.lat + ',' + DESTINATION.lng);
                const newUrl = 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + destination + '&travelmode=driving';
                $navBtn.attr('href', newUrl);
                $navBtn.html('<i class="bi bi-map me-2"></i>الاتجاهات (' + distanceText + ')');
            }
        }
    }, function() {
        console.log('لم يتم السماح بالوصول للموقع');
    }, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000
    });
}

// حساب المسافة بين نقطتين (قانون هافراين)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

$(document).ready(function() {
    initMapLinks();
    
    // قسم خريطة المسار المدمجة بالصفحة
    $('#map-card-toggle').on('click', function() {
        const $body = $('#map-card-content');
        const $arrow = $('#map-toggle-arrow');
        const $header = $(this);
        
        $body.slideToggle(300, function() {
            const isVisible = $body.is(':visible');
            $header.toggleClass('expanded', isVisible);
            
            if (isVisible && !mapIframeLoaded) {
                const $iframe = $body.find('.map-embed iframe');
                if ($iframe.length && $iframe.attr('data-src')) {
                    $iframe.attr('src', $iframe.attr('data-src'));
                    mapIframeLoaded = true;
                }
                tryGetUserLocation();
            }
        });
    });
});

// تم حذف نظام الأسئلة المحلي ونقله لصفحة feedback.html المستقلة.

// تم حذف وتفكيك العداد التنازلي بناءً على طلب المستخدم.
const $videoOverlay = $('#video-overlay');

function showVideoOnly() {
    const $iframe = $videoOverlay.find('iframe');
    if ($iframe.length && !$iframe.attr('src')) {
        const videoSrc = $iframe.attr('data-src');
        if (videoSrc) $iframe.attr('src', videoSrc);
    }
    $videoOverlay.addClass('show');
    $('#main-content').hide();
    $('#search-popup').addClass('d-none');
    $('#open-search-btn').hide();
    $('.bg-layer').hide();
}

// ========== نظام المشاركة الاجتماعية ==========
let lastFoundPerson = null;

// زر المشاركة العائم
$('#share-btn').on('click', function() {
    openShareModal();
});

function openShareModal() {
    const $modal = $('#share-modal');
    const $shareName = $('#share-name');
    const $shareInfo = $('#share-info');
    
    // لو فيه شخص اتعمله بحث قبل كدا
    if (lastFoundPerson) {
        $shareName.text(lastFoundPerson.name);
        $shareInfo.html(`أتوبيس ${lastFoundPerson.bus} - مقعد ${lastFoundPerson.seat}`);
        updateShareLinks(lastFoundPerson);
    } else {
        $shareName.text('دور على اسمك الأول!');
        $shareInfo.text('دور على مكانك وشاركه مع صحابك');
        setDefaultShareLinks();
    }
    
    $modal.addClass('show');
}

function closeShareModal() {
    $('#share-modal').removeClass('show');
}

// إغلاق بالضغط على الخلفية
$('#share-modal').on('click', function(e) {
    if (e.target === this) closeShareModal();
});

// تحديث روابط المشاركة
function updateShareLinks(person) {
    const pageUrl = window.location.href;
    const shareText = `🚍 مؤتمر الشباب\n📋 ${person.name}\n💺 أتوبيس ${person.bus} - مقعد ${person.seat}\n📍 دور على مكانك هنا:`;
    const fullText = shareText + ' ' + pageUrl;
    
    // واتساب
    $('#share-whatsapp').attr('href', 
        'https://wa.me/?text=' + encodeURIComponent(fullText)
    );
    
    // تليجرام
    $('#share-telegram').attr('href', 
        'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(shareText)
    );
}

function setDefaultShareLinks() {
    const pageUrl = window.location.href;
    const shareText = '🚍 مؤتمر الشباب - دور على مكانك في الأتوبيس!';
    const fullText = shareText + ' ' + pageUrl;
    
    $('#share-whatsapp').attr('href', 
        'https://wa.me/?text=' + encodeURIComponent(fullText)
    );
    $('#share-telegram').attr('href', 
        'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(shareText)
    );
}

// نسخ الرابط
function copyShareLink() {
    const pageUrl = window.location.href;
    let copyText = pageUrl;
    
    if (lastFoundPerson) {
        copyText = `🚍 مؤتمر الشباب\n📋 ${lastFoundPerson.name}\n💺 أتوبيس ${lastFoundPerson.bus} - مقعد ${lastFoundPerson.seat}\n🔗 ${pageUrl}`;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(function() {
            showCopyToast();
        }).catch(function() {
            fallbackCopy(copyText);
        });
    } else {
        fallbackCopy(copyText);
    }
}

function fallbackCopy(text) {
    const $temp = $('<textarea>');
    $('body').append($temp);
    $temp.val(text).select();
    try {
        document.execCommand('copy');
        showCopyToast();
    } catch(e) {
        // fallback: فتح نافذة الواتساب كحل بديل
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
    $temp.remove();
}

function showCopyToast() {
    const $toast = $('<div class="copy-toast"><i class="bi bi-check-circle me-2"></i>تم نسخ الرابط!</div>');
    $('body').append($toast);
    setTimeout(function() { $toast.remove(); }, 2200);
}

// سكرين شوت
function takeScreenshot() {
    // محاولة استخدام html2canvas لو متوفر
    if (typeof html2canvas !== 'undefined') {
        takeScreenshotWithHtml2Canvas();
        return;
    }
    
    // محاولة استخدام Web Share API
    if (navigator.share && navigator.canShare) {
        shareViaWebAPI();
        return;
    }
    
    // Fallback: نسخ النص كرسالة
    copyShareLink();
    showScreenshotHint();
}

function showScreenshotHint() {
    const $hint = $('<div class="copy-toast" style="background: linear-gradient(135deg, var(--seat-booked) 0%, var(--seat-booked-mid) 100%); box-shadow: 0 6px 20px var(--seat-booked-glow);"><i class="bi bi-phone me-2"></i>خد سكرين شوت وشاركه!</div>');
    $('body').append($hint);
    setTimeout(function() { $hint.remove(); }, 2500);
}

function shareViaWebAPI() {
    const pageUrl = window.location.href;
    let shareTitle = 'مؤتمر الشباب - مقعدي';
    let shareText = '🚍 مؤتمر الشباب\nدور على مكانك في الأتوبيس!';
    
    if (lastFoundPerson) {
        shareTitle = `مقعدي - أتوبيس ${lastFoundPerson.bus}`;
        shareText = `📋 ${lastFoundPerson.name}\n💺 أتوبيس ${lastFoundPerson.bus} - مقعد ${lastFoundPerson.seat}`;
    }
    
    navigator.share({
        title: shareTitle,
        text: shareText,
        url: pageUrl
    }).catch(function(err) {
        if (err.name !== 'AbortError') {
            copyShareLink();
        }
    });
}

function takeScreenshotWithHtml2Canvas() {
    // تحديد المنطقة اللي فيها مقعد الشخص
    let $target = null;
    if (lastFoundPerson) {
        $target = $('#' + lastFoundPerson.elementId).closest('.bus-container');
    }
    if (!$target || !$target.length) {
        $target = $('.bus-container').first();
    }
    
    html2canvas($target[0], {
        backgroundColor: '#0b1121',
        scale: 2,
        useCORS: true,
        logging: false
    }).then(function(canvas) {
        canvas.toBlob(function(blob) {
            if (navigator.share && navigator.canShare({ files: [new File([blob], 'my-seat.png', { type: 'image/png' })] })) {
                const file = new File([blob], 'my-seat.png', { type: 'image/png' });
                navigator.share({
                    title: 'مقعدي - مؤتمر الشباب',
                    files: [file]
                }).catch(function() {});
            } else {
                // تحميل الصورة
                const url = URL.createObjectURL(blob);
                const $a = $('<a>').attr({ href: url, download: 'my-seat.png' });
                $('body').append($a);
                $a[0].click();
                $a.remove();
                URL.revokeObjectURL(url);
                showScreenshotHint();
            }
        }, 'image/png');
    }).catch(function() {
        copyShareLink();
        showScreenshotHint();
    });
}
