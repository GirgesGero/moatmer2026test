/* =====================================================
   accommodation.js — مؤتمر الشباب 2026
   ممر فندقي ثلاثي الأبعاد تفاعلي للغرف والأسرّة
   ===================================================== */
(function () {
    'use strict';

    const list = document.getElementById('rooms-list');
    let activeGender = 'all';

    /* ══════════════════════════════════════════════════
       1. كارت غرفتي السريعة (My Quick Room Access)
       ══════════════════════════════════════════════════ */
    function checkAndRenderMyQuickRoomCard() {
        const container = document.getElementById('my-quick-room-container');
        if (!container) return;

        try {
            const profile = JSON.parse(localStorage.getItem('yc2_user_profile') || '{}');
            if (!profile || !profile.name || !profile.room) {
                container.innerHTML = '';
                return;
            }

            const floorText = profile.floor === 1 ? 'الأول (ولاد)' : 'الثاني (بنات)';
            const bedText   = profile.bed ? ` • السرير رقم ${profile.bed}` : '';

            container.innerHTML = `
                <div class="my-quick-room-card">
                    <div class="my-quick-room-info">
                        <div class="my-quick-room-icon">
                            <i class="bi bi-star-fill"></i>
                        </div>
                        <div class="my-quick-room-text">
                            <div>أهلاً بك يا ${profile.name}! 🎯</div>
                            <div style="font-size:0.75rem; color:#cbd5e1; font-weight:700; margin-top:2px;">
                                غرفتك: <strong style="color:#fbbf24;">${profile.room}</strong> (الدور ${floorText})${bedText}
                            </div>
                        </div>
                    </div>
                    <button class="btn-goto-my-room" id="btn-goto-my-room">
                        <i class="bi bi-geo-alt-fill me-1"></i> خذني لغرفتي
                    </button>
                </div>
            `;

            document.getElementById('btn-goto-my-room')?.addEventListener('click', () => {
                const matchedRoom = (window.rooms || []).find(r => r.name === profile.room || YC.normalizeArabic(r.name) === YC.normalizeArabic(profile.room));
                if (matchedRoom) {
                    const blockEl = document.getElementById(`room-block-${matchedRoom.id}`);
                    if (blockEl) {
                        blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const door = blockEl.querySelector('.room-door');
                        door?.classList.add('door-spotlight-glow');
                        setTimeout(() => {
                            door?.classList.remove('door-spotlight-glow');
                            openRoomModal(matchedRoom);
                        }, 600);
                    }
                }
            });
        } catch (e) {
            console.error('Error rendering quick room card:', e);
        }
    }

    /* ══════════════════════════════════════════════════
       2. بناء مكون الباب الخشبي الفندقي (3D Hotel Door)
       ══════════════════════════════════════════════════ */
    function buildDoorEl(room, sideClass) {
        const isBoysRoom = room.gender === 'boys';
        const color     = isBoysRoom ? '#38bdf8' : '#f87171';
        const genderTxt = isBoysRoom ? 'ولاد 🧒' : 'بنات 👧';
        const roomNum   = room.name.replace('غرفة ', '');
        const occupied  = room.persons.filter(Boolean).length;
        const pct       = Math.round((occupied / room.capacity) * 100);

        let statusClass = 'status-partial';
        let statusText  = 'متاح';
        let barColor    = '#f59e0b';

        if (occupied === 0) {
            statusClass = 'status-empty';
            statusText  = 'هنا مكان';
            barColor    = '#22c55e';
        } else if (occupied === room.capacity) {
            statusClass = 'status-full';
            statusText  = 'مكتملة';
            barColor    = '#ef4444';
        }

        const doorWrapper = document.createElement('div');
        doorWrapper.className = `room-door-wrapper ${room.gender}`;
        doorWrapper.id = `room-block-${room.id}`;

        const door = document.createElement('div');
        door.className = `room-door ${sideClass} ${statusClass} ${room.gender}`;
        
        door.innerHTML = `
            <div class="door-handle"></div>
            
            <div class="door-brass-plate">
                <div class="door-number">${roomNum}</div>
                <span class="door-status-text">${statusText}</span>
            </div>

            <div class="door-occupancy-info">
                <div class="door-occ-counts">
                    <span><i class="bi bi-person-fill" style="color:${color};"></i> ${occupied}/${room.capacity}</span>
                    <span style="color:${color}; font-size:0.6rem;">${genderTxt}</span>
                </div>
                <div class="door-occ-bar-bg">
                    <div class="door-occ-bar-fill" style="width:${pct}%; background:${barColor};"></div>
                </div>
            </div>

            <div class="door-light-leak"></div>
        `;

        door.addEventListener('click', () => {
            door.classList.add('open');
            setTimeout(() => {
                openRoomModal(room);
                door.classList.remove('open');
            }, 300);
        });

        doorWrapper.appendChild(door);
        return doorWrapper;
    }

    /* ══════════════════════════════════════════════════
       3. بناء ممر الأدوار (3D Hallway Scene)
       ══════════════════════════════════════════════════ */
    function buildHallwaySection(floorRooms, label, color) {
        const container = document.createElement('div');
        container.className = 'floor-hallway-container';

        // شارات العنوان
        const header = document.createElement('div');
        header.className = 'floor-title-badge';
        header.innerHTML = `
            <div class="line" style="background:${color};"></div>
            <div class="label" style="color:${color};">${label}</div>
            <div class="line" style="background:${color};"></div>
        `;
        container.appendChild(header);

        // مشهد الممر
        const scene = document.createElement('div');
        scene.className = 'hallway-scene';
        scene.innerHTML = `
            <div class="hallway-ceiling">
                <div class="ceiling-light"></div>
                <div class="ceiling-light"></div>
                <div class="ceiling-light"></div>
            </div>
            <div class="hallway-floor"></div>
            <div class="hallway-center-path"></div>
        `;

        // شبكة الممر المتوازية (أبواب يمين ويسار)
        const corridor = document.createElement('div');
        corridor.className = 'hallway-corridor';

        floorRooms.forEach((room, index) => {
            const sideClass = (index % 2 === 0) ? 'door-left' : 'door-right';
            const doorEl = buildDoorEl(room, sideClass);
            corridor.appendChild(doorEl);
        });

        scene.appendChild(corridor);
        container.appendChild(scene);
        return container;
    }

    /* ══════════════════════════════════════════════════
       4. رسم الكل — الممر الفندقي
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
                <i class="bi bi-door-closed" style="font-size:2.8rem; display:block; margin-bottom:10px; color:#475569;"></i>
                <div style="font-size:0.95rem; font-weight:700;">لا توجد غرف مطابقة للبحث</div>
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
            <i class="bi bi-door-closed-fill" style="color:#38bdf8;"></i>
            <span>${filtered.length} غرفة</span>
        </div>
        <div class="stat-item">
            <i class="bi bi-person-check-fill" style="color:#22c55e;"></i>
            <span>${totalOccupied} مشغول</span>
        </div>
        <div class="stat-item">
            <i class="bi bi-moon-stars-fill" style="color:#f59e0b;"></i>
            <span>${totalFree} شاغر</span>
        </div>`;
        list.appendChild(statsEl);

        // ─── الدور الأول ───
        const floor1 = filtered.filter(r => r.floor === 1);
        if (floor1.length) {
            const sec = buildHallwaySection(floor1, '🚪 الدور الأول — ممر الشباب 🧒', '#38bdf8');
            list.appendChild(sec);
        }

        // ─── فاصل المصعد والسلالم الفندقية ───
        if (floor1.length && filtered.some(r => r.floor === 2)) {
            const elevatorDivider = document.createElement('div');
            elevatorDivider.className = 'hotel-elevator-divider';
            elevatorDivider.innerHTML = `
                <span class="hotel-elevator-icon"><i class="bi bi-border-style"></i> 🛗</span>
                <span>مصعد الفندق والسلالم الرئيسية — الانتقال للدور الأعلى</span>
                <span class="hotel-elevator-icon">🪜</span>
            `;
            list.appendChild(elevatorDivider);
        }

        // ─── الدور الثاني ───
        const floor2 = filtered.filter(r => r.floor === 2);
        if (floor2.length) {
            const sec = buildHallwaySection(floor2, '🚪 الدور الثاني — ممر البنات 👧', '#f87171');
            list.appendChild(sec);
        }

        checkAndRenderMyQuickRoomCard();
    }

    /* ══════════════════════════════════════════════════
       5. مودال الغرفة المعماري داخل الغرفة (Architectural Room View)
       ══════════════════════════════════════════════════ */
    function openRoomModal(room) {
        const titleEl = document.getElementById('room-modal-title');
        const gridEl  = document.getElementById('room-modal-beds-grid');
        if (!titleEl || !gridEl) return;

        const isBoysRoom = room.gender === 'boys';
        const color      = isBoysRoom ? '#38bdf8' : '#f87171';
        const genderText = isBoysRoom ? 'ولاد 🧒' : 'بنات 👧';
        const floorText  = room.floor === 1 ? 'الأول' : 'الثاني';
        const occupied   = room.persons.filter(Boolean).length;
        const pct        = Math.round((occupied / room.capacity) * 100);

        titleEl.innerHTML = `
            <div class="d-flex align-items-center justify-content-between w-100 pe-3">
                <div>
                    <span class="fs-5">${room.name}</span>
                    <span class="badge ms-2" style="background:${color}22; color:${color}; border:1px solid ${color}44; font-size:0.75rem;">
                        ${genderText} — الدور ${floorText}
                    </span>
                </div>
            </div>
        `;

        // بناء الأسرّة داخل المخطط المعماري
        const bedsCardsHtml = room.persons.map((personName, index) => {
            const bedNum = index + 1;
            const isFull = !!personName;
            const statusClass = isFull ? 'occupied' : 'empty';
            const icon = isFull ? (isBoysRoom ? 'bi-person-fill' : 'bi-person-fill-dress') : 'bi-moon-stars-fill';

            return `
            <div class="bed-3d-card ${room.gender} ${statusClass}" style="animation-delay: ${index * 70}ms;">
                <span class="bed-number-badge">سرير #${bedNum}</span>
                <div class="bed-pillow"></div>
                <div style="font-size:1.4rem; color:${isFull ? color : '#64748b'}; margin: 2px 0;">
                    <i class="bi ${icon}"></i>
                </div>
                <div class="bed-person-name-title">
                    ${isFull ? personName : 'شاغر 😴'}
                </div>
            </div>`;
        }).join('');

        gridEl.innerHTML = `
            <div class="text-center mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1 px-2">
                    <span class="fw-bold text-slate-300" style="font-size:0.85rem;">نسبة الإشغال</span>
                    <span class="fw-bold" style="color:${color};">${occupied} من ${room.capacity} أسرة</span>
                </div>
                <div class="progress" style="height: 6px; background: rgba(255,255,255,0.08); border-radius:99px;">
                    <div class="progress-bar" style="width: ${pct}%; background: ${color}; border-radius:99px; transition: width 0.6s ease;"></div>
                </div>
            </div>

            <div class="room-architectural-plan">
                <div class="plan-door-entrance">🚪 مدخل الغرفة</div>
                
                <div class="beds-architecture-grid">
                    ${bedsCardsHtml}
                </div>

                <div class="plan-window"></div>
            </div>
        `;

        // تشغيل أنيميشن ظهور الأسرّة Stagger Pop-in
        setTimeout(() => {
            document.querySelectorAll('.bed-3d-card').forEach(card => {
                card.classList.add('animate-pop');
            });
        }, 50);

        const modalEl = document.getElementById('roomDetailsModal');
        if (modalEl) {
            const myModal = new bootstrap.Modal(modalEl);
            myModal.show();
        }
    }

    /* ══════════════════════════════════════════════════
       6. فلتر + بحث
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

        // تحديث التظليل مباشرةً
        if (!query) {
            document.querySelectorAll('.room-door-wrapper').forEach(el => {
                const door = el.querySelector('.room-door');
                door?.classList.remove('highlighted', 'dimmed', 'door-spotlight-glow');
                const g = el.classList.contains('boys') ? 'boys' : 'girls';
                el.style.display = (activeGender === 'all' || g === activeGender) ? '' : 'none';
            });
        } else {
            const matchedIds = new Set(filtered.map(r => r.id));
            document.querySelectorAll('.room-door-wrapper').forEach(el => {
                const roomId = el.id.replace('room-block-', '');
                const door = el.querySelector('.room-door');
                const g = el.classList.contains('boys') ? 'boys' : 'girls';
                const genderOk = activeGender === 'all' || g === activeGender;
                if (!genderOk) { el.style.display = 'none'; return; }
                el.style.display = '';
                if (matchedIds.has(roomId)) {
                    door?.classList.add('highlighted');
                    door?.classList.remove('dimmed');
                } else {
                    door?.classList.add('dimmed');
                    door?.classList.remove('highlighted');
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

        // فتح المودال تلقائياً والتمرير بأسلوب Spotlight
        if (autoOpenModal && query && filtered.length > 0) {
            const matched = filtered[0];
            const blockEl = document.getElementById(`room-block-${matched.id}`);
            if (blockEl) {
                setTimeout(() => {
                    blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const door = blockEl.querySelector('.room-door');
                    door?.classList.add('door-spotlight-glow');
                    setTimeout(() => {
                        openRoomModal(matched);
                        door?.classList.remove('door-spotlight-glow');
                    }, 400);
                }, 100);
            }
        }
    }

    /* ══════════════════════════════════════════════════
       7. الأحداث
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
       8. Overlay البحث الأولي مع الاقتراحات الحية ورسالة "اسمك مش موجود"
       ══════════════════════════════════════════════════ */
    function initSearchOverlay() {
        const overlay       = document.getElementById('accomm-search-overlay');
        const popupInput    = document.getElementById('accomm-popup-search-input');
        const popupBtn      = document.getElementById('accomm-popup-search-btn');
        const closeBtn      = document.getElementById('accomm-popup-close-btn');
        const suggestionsEl = document.getElementById('accomm-search-suggestions');
        const noMatchEl     = document.getElementById('accomm-no-match-msg');
        const btnsWrap      = document.getElementById('accomm-search-btns-wrap');

        if (!overlay) return;

        if (!sessionStorage.getItem('search_shown_accomm')) {
            overlay.style.display = 'flex';
            setTimeout(() => popupInput?.focus(), 500);
        }

        // 1. توليد الخيارات عند تطابق الأحرف (Live Autocomplete Suggestions)
        function renderLiveSuggestions() {
            if (!suggestionsEl || !popupInput) return;
            const val = popupInput.value.trim();
            const nq = YC.normalizeArabic(val);

            if (noMatchEl) noMatchEl.style.display = 'none';
            if (btnsWrap) btnsWrap.style.display = 'flex';

            if (!nq || nq.length < 2) {
                suggestionsEl.innerHTML = '';
                suggestionsEl.classList.remove('show');
                return;
            }

            const matches = [];
            for (const room of window.rooms || []) {
                (room.persons || []).forEach((person, bIdx) => {
                    if (person && YC.normalizeArabic(person).includes(nq)) {
                        matches.push({
                            type: 'person',
                            name: person,
                            room: room,
                            bed: bIdx + 1
                        });
                    }
                });
                if (YC.normalizeArabic(room.name).includes(nq)) {
                    matches.push({
                        type: 'room',
                        name: room.name,
                        room: room
                    });
                }
            }

            if (!matches.length) {
                suggestionsEl.innerHTML = '';
                suggestionsEl.classList.remove('show');
                return;
            }

            const topMatches = matches.slice(0, 5);
            suggestionsEl.innerHTML = topMatches.map((m, idx) => {
                const icon = m.type === 'person' ? (m.room.gender === 'boys' ? 'bi-person-fill' : 'bi-person-fill-dress') : 'bi-door-closed-fill';
                const color = m.room.gender === 'boys' ? '#38bdf8' : '#f87171';
                const meta = m.type === 'person' ? `${m.room.name} (سرير #${m.bed})` : `الدور ${m.room.floor === 1 ? 'الأول' : 'الثاني'}`;

                return `
                    <div class="suggestion-item" data-idx="${idx}">
                        <div>
                            <i class="bi ${icon} me-1" style="color:${color};"></i>
                            <span>${m.name}</span>
                        </div>
                        <span style="font-size:0.72rem; color:#94a3b8;">${meta}</span>
                    </div>
                `;
            }).join('');

            suggestionsEl.classList.add('show');

            // عند الضغط على اختيار من القائمة
            suggestionsEl.querySelectorAll('.suggestion-item').forEach((item, idx) => {
                item.addEventListener('click', () => {
                    const selected = topMatches[idx];
                    popupInput.value = selected.name;
                    suggestionsEl.innerHTML = '';
                    suggestionsEl.classList.remove('show');
                    selectAndHighlightMatch(selected.room, selected.type === 'person' ? selected.name : null);
                });
            });
        }

        function selectAndHighlightMatch(matchedRoom, matchedPerson) {
            if (matchedPerson) {
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
                        تم تسكينك في الدور ${matchedRoom.floor === 1 ? 'الأول (ولاد)' : 'الثاني (بنات)'}<br>
                        غرفتك: <strong style="color:#fbbf24; font-size:1.4rem; display:block; margin-top:0.4rem;">${matchedRoom.name}</strong>
                        سريرك رقم: <strong style="color:#06b6d4;">${matchedRoom.persons.indexOf(matchedPerson) + 1}</strong>
                    `;
                    if (showRoomBtn) showRoomBtn.onclick = () => {
                        overlay.style.display = 'none';
                        sessionStorage.setItem('search_shown_accomm', 'true');
                        applyFilters(matchedPerson, true);
                    };
                }
            } else {
                overlay.style.display = 'none';
                sessionStorage.setItem('search_shown_accomm', 'true');
                applyFilters(matchedRoom.name, true);
            }
        }

        // 2. معالجة البحث المباشر بالتأكيد
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
                if (YC.normalizeArabic(room.name).includes(nq)) { matchedRoom = room; break; }
            }

            if (matchedRoom) {
                selectAndHighlightMatch(matchedRoom, matchedPerson);
            } else {
                // 🛑 رسالة: اسمك مش موجود!
                if (suggestionsEl) {
                    suggestionsEl.innerHTML = '';
                    suggestionsEl.classList.remove('show');
                }
                if (noMatchEl) {
                    noMatchEl.style.display = 'block';
                    noMatchEl.innerHTML = `
                        <div class="search-no-match-box">
                            <div style="font-size:2.2rem; margin-bottom:0.2rem;">😅</div>
                            <div style="font-size:1.05rem; font-weight:900; color:#fb7185;">اسمك مش موجود في قائمة التسكين</div>
                            <div style="font-size:0.78rem; color:#cbd5e1; margin-top:0.35rem; line-height:1.5;">
                                اتأكد من كتابة الاسم صح أو ابعت للمسؤول عشان يضيفك
                            </div>
                            <button class="btn-secondary-app mt-3" id="accomm-retry-btn" style="padding:0.45rem 1.1rem; font-size:0.82rem;">
                                <i class="bi bi-arrow-counterclockwise me-1"></i> جرّب اسم تاني
                            </button>
                        </div>
                    `;

                    document.getElementById('accomm-retry-btn')?.addEventListener('click', () => {
                        noMatchEl.style.display = 'none';
                        if (popupInput) {
                            popupInput.value = '';
                            popupInput.focus();
                        }
                    });
                }
            }
        }

        popupInput?.addEventListener('input', renderLiveSuggestions);
        popupBtn?.addEventListener('click', doSearch);
        popupInput?.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
        closeBtn?.addEventListener('click', () => {
            overlay.style.display = 'none';
            sessionStorage.setItem('search_shown_accomm', 'true');
        });
    }

    /* ══════════════════════════════════════════════════
       9. تهيئة البيانات
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
