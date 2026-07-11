/* accommodation.js — منطق عرض التسكين والممرات التفاعلية المطور (v2.3) */
(function () {
    'use strict';

    const list = document.getElementById('rooms-list');
    let activeGender = 'all';

    /* ─── 1. رسم بطاقة الغرفة كمجسم ممر ─── */
    function renderRoomBlock(room) {
        const div = document.createElement('div');
        div.className = `corridor-room-block ${room.gender}`;
        div.id = `room-block-${room.id}`;

        const roomNumText = room.name.replace('غرفة ', '');
        const genderLabel = room.gender === 'boys' ? 'ولاد' : 'بنات';

        // رسم نقاط الأسرّة (الزي/الإشغال) في الكارت الصغير
        let dotsHtml = '';
        for (let i = 0; i < room.capacity; i++) {
            const isOccupied = room.persons[i] ? 'occupied' : '';
            dotsHtml += `<span class="dot ${isOccupied} ${room.gender}"></span>`;
        }

        div.innerHTML = `
            <div class="room-num">${roomNumText}</div>
            <div class="room-gender-tag">${genderLabel}</div>
            <div class="beds-indicator-dots">
                ${dotsHtml}
            </div>
        `;

        // عند الضغط على الغرفة نفتح المودال
        div.addEventListener('click', () => {
            openRoomModal(room);
        });

        return div;
    }

    /* ─── 2. رسم الممر (Corridor/Hallway) بالكامل ─── */
    function renderCorridor(floorRooms, floorNum, genderText, colorTheme) {
        const container = document.createElement('div');
        container.className = 'corridor-hallway-container animate__animated animate__fadeIn';

        // الممر في المنتصف (الطرقة)
        const walkway = document.createElement('div');
        walkway.className = 'corridor-walkway';
        walkway.innerHTML = `
            <i class="bi bi-chevron-bar-expand"></i>
            <i class="bi bi-door-open" style="font-size:1.1rem; opacity:0.25;"></i>
            <i class="bi bi-chevron-bar-expand"></i>
        `;
        container.appendChild(walkway);

        // أعمدة الغرف الجانبية
        const leftSide = document.createElement('div');
        leftSide.className = 'corridor-rooms-side left'; // للغرف الزوجية

        const rightSide = document.createElement('div');
        rightSide.className = 'corridor-rooms-side right'; // للغرف الفردية

        // ترتيب الغرف فردي يمين وزوجي يسار
        floorRooms.forEach(room => {
            const roomNum = parseInt(room.name.replace('غرفة ', ''));
            const block = renderRoomBlock(room);
            
            if (roomNum % 2 === 1) {
                rightSide.appendChild(block);
            } else {
                leftSide.appendChild(block);
            }
        });

        container.appendChild(rightSide);
        container.appendChild(leftSide);

        return container;
    }

    /* ─── 3. الرسم الكامل والتفريع حسب الطوابق ─── */
    function renderAll(rooms) {
        if (!list) return;
        list.innerHTML = '';

        if (!rooms || rooms.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-house-door"></i>
                    <p>لا توجد غرف مطابقة لعملية البحث</p>
                </div>`;
            return;
        }

        const floor1Rooms = rooms.filter(r => r.floor === 1);
        const floor2Rooms = rooms.filter(r => r.floor === 2);

        // الدور الأول (ولاد)
        if (floor1Rooms.length > 0) {
            if (activeGender === 'all') {
                const header = document.createElement('div');
                header.className = 'section-label';
                header.style.cssText = 'margin: 0.8rem 0.75rem 0.5rem;';
                header.innerHTML = '<i class="bi bi-layers-half me-1" style="color:var(--primary-light)"></i> الدور الأول (ولاد)';
                list.appendChild(header);
            }
            list.appendChild(renderCorridor(floor1Rooms, 1, 'ولاد', 'var(--primary-light)'));
        }

        // الدور الثاني (بنات)
        if (floor2Rooms.length > 0) {
            if (activeGender === 'all') {
                const header = document.createElement('div');
                header.className = 'section-label';
                header.style.cssText = 'margin: 1.6rem 0.75rem 0.5rem;';
                header.innerHTML = '<i class="bi bi-layers-half me-1" style="color:#fb7185"></i> الدور الثاني (بنات)';
                list.appendChild(header);
            }
            list.appendChild(renderCorridor(floor2Rooms, 2, 'بنات', '#fb7185'));
        }
    }

    /* ─── 4. فتح مودال تفاصيل الغرفة والأسرّة والزي ─── */
    function openRoomModal(room) {
        const titleEl = document.getElementById('room-modal-title');
        const gridEl  = document.getElementById('room-modal-beds-grid');
        if (!titleEl || !gridEl) return;

        const genderText = room.gender === 'boys' ? 'ولاد' : 'بنات';
        titleEl.textContent = `${room.name} — الدور ${room.floor === 1 ? 'الأول' : 'الثاني'} (${genderText})`;

        // أبعاد الحاوية التفاعلية العائمة بالكامل خارج الدائرة المركزية الصغير
        const containerSize = 320;
        const cx = containerSize / 2;
        const cy = containerSize / 2;
        const radius = 110; // ترحيل الأسرّة بعيداً عن المركز بمقدار 110px

        const radialContainer = document.createElement('div');
        radialContainer.className = 'radial-room-container animate__animated animate__zoomIn';
        radialContainer.style.width = `${containerSize}px`;
        radialContainer.style.height = `${containerSize}px`;

        // إنشاء الـ SVG لرسم الأشعة (شعاع من الدائرة لمربع السرير)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'radial-svg');
        svg.setAttribute('width', containerSize.toString());
        svg.setAttribute('height', containerSize.toString());
        radialContainer.appendChild(svg);

        const count = room.capacity;

        for (let i = 0; i < count; i++) {
            // توزيع الأسرة بالزوايا بشكل دائري حول المركز
            const angle = (i * (2 * Math.PI / count)) - (Math.PI / 2);
            const xBed = cx + radius * Math.cos(angle);
            const yBed = cy + radius * Math.sin(angle);

            const occupant = room.persons[i];
            const isOccupied = !!occupant;

            // رسم خط الشعاع (ray) يبدأ من حافة الدائرة المركزية (نصف القطر 43px)
            const rHub = 43;
            const xStart = cx + rHub * Math.cos(angle);
            const yStart = cy + rHub * Math.sin(angle);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', xStart.toString());
            line.setAttribute('y1', yStart.toString());
            line.setAttribute('x2', xBed.toString());
            line.setAttribute('y2', yBed.toString());
            
            if (isOccupied) {
                line.setAttribute('stroke', room.gender === 'boys' ? '#06b6d4' : '#fb7185');
                line.setAttribute('stroke-width', '2');
            } else {
                line.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('stroke-dasharray', '4, 4');
            }
            svg.appendChild(line);

            // إنشاء كارت السرير المربع (مربع السرير)
            const bedSlot = document.createElement('div');
            bedSlot.className = isOccupied ? `radial-bed-slot occupied ${room.gender}` : 'radial-bed-slot empty';
            
            // تحديد الإحداثيات المطلقة للمربع (نصف عرض السرير 27px)
            bedSlot.style.left = `${xBed - 27}px`;
            bedSlot.style.top = `${yBed - 27}px`;

            if (isOccupied) {
                const icon = room.gender === 'boys' ? 'bi-person-standing' : 'bi-person-standing-dress';
                bedSlot.innerHTML = `
                    <i class="bi ${icon}"></i>
                    <div class="bed-name-radial" title="${occupant}">${occupant}</div>
                `;
            } else {
                bedSlot.innerHTML = `
                    <i class="bi bi-door-closed" style="font-size: 1.1rem; opacity: 0.35;"></i>
                    <div class="bed-name-radial">شاغر</div>
                `;
            }

            radialContainer.appendChild(bedSlot);
        }

        gridEl.innerHTML = '';
        gridEl.appendChild(radialContainer);

        // حقن رقم الغرفة والنوع داخل الدائرة الصغيرة المركزية (modal-content نفسها)
        const modalContent = document.querySelector('.circular-modal .modal-content');
        if (modalContent) {
            let hubCenter = modalContent.querySelector('.radial-room-hub-center');
            if (!hubCenter) {
                hubCenter = document.createElement('div');
                hubCenter.className = 'radial-room-hub-center';
                modalContent.appendChild(hubCenter);
            }
            const roomNumText = room.name.replace('غرفة ', '');
            hubCenter.innerHTML = `
                <div class="hub-title">${roomNumText}</div>
                <div class="hub-subtitle">${genderText}</div>
            `;
        }

        // إظهار المودال وتعيين بورد النيون الدائري
        const modalEl = document.getElementById('roomDetailsModal');
        if (modalEl) {
            modalEl.classList.remove('boys', 'girls');
            modalEl.classList.add(room.gender);
            const myModal = new bootstrap.Modal(modalEl);
            myModal.show();
        }
    }

    /* ─── 5. فلتر وبحث ذكي مع فتح الغرفة المطابقة ─── */
    function applyFilters(q) {
        const query = YC.normalizeArabic(q || '');
        
        // إزالة التظليل النيوني القديم
        document.querySelectorAll('.corridor-room-block').forEach(b => b.classList.remove('highlighted'));

        const filtered = (window.rooms || []).filter(room => {
            const genderOk = activeGender === 'all' || room.gender === activeGender;
            if (!genderOk) return false;
            if (!query) return true;
            
            const nameMatch = YC.normalizeArabic(room.name).includes(query);
            const personMatch = (room.persons || []).some(p => YC.normalizeArabic(p).includes(query));
            return nameMatch || personMatch;
        });

        renderAll(filtered);

        // إظهار وتحديث بادج تصفية البحث النشط
        const wrap = document.getElementById('accomm-active-search-wrap');
        if (wrap) {
            if (q) {
                wrap.style.display = 'block';
                wrap.innerHTML = `
                    <div class="active-search-badge animate__animated animate__fadeIn" style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.3); color:#fbbf24; padding:0.35rem 0.8rem; border-radius:12px; font-size:0.78rem; font-weight:700;">
                        <span>البحث: "${q}"</span>
                        <i class="bi bi-x-circle-fill" id="clear-search-badge-btn" style="cursor:pointer; opacity:0.8; transition:opacity 0.2s;"></i>
                    </div>
                `;
                
                document.getElementById('clear-search-badge-btn')?.addEventListener('click', () => {
                    if (searchInput) searchInput.value = '';
                    wrap.style.display = 'none';
                    applyFilters('');
                });
            } else {
                wrap.style.display = 'none';
            }
        }

        // إذا كان هناك بحث مطابق تماماً لاسم شخص أو غرفة، نقوم بفتحها وتظليلها
        if (query.length > 0 && filtered.length > 0) {
            const matchedRoom = filtered[0];
            const blockEl = document.getElementById(`room-block-${matchedRoom.id}`);
            if (blockEl) {
                blockEl.classList.add('highlighted');
                // فتح المودال الخاص بالغرفة تلقائياً
                setTimeout(() => {
                    openRoomModal(matchedRoom);
                    blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 400);
            }
        }
    }

    /* ─── 6. ربط التبويبات الفلتر ─── */
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            activeGender = this.dataset.gender;
            applyFilters(document.getElementById('accomm-search')?.value || '');
        });
    });

    /* ─── 7. ربط خانة البحث الرئيسية ─── */
    const searchInput = document.getElementById('accomm-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applyFilters(this.value);
        });
    }

    /* ─── 8. منطق نافذة البحث التلقائية المنبثقة (Overlay) ─── */
    function initSearchOverlay() {
        const overlay = document.getElementById('accomm-search-overlay');
        const popupInput = document.getElementById('accomm-popup-search-input');
        const popupBtn = document.getElementById('accomm-popup-search-btn');
        const closeBtn = document.getElementById('accomm-popup-close-btn');

        if (!overlay) return;

        // إظهار البوب أب فقط في أول زيارة للجلسة (session)
        if (!sessionStorage.getItem('search_shown_accomm')) {
            overlay.style.display = 'flex';
            setTimeout(() => {
                popupInput?.focus();
            }, 500);
        }

        // إغلاق وبدء البحث
        function doPopupSearch() {
            const val = (popupInput?.value || '').trim();
            const normalizedQuery = YC.normalizeArabic(val);
            
            if (!val) {
                overlay.style.display = 'none';
                sessionStorage.setItem('search_shown_accomm', 'true');
                if (searchInput) searchInput.focus();
                return;
            }

            // البحث عن الشخص المطابق للترحيب
            let matchedRoom = null;
            let matchedPerson = null;

            if (normalizedQuery.length > 0) {
                for (const room of window.rooms || []) {
                    const person = (room.persons || []).find(p => YC.normalizeArabic(p).includes(normalizedQuery));
                    if (person) {
                        matchedRoom = room;
                        matchedPerson = person;
                        break;
                    }
                }
            }

            if (matchedRoom && matchedPerson) {
                // حفظ البيانات في الملف التعريفي الموحد للمستخدم
                try {
                    let profile = JSON.parse(localStorage.getItem('yc2_user_profile') || '{}');
                    profile.name = matchedPerson;
                    profile.room = matchedRoom.name;
                    profile.floor = matchedRoom.floor;
                    profile.gender = matchedRoom.gender;
                    profile.bed = (matchedRoom.persons.indexOf(matchedPerson) + 1);
                    localStorage.setItem('yc2_user_profile', JSON.stringify(profile));
                } catch(e) { console.error(e); }

                const searchBox = document.getElementById('accomm-search-box');
                const successBox = document.getElementById('accomm-success-box');
                const welcomeTitle = document.getElementById('accomm-success-welcome');
                const welcomeDesc = document.getElementById('accomm-success-desc');
                const showRoomBtn = document.getElementById('accomm-success-show-btn');

                if (searchBox && successBox && welcomeTitle && welcomeDesc) {
                    searchBox.style.display = 'none';
                    successBox.style.display = 'block';
                    welcomeTitle.textContent = `أهلاً بك يا ${matchedPerson}! 🎉`;
                    
                    const genderText = matchedRoom.gender === 'boys' ? 'ولاد' : 'بنات';
                    welcomeDesc.innerHTML = `
                        تم تسكينك في الدور ${matchedRoom.floor === 1 ? 'الأول' : 'الثاني'} (${genderText})<br>
                        رقم غرفتك هي: <strong style="color:#fbbf24; font-size:1.4rem; display:block; margin-top:0.4rem;">${matchedRoom.name}</strong>
                    `;

                    showRoomBtn.onclick = function() {
                        overlay.style.display = 'none';
                        sessionStorage.setItem('search_shown_accomm', 'true');
                        if (searchInput) searchInput.value = val;
                        applyFilters(val);
                    };
                }
            } else {
                if (searchInput) searchInput.value = val;
                overlay.style.display = 'none';
                sessionStorage.setItem('search_shown_accomm', 'true');
                applyFilters(val);
            }
        }

        popupBtn?.addEventListener('click', doPopupSearch);
        
        popupInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doPopupSearch();
        });

        closeBtn?.addEventListener('click', () => {
            overlay.style.display = 'none';
            sessionStorage.setItem('search_shown_accomm', 'true');
            if (searchInput) searchInput.focus();
        });
    }

    /* ─── التهيئة الأولى ─── */
    function buildRoomsFromData(data) {
        window.rooms = (data.rooms || []).map(room => {
            const persons = Array(room.capacity).fill('');
            const roomParticipants = (data.participants || []).filter(p => p.roomId === room.id);
            roomParticipants.forEach(p => {
                if (p.bedNumber && p.bedNumber <= room.capacity) {
                    persons[p.bedNumber - 1] = p.name;
                }
            });
            return {
                id: room.id,
                name: room.name,
                floor: room.floor,
                capacity: room.capacity,
                gender: room.gender,
                persons: persons
            };
        });

        renderAll(window.rooms);
        initSearchOverlay();
    }

    // قراءة البيانات: نعطي الأولوية للمسودة المحفوظة في localStorage
    try {
        const saved = localStorage.getItem('conference_db_draft');
        if (saved) {
            const draft = JSON.parse(saved);
            if (draft && draft.db && draft.db.participants) {
                console.log('[accommodation] قراءة البيانات من مسودة المتصفح');
                buildRoomsFromData(draft.db);
            } else {
                throw new Error('مسودة غير مكتملة');
            }
        } else {
            throw new Error('لا توجد مسودة');
        }
    } catch (e) {
        console.log('[accommodation] الرجوع إلى DataService:', e.message);
        DataService.loadConference().then(data => buildRoomsFromData(data));
    }
})();
