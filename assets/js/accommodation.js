/* =====================================================
   accommodation.js — مؤتمر الشباب 2026
   عرض التسكين بشكل واضح وجميل
   ===================================================== */
(function () {
    'use strict';

    const list = document.getElementById('rooms-list');
    let activeGender = 'all';

    /* ══════════════════════════════════════════════════
       1. بناء بطاقة الغرفة
       ══════════════════════════════════════════════════ */
    function renderRoomCard(room) {
        const isBoysRoom = room.gender === 'boys';
        const color     = isBoysRoom ? '#06b6d4' : '#fb7185';
        const genderTxt = isBoysRoom ? 'ولاد 🧒' : 'بنات 👧';
        const floorTxt  = room.floor === 1 ? 'الدور الأول' : 'الدور الثاني';
        const roomNum   = room.name.replace('غرفة ', '');
        const occupied  = room.persons.filter(Boolean).length;
        const pct       = Math.round((occupied / room.capacity) * 100);

        // ─── صفوف الأسرّة ───
        const bedsHtml = room.persons.map((p, i) => {
            const bedNum = i + 1;
            const icon   = p ? (isBoysRoom ? 'bi-person-standing' : 'bi-person-standing-dress') : 'bi-moon-fill';
            const nameDisp = p ? p : 'سرير شاغر';
            const occupied = p ? 'occupied' : 'empty';
            return `
            <div class="bed-row ${occupied} ${room.gender}" data-bed="${bedNum}">
                <div class="bed-num-tag">${bedNum}</div>
                <div class="bed-person-icon">
                    <i class="bi ${icon}"></i>
                </div>
                <div class="bed-person-name">${p || '<span style="color:#475569;font-style:italic;">شاغر</span>'}</div>
                ${p ? `<div class="bed-occ-dot"></div>` : ''}
            </div>`;
        }).join('');

        // ─── شريط الإشغال ───
        const fillColor = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';

        const card = document.createElement('div');
        card.className = `room-card-v3 ${room.gender}`;
        card.id = `room-block-${room.id}`;
        card.innerHTML = `
        <div class="room-card-v3-header" style="border-bottom: 1px solid ${color}22;">
            <div class="room-card-v3-left">
                <div class="room-icon-v3" style="background:${color}18; color:${color}; border:1px solid ${color}33;">
                    <i class="bi bi-door-closed-fill"></i>
                </div>
                <div>
                    <div class="room-name-v3">غرفة <span style="color:${color};">${roomNum}</span></div>
                    <div class="room-meta-v3">
                        <span style="color:${color}; font-size:0.7rem;">${genderTxt}</span>
                        <span style="color:#475569;">•</span>
                        <span style="color:#64748b; font-size:0.7rem;">${floorTxt}</span>
                    </div>
                </div>
            </div>
            <div class="room-card-v3-right">
                <div class="room-occ-circle" style="background:${color}18; border:2px solid ${color}44; color:${color};">
                    <span class="occ-num">${occupied}</span>
                    <span class="occ-total">/${room.capacity}</span>
                </div>
            </div>
        </div>

        <div class="room-occ-bar-wrap">
            <div class="room-occ-bar" style="width:${pct}%; background:${fillColor};"></div>
        </div>

        <div class="room-beds-list">
            ${bedsHtml}
        </div>`;

        return card;
    }

    /* ══════════════════════════════════════════════════
       2. رسم الكل — شبكة بطاقات منظمة حسب الدور
       ══════════════════════════════════════════════════ */
    function renderAll(rooms) {
        if (!list) return;
        list.innerHTML = '';

        const filtered = rooms.filter(r =>
            activeGender === 'all' || r.gender === activeGender
        );

        if (!filtered.length) {
            list.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#64748b;">
                <i class="bi bi-house-door" style="font-size:2.5rem; display:block; margin-bottom:10px;"></i>
                <div style="font-size:0.9rem; font-weight:700;">لا توجد غرف مطابقة</div>
            </div>`;
            return;
        }

        // ─── إحصائيات سريعة في الأعلى ───
        const totalBeds   = filtered.reduce((s, r) => s + r.capacity, 0);
        const totalOccupied = filtered.reduce((s, r) => s + r.persons.filter(Boolean).length, 0);
        const totalFree   = totalBeds - totalOccupied;

        const statsEl = document.createElement('div');
        statsEl.className = 'accomm-stats-bar';
        statsEl.innerHTML = `
        <div class="stat-item">
            <i class="bi bi-door-closed-fill" style="color:#06b6d4;"></i>
            <span>${filtered.length} غرفة</span>
        </div>
        <div class="stat-item">
            <i class="bi bi-person-fill" style="color:#10b981;"></i>
            <span>${totalOccupied} مشغول</span>
        </div>
        <div class="stat-item">
            <i class="bi bi-moon-fill" style="color:#f59e0b;"></i>
            <span>${totalFree} شاغر</span>
        </div>`;
        list.appendChild(statsEl);

        // ─── الدور الأول ───
        const floor1 = filtered.filter(r => r.floor === 1);
        if (floor1.length) {
            const sec = buildFloorSection(floor1, 'الدور الأول — ولاد 🧒', '#06b6d4');
            list.appendChild(sec);
        }

        // ─── الدور الثاني ───
        const floor2 = filtered.filter(r => r.floor === 2);
        if (floor2.length) {
            const sec = buildFloorSection(floor2, 'الدور الثاني — بنات 👧', '#fb7185');
            list.appendChild(sec);
        }
    }

    function buildFloorSection(floorRooms, label, color) {
        const sec = document.createElement('div');
        sec.className = 'floor-section';

        const header = document.createElement('div');
        header.className = 'floor-header';
        header.innerHTML = `
        <div class="floor-header-line" style="background:${color};"></div>
        <div class="floor-header-label" style="color:${color};">${label}</div>
        <div class="floor-header-line" style="background:${color};"></div>`;
        sec.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'rooms-grid-v3';
        floorRooms.forEach(room => {
            const card = renderRoomCard(room);
            card.addEventListener('click', () => openRoomModal(room));
            grid.appendChild(card);
        });
        sec.appendChild(grid);
        return sec;
    }

    /* ══════════════════════════════════════════════════
       3. مودال تفاصيل الغرفة (قائمة أسرّة واضحة)
       ══════════════════════════════════════════════════ */
    function openRoomModal(room) {
        const titleEl = document.getElementById('room-modal-title');
        const gridEl  = document.getElementById('room-modal-beds-grid');
        if (!titleEl || !gridEl) return;

        const isBoysRoom = room.gender === 'boys';
        const color      = isBoysRoom ? '#06b6d4' : '#fb7185';
        const genderText = isBoysRoom ? 'ولاد' : 'بنات';
        const floorText  = room.floor === 1 ? 'الأول' : 'الثاني';
        const occupied   = room.persons.filter(Boolean).length;

        titleEl.innerHTML = `${room.name} <small style="color:${color}; font-size:0.75rem; font-weight:700;">${genderText} — الدور ${floorText}</small>`;

        const bedsHtml = room.persons.map((p, i) => {
            const bedNum = i + 1;
            const isFull = !!p;
            const icon   = isFull ? (isBoysRoom ? 'bi-person-standing' : 'bi-person-standing-dress') : 'bi-moon-fill';
            return `
            <div style="
                display:flex; align-items:center; gap:12px;
                padding:10px 14px; border-radius:14px; margin-bottom:7px;
                background:${isFull ? `${color}12` : 'rgba(255,255,255,0.03)'};
                border:1px solid ${isFull ? `${color}33` : 'rgba(255,255,255,0.06)'};
                transition:transform 0.2s;
            " onmouseenter="this.style.transform='scale(1.01)'" onmouseleave="this.style.transform='scale(1)'">
                <div style="
                    width:36px; height:36px; border-radius:10px; flex-shrink:0;
                    background:${isFull ? `${color}20` : 'rgba(255,255,255,0.05)'};
                    display:flex; align-items:center; justify-content:center;
                    color:${isFull ? color : '#475569'}; font-size:1.1rem;
                "><i class="bi ${icon}"></i></div>
                <div style="flex:1;">
                    <div style="font-size:0.88rem; font-weight:${isFull ? '800' : '600'}; color:${isFull ? '#f1f5f9' : '#64748b'};">
                        ${isFull ? p : 'سرير شاغر'}
                    </div>
                    <div style="font-size:0.65rem; color:#475569;">سرير رقم ${bedNum}</div>
                </div>
                <div style="
                    width:8px; height:8px; border-radius:50%;
                    background:${isFull ? color : 'rgba(255,255,255,0.1)'};
                    box-shadow:${isFull ? `0 0 6px ${color}` : 'none'};
                "></div>
            </div>`;
        }).join('');

        gridEl.innerHTML = `
        <div style="text-align:center; margin-bottom:14px;">
            <div style="font-size:2rem; font-weight:900; color:${color};">${occupied}<span style="font-size:1rem; color:#64748b;">/${room.capacity}</span></div>
            <div style="font-size:0.72rem; color:#64748b; font-weight:700;">${occupied === room.capacity ? '🔴 ممتلئة' : occupied === 0 ? '🟢 شاغرة' : '🟡 جزئياً'}</div>
            <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:99px; margin:8px 0; overflow:hidden;">
                <div style="height:100%; width:${Math.round((occupied/room.capacity)*100)}%; background:${color}; border-radius:99px; transition:width 0.5s ease;"></div>
            </div>
        </div>
        ${bedsHtml}`;

        const modalEl = document.getElementById('roomDetailsModal');
        if (modalEl) {
            modalEl.classList.remove('boys', 'girls');
            modalEl.classList.add(room.gender);
            const myModal = new bootstrap.Modal(modalEl);
            myModal.show();
        }
    }

    /* ══════════════════════════════════════════════════
       4. فلتر + بحث
       ══════════════════════════════════════════════════ */
    function applyFilters(q, autoOpenModal = false) {
        const query = (YC.normalizeArabic(q || '')).trim();

        const filtered = (window.rooms || []).filter(room => {
            const genderOk = activeGender === 'all' || room.gender === activeGender;
            if (!genderOk) return false;
            if (!query) return true;
            const nameMatch   = YC.normalizeArabic(room.name).includes(query);
            const personMatch = (room.persons || []).some(p => p && YC.normalizeArabic(p).includes(query));
            return nameMatch || personMatch;
        });

        // تحديث التظليل مباشرةً دون إعادة رسم
        if (!query) {
            document.querySelectorAll('.room-card-v3').forEach(el => {
                el.classList.remove('highlighted', 'dimmed');
                const g = el.classList.contains('boys') ? 'boys' : 'girls';
                el.style.display = (activeGender === 'all' || g === activeGender) ? '' : 'none';
            });
        } else {
            const matchedIds = new Set(filtered.map(r => r.id));
            document.querySelectorAll('.room-card-v3').forEach(el => {
                const roomId = el.id.replace('room-block-', '');
                const g = el.classList.contains('boys') ? 'boys' : 'girls';
                const genderOk = activeGender === 'all' || g === activeGender;
                if (!genderOk) { el.style.display = 'none'; return; }
                el.style.display = '';
                if (matchedIds.has(roomId)) {
                    el.classList.add('highlighted');
                    el.classList.remove('dimmed');
                } else {
                    el.classList.add('dimmed');
                    el.classList.remove('highlighted');
                }
            });
        }

        // إظهار بادج البحث
        const wrap = document.getElementById('accomm-active-search-wrap');
        if (wrap) {
            if (q) {
                wrap.style.display = 'block';
                wrap.innerHTML = `
                <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.3); color:#fbbf24; padding:0.35rem 0.8rem; border-radius:12px; font-size:0.78rem; font-weight:700;">
                    <span>البحث: "${q}"</span>
                    <i class="bi bi-x-circle-fill" id="clear-search-badge-btn" style="cursor:pointer; opacity:0.8;"></i>
                </div>`;
                document.getElementById('clear-search-badge-btn')?.addEventListener('click', () => {
                    const si = document.getElementById('accomm-search');
                    if (si) si.value = '';
                    wrap.style.display = 'none';
                    applyFilters('');
                });
            } else {
                wrap.style.display = 'none';
            }
        }

        // فتح المودال تلقائياً
        if (autoOpenModal && query && filtered.length > 0) {
            const matched = filtered[0];
            const blockEl = document.getElementById(`room-block-${matched.id}`);
            if (blockEl) {
                setTimeout(() => {
                    openRoomModal(matched);
                    blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }

    /* ══════════════════════════════════════════════════
       5. الأحداث
       ══════════════════════════════════════════════════ */
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            activeGender = this.dataset.gender;
            renderAll(window.rooms || []);
            applyFilters(document.getElementById('accomm-search')?.value || '');
        });
    });

    const searchInput = document.getElementById('accomm-search');
    if (searchInput) {
        searchInput.addEventListener('input',   e => applyFilters(e.target.value));
        searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') applyFilters(e.target.value, true); });
    }

    /* ══════════════════════════════════════════════════
       6. Overlay البحث الأولي
       ══════════════════════════════════════════════════ */
    function initSearchOverlay() {
        const overlay    = document.getElementById('accomm-search-overlay');
        const popupInput = document.getElementById('accomm-popup-search-input');
        const popupBtn   = document.getElementById('accomm-popup-search-btn');
        const closeBtn   = document.getElementById('accomm-popup-close-btn');
        if (!overlay) return;

        if (!sessionStorage.getItem('search_shown_accomm')) {
            overlay.style.display = 'flex';
            setTimeout(() => popupInput?.focus(), 500);
        }

        function doSearch() {
            const val = (popupInput?.value || '').trim();
            if (!val) {
                overlay.style.display = 'none';
                sessionStorage.setItem('search_shown_accomm', 'true');
                return;
            }
            const nq = YC.normalizeArabic(val);
            let matchedRoom = null, matchedPerson = null;
            for (const room of window.rooms || []) {
                const person = (room.persons || []).find(p => p && YC.normalizeArabic(p).includes(nq));
                if (person) { matchedRoom = room; matchedPerson = person; break; }
            }
            if (matchedRoom && matchedPerson) {
                try {
                    const profile = JSON.parse(localStorage.getItem('yc2_user_profile') || '{}');
                    profile.name = matchedPerson;
                    profile.room = matchedRoom.name;
                    profile.floor = matchedRoom.floor;
                    profile.gender = matchedRoom.gender;
                    profile.bed = (matchedRoom.persons.indexOf(matchedPerson) + 1);
                    localStorage.setItem('yc2_user_profile', JSON.stringify(profile));
                } catch(e) {}

                const searchBox  = document.getElementById('accomm-search-box');
                const successBox = document.getElementById('accomm-success-box');
                const welcomeTitle = document.getElementById('accomm-success-welcome');
                const welcomeDesc  = document.getElementById('accomm-success-desc');
                const showRoomBtn  = document.getElementById('accomm-success-show-btn');

                if (searchBox && successBox) {
                    searchBox.style.display = 'none';
                    successBox.style.display = 'block';
                    if (welcomeTitle) welcomeTitle.textContent = `أهلاً بك يا ${matchedPerson}! 🎉`;
                    if (welcomeDesc) welcomeDesc.innerHTML = `
                        تم تسكينك في الدور ${matchedRoom.floor === 1 ? 'الأول' : 'الثاني'}<br>
                        غرفتك: <strong style="color:#fbbf24; font-size:1.4rem; display:block; margin-top:0.4rem;">${matchedRoom.name}</strong>
                        سريرك رقم: <strong style="color:#06b6d4;">${matchedRoom.persons.indexOf(matchedPerson) + 1}</strong>
                    `;
                    if (showRoomBtn) showRoomBtn.onclick = () => {
                        overlay.style.display = 'none';
                        sessionStorage.setItem('search_shown_accomm', 'true');
                        if (searchInput) searchInput.value = val;
                        applyFilters(val, true);
                    };
                }
            } else {
                if (searchInput) searchInput.value = val;
                overlay.style.display = 'none';
                sessionStorage.setItem('search_shown_accomm', 'true');
                applyFilters(val, true);
            }
        }

        popupBtn?.addEventListener('click', doSearch);
        popupInput?.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
        closeBtn?.addEventListener('click', () => {
            overlay.style.display = 'none';
            sessionStorage.setItem('search_shown_accomm', 'true');
        });
    }

    /* ══════════════════════════════════════════════════
       7. تهيئة البيانات
       ══════════════════════════════════════════════════ */
    function buildRoomsFromData(data) {
        const participants = data.participants || [];
        window.rooms = (data.rooms || []).map(room => {
            const persons = Array(room.capacity).fill('');
            const roomDigits = room.id.match(/\d+/)?.[0] || '';

            const roomParticipants = participants.filter(p => {
                if (p.roomId === room.id) return true;
                if (p.room && roomDigits && String(p.room).includes(roomDigits)) return true;
                if (p.room && p.room === room.name) return true;
                return false;
            });

            roomParticipants.forEach(p => {
                const bNum = parseInt(p.bedNumber || p.bed);
                if (!isNaN(bNum) && bNum >= 1 && bNum <= room.capacity && !persons[bNum - 1]) {
                    persons[bNum - 1] = p.name;
                } else {
                    const freeIdx = persons.findIndex(n => !n);
                    if (freeIdx !== -1) persons[freeIdx] = p.name;
                }
            });

            return { id: room.id, name: room.name, floor: room.floor, capacity: room.capacity, gender: room.gender, persons };
        });

        renderAll(window.rooms);
        initSearchOverlay();
    }

    function initAccommodationData() {
        if (window.DataService) {
            window.DataService.loadConference()
                .then(data => buildRoomsFromData(data))
                .catch(err => console.error('[accommodation] Error:', err));
        } else {
            setTimeout(initAccommodationData, 50);
        }
    }

    window.addEventListener('yc_live_data_updated', e => { if (e.detail) buildRoomsFromData(e.detail); });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccommodationData);
    } else {
        initAccommodationData();
    }
})();
