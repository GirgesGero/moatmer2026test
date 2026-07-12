/* ========================================================
   manage-passengers.js — مؤتمر الشباب 2026
   لوحة الإدارة الشاملة (أتوبيسات / غرف وسكن / مجموعات)
   يرتبط بالكامل بـ conference-data.json ويحفظ المسودات محلياً
   ======================================================== */

'use strict';

const SEATS_PER_BUS = 49;
let db = null; // قاعدة البيانات الكاملة للمؤتمر

let currentSection = 'buses'; // الأقسام: buses, rooms, groups
let currentBus = 1; // الأتوبيس النشط
let currentGender = 'boys'; // الجنس النشط للغرف: boys, girls
let currentFloor = null; // الدور النشط للغرف

let editingParticipantId = null; // معرف المشترك الجاري تعديله
let hasUnsavedChanges = false; // هل توجد تغييرات محلية لم تُصدر كملف بعد
let hasExported = false; // هل تم تصدير الملف في الجلسة الحالية

/* ========================================================
   أدوات الحماية والأمان والـ Helper Functions
   ======================================================== */
function escapeHTML(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function showToast(msg, type = 'info') {
    const cls = 'toast-msg toast-' + type;
    const $toast = $('<div class="' + cls + '">' + msg + '</div>');
    $('body').append($toast);
    setTimeout(() => $toast.addClass('show'), 50);
    setTimeout(() => {
        $toast.removeClass('show');
        setTimeout(() => $toast.remove(), 400);
    }, 2500);
}

function showConfirm(title, text, onConfirm) {
    $('#confirmTitle').text(title);
    $('#confirmText').html(text);
    $('#confirmOverlay').addClass('show');

    $('#confirmYes').off('click').on('click', function() {
        closeConfirm();
        onConfirm();
    });
}

function closeConfirm() {
    $('#confirmOverlay').removeClass('show');
}

/* ========================================================
   إدارة الـ localStorage والمسودات
   ======================================================= */
function saveToStorage() {
    if (!db) return;
    try {
        const draft = {
            db: db,
            lastSaved: new Date().toISOString(),
            version: 'v4'
        };
        localStorage.setItem('conference_db_draft', JSON.stringify(draft));

        // تحديث cache الـ DataService و window.conferenceData مباشرةً
        // حتى تعمل صفحات buses و accommodation بالبيانات الجديدة في نفس الجلسة
        if (window.DataService) {
            window.DataService.cachedData = db;
        }
        window.conferenceData = db;

        updateSaveIndicator();
    } catch (e) {
        console.error('Error saving draft to localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const savedDraft = localStorage.getItem('conference_db_draft');
        if (savedDraft) {
            const data = JSON.parse(savedDraft);
            if (data.db && data.db.participants) {
                db = data.db;
                console.log('Loaded database draft from localStorage:', db.participants.length, 'participants');
                return true;
            }
        }
    } catch (e) {
        console.error('Error loading draft from localStorage:', e);
    }
    return false;
}

function updateSaveIndicator() {
    const $dot = $('#saveDot');
    const $status = $('#saveStatus');
    if (hasUnsavedChanges) {
        $dot.addClass('unsaved');
        $status.text('تغييرات غير محفوظة محلياً...');
    } else if (hasExported) {
        $dot.removeClass('unsaved');
        $status.text('تم تصدير conference-data.json بنجاح ✅');
    } else {
        $dot.addClass('unsaved');
        $status.text('لم يتم تصدير الملف بعد ⚠️ (التعديلات محفوظة بمسودة المتصفح)');
    }
}

function markUnsaved() {
    hasUnsavedChanges = true;
    hasExported = false;
    updateSaveIndicator();
}

/* ========================================================
   بناء شريط الإحصائيات الديناميكي
   ======================================================== */
function renderStatsBar() {
    if (!db) return;
    const participants = db.participants || [];
    const rooms = db.rooms || [];
    const buses = db.buses || [];
    const groups = db.groups || [];

    if (currentSection === 'buses') {
        $('#statLabel1').text('الركاب');
        $('#statLabel2').text('المقاعد الفاضية');
        $('#statLabel3').text('إجمالي المقاعد');

        const totalPassengers = participants.filter(p => p.busNumber != null).length;
        const totalSeats = buses.reduce((acc, b) => acc + (b.capacity || 0), 0);
        const totalEmpty = totalSeats - totalPassengers;

        $('#statVal1').text(totalPassengers).removeClass().addClass('stat-value purple');
        $('#statVal2').text(totalEmpty).removeClass().addClass('stat-value green');
        $('#statVal3').text(totalSeats).removeClass().addClass('stat-value cyan');
    } else if (currentSection === 'rooms') {
        $('#statLabel1').text('إجمالي المقيمين');
        $('#statLabel2').text('الأسرّة الفاضية');
        $('#statLabel3').text('إجمالي الأسرّة');

        const totalResidents = participants.filter(p => p.roomId != null).length;
        const totalBeds = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
        const totalEmpty = totalBeds - totalResidents;

        $('#statVal1').text(totalResidents).removeClass().addClass('stat-value purple');
        $('#statVal2').text(totalEmpty).removeClass().addClass('stat-value green');
        $('#statVal3').text(totalBeds).removeClass().addClass('stat-value cyan');
    } else if (currentSection === 'groups') {
        $('#statLabel1').text('إجمالي المشتركين');
        $('#statLabel2').text('عدد المجموعات');
        $('#statLabel3').text('متوسط أفراد المجموعة');

        const totalParticipants = participants.length;
        const totalGroups = groups.length;
        const avg = totalGroups > 0 ? (totalParticipants / totalGroups).toFixed(1) : 0;

        $('#statVal1').text(totalParticipants).removeClass().addClass('stat-value purple');
        $('#statVal2').text(totalGroups).removeClass().addClass('stat-value green');
        $('#statVal3').text(avg).removeClass().addClass('stat-value cyan');
    }
}

/* ========================================================
   منطق تبديل الأقسام وتعبئة القوائم المنسدلة
   ======================================================== */
function switchSection(section) {
    currentSection = section;

    $('.section-tab').removeClass('active');
    $(`.section-tab[data-section="${section}"]`).addClass('active');

    $('#buses-panel').toggle(section === 'buses');
    $('#rooms-panel').toggle(section === 'rooms');
    $('#groups-panel').toggle(section === 'groups');

    $('#searchInput').val('');

    renderStatsBar();
    refreshAll();
}

function populateDropdowns() {
    if (!db) return;

    // المجموعات
    let groupHtml = '<option value="none">بدون مجموعة</option>';
    if (db.groups) {
        db.groups.forEach(g => {
            groupHtml += `<option value="${g.id}">${escapeHTML(g.name)}</option>`;
        });
    }
    $('#editGroup, #addGroup').html(groupHtml);

    // الغرف
    let roomHtml = '<option value="none">بدون تسكين</option>';
    if (db.rooms) {
        db.rooms.forEach(r => {
            const genderLbl = r.gender === 'boys' ? '👦 أولاد' : '👧 بنات';
            roomHtml += `<option value="${r.id}">${escapeHTML(r.name)} (${genderLbl} - دور ${r.floor})</option>`;
        });
    }
    $('#editRoom, #addRoom').html(roomHtml);
}

function refreshAll() {
    if (currentSection === 'buses') {
        renderBusSubTabs();
        renderSeatsGrid();
        renderPassengerList();
    } else if (currentSection === 'rooms') {
        renderFloorTabs();
        renderRoomsGrid();
        renderRoomsPassengerList();
    } else if (currentSection === 'groups') {
        renderGroupsBoard();
    }
}

/* ========================================================
   دالة بناء العنصر الموحد للمشترك
   ======================================================== */
function passengerItemHtml(p, badgeText) {
    const groupName = db.groups && p.groupId ? (db.groups.find(g => g.id === p.groupId)?.name || '') : '';
    const roomName = db.rooms && p.roomId ? (db.rooms.find(r => r.id === p.roomId)?.name || '') : '';
    const bedLbl = p.bedNumber ? `سرير ${p.bedNumber}` : '';
    const busLbl = p.busNumber ? `أتوبيس ${p.busNumber}` : '';
    const seatLbl = p.seatNumber ? `مقعد ${p.seatNumber}` : '';

    let details = [];
    if (groupName) details.push(`👥 ${groupName}`);
    if (busLbl) details.push(`🚍 ${busLbl} ${seatLbl ? `(م ${p.seatNumber})` : ''}`);
    if (roomName) details.push(`🛏️ ${roomName} ${bedLbl ? `(س ${p.bedNumber})` : ''}`);
    const detailsStr = details.join(' · ') || 'لا يوجد تخصيص';

    const dragAttr = currentSection === 'groups' ? `draggable="true" ondragstart="onDragStartParticipant(event, '${p.id}')"` : '';

    return `<div class="passenger-item" ${dragAttr} onclick="openEdit('${p.id}')">
        <div class="p-seat-badge">${badgeText}</div>
        <div class="p-info">
            <div class="p-name">${escapeHTML(p.name)}</div>
            <div class="p-details">${escapeHTML(detailsStr)}</div>
        </div>
        <div class="p-edit-btn" onclick="event.stopPropagation(); openEdit('${p.id}')" title="تعديل"><i class="bi bi-pencil"></i></div>
        <div class="p-delete-btn" onclick="event.stopPropagation(); deleteParticipant('${p.id}')" title="حذف"><i class="bi bi-trash3"></i></div>
    </div>`;
}

/* ========================================================
   المرحلة 2 — وحدة الأتوبيسات (Bus Grid & List)
   ======================================================== */
function getSeatLayout() {
    const rows = [];
    let seatNum = 1;

    for (let r = 0; r < 5; r++) {
        rows.push([
            { type: 'seat', seatNum: seatNum++ },
            { type: 'seat', seatNum: seatNum++ },
            { type: 'aisle', seatNum: null },
            { type: 'seat', seatNum: seatNum++ },
            { type: 'seat', seatNum: seatNum++ }
        ]);
    }

    rows.push([
        { type: 'door', seatNum: null },
        { type: 'door', seatNum: null },
        { type: 'aisle', seatNum: null },
        { type: 'seat', seatNum: seatNum++ },
        { type: 'seat', seatNum: seatNum++ }
    ]);

    rows.push([
        { type: 'empty', seatNum: null },
        { type: 'empty', seatNum: null },
        { type: 'aisle', seatNum: null },
        { type: 'seat', seatNum: seatNum++ },
        { type: 'seat', seatNum: seatNum++ }
    ]);

    for (let r = 0; r < 5; r++) {
        rows.push([
            { type: 'seat', seatNum: seatNum++ },
            { type: 'seat', seatNum: seatNum++ },
            { type: 'aisle', seatNum: null },
            { type: 'seat', seatNum: seatNum++ },
            { type: 'seat', seatNum: seatNum++ }
        ]);
    }

    rows.push([
        { type: 'seat', seatNum: seatNum++, backRow: true },
        { type: 'seat', seatNum: seatNum++, backRow: true },
        { type: 'seat', seatNum: seatNum++, backRow: true },
        { type: 'seat', seatNum: seatNum++, backRow: true },
        { type: 'seat', seatNum: seatNum++, backRow: true }
    ]);

    return rows;
}

function renderBusSubTabs() {
    if (!db || !db.buses) return;
    
    if (db.buses.length > 0) {
        if (!db.buses.some(b => b.busNumber === currentBus)) {
            currentBus = db.buses[0].busNumber;
        }
    }

    let html = '';
    db.buses.forEach(b => {
        const activeCls = b.busNumber === currentBus ? 'active' : '';
        html += `<div class="bus-tab ${activeCls}" data-bus="${b.busNumber}" onclick="switchBus(${b.busNumber})">🚍 أتوبيس ${b.busNumber}</div>`;
    });
    $('#busSubTabs').html(html);
}

function switchBus(busNum) {
    currentBus = busNum;
    $('#busSubTabs .bus-tab').removeClass('active');
    $(`#busSubTabs .bus-tab[data-bus="${busNum}"]`).addClass('active');
    renderSeatsGrid();
    renderPassengerList();
}

function renderSeatsGrid() {
    if (!db) return;
    const layout = getSeatLayout();
    const busPassengers = db.participants.filter(p => p.busNumber === currentBus);
    let html = `<div class="bus-section-title">🚍 أتوبيس ${currentBus}</div>`;
    html += '<div class="seats-grid">';

    for (const row of layout) {
        for (const cell of row) {
            if (cell.type === 'seat') {
                const passenger = busPassengers.find(p => p.seatNumber === cell.seatNum);
                const isBooked = !!passenger;
                const name = isBooked ? passenger.name : 'فاضي';
                const cls = isBooked ? 'booked' : 'empty';
                const backCls = cell.backRow ? ' back-row-cell' : '';
                html += `<div class="seat-cell ${cls}${backCls}" onclick="openBusSeatClick(${currentBus}, ${cell.seatNum})" title="${isBooked ? escapeHTML(passenger.name) : 'مقعد فاضي - ' + cell.seatNum}">
                    <span class="seat-number">${cell.seatNum}</span>
                    <span class="seat-name">${escapeHTML(name)}</span>
                </div>`;
            } else if (cell.type === 'aisle') {
                html += '<div class="aisle-cell"></div>';
            } else if (cell.type === 'door') {
                if (cell === row[0]) {
                    html += '<div class="door-cell">🪜🚪 سلم</div>';
                }
            } else if (cell.type === 'empty') {
                html += '<div class="seat-cell empty" style="opacity:0.3;cursor:default;border-style:dashed;"></div>';
            }
        }
    }

    html += '</div>';
    $('#seatsContainer').html(html);
}

function renderPassengerList() {
    if (!db) return;
    const searchTerm = $('#searchInput').val().trim().toLowerCase();
    let filtered = db.participants.filter(p => p.busNumber === currentBus);

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => a.seatNumber - b.seatNumber);

    let html = '';
    if (filtered.length === 0) {
        html = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:0.9rem;">لا يوجد ركاب' + (searchTerm ? ' مطابقين للبحث' : ' في هذا الأتوبيس') + '</div>';
    } else {
        for (const p of filtered) {
            html += passengerItemHtml(p, p.seatNumber);
        }
    }

    $('#passengerList').html(html);
    $('#listCount').text(filtered.length + ' راكب');
}

function openBusSeatClick(busNum, seatNum) {
    const p = db.participants.find(x => x.busNumber === busNum && x.seatNumber === seatNum);
    if (p) {
        openEdit(p.id);
    } else {
        openBusAdd(busNum, seatNum);
    }
}

function openBusAdd(busNum, seatNum) {
    openAddModal();
    $('#addBus').val(busNum.toString());
    $('#addSeat').val(seatNum);
    validateAddAssignment();
}

/* ========================================================
   المرحلة 3 — وحدة الغرف والتسكين (Rooms Module)
   ======================================================== */
function switchGender(gender) {
    currentGender = gender;
    $('#genderTabs .bus-tab').removeClass('active');
    $(`#genderTabs .bus-tab[data-gender="${gender}"]`).addClass('active');

    currentFloor = null;

    renderFloorTabs();
    renderRoomsGrid();
    renderRoomsPassengerList();
}

function switchFloor(floor) {
    currentFloor = floor;
    $('#floorTabs .bus-tab').removeClass('active');
    $(`#floorTabs .bus-tab[data-floor="${floor}"]`).addClass('active');

    renderRoomsGrid();
    renderRoomsPassengerList();
}

function renderFloorTabs() {
    if (!db || !db.rooms) return;

    const genderRooms = db.rooms.filter(r => r.gender === currentGender);
    const floors = [...new Set(genderRooms.map(r => r.floor))].sort((a, b) => a - b);

    if (floors.length > 0) {
        if (currentFloor === null || !floors.includes(currentFloor)) {
            currentFloor = floors[0];
        }
    } else {
        currentFloor = null;
    }

    let html = '';
    floors.forEach(f => {
        const activeCls = f === currentFloor ? 'active' : '';
        html += `<div class="bus-tab ${activeCls}" data-floor="${f}" onclick="switchFloor(${f})">🏢 الدور ${f}</div>`;
    });
    $('#floorTabs').html(html);
}

function renderRoomsGrid() {
    if (!db || !db.rooms) return;
    const rooms = db.rooms.filter(r => r.gender === currentGender && r.floor === currentFloor);
    let html = '';

    if (rooms.length === 0) {
        html = '<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;">لا توجد غرف في هذا الدور</div>';
        $('#roomsContainer').html(html);
        return;
    }

    rooms.forEach(room => {
        const residents = db.participants.filter(p => p.roomId === room.id);
        const bookedCount = residents.length;

        let bedsHtml = '';
        for (let b = 1; b <= room.capacity; b++) {
            const resident = residents.find(p => p.bedNumber === b);
            if (resident) {
                bedsHtml += `<div class="bed-cell booked" onclick="openBedEdit('${room.id}', ${b})" title="محجوز لـ ${escapeHTML(resident.name)}">
                    <span class="bed-number">${b}</span>
                    <span class="bed-name">${escapeHTML(resident.name)}</span>
                </div>`;
            } else {
                bedsHtml += `<div class="bed-cell empty" onclick="openBedEdit('${room.id}', ${b})" title="سرير فاضي">
                    <span class="bed-number">${b}</span>
                    <span class="bed-name">سرير ${b}</span>
                </div>`;
            }
        }

        html += `<div class="room-card">
            <div class="room-card-title">
                <span>🔑 ${escapeHTML(room.name)}</span>
                <span class="room-card-details">👥 ${bookedCount} / ${room.capacity}</span>
            </div>
            <div class="beds-grid">
                ${bedsHtml}
            </div>
        </div>`;
    });

    $('#roomsContainer').html(html);
}

function renderRoomsPassengerList() {
    if (!db || !db.rooms) return;
    const searchTerm = $('#searchInput').val().trim().toLowerCase();

    const roomIds = db.rooms.filter(r => r.gender === currentGender && r.floor === currentFloor).map(r => r.id);
    let filtered = db.participants.filter(p => p.roomId && roomIds.includes(p.roomId));

    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => {
        const roomA = db.rooms.find(r => r.id === a.roomId)?.name || '';
        const roomB = db.rooms.find(r => r.id === b.roomId)?.name || '';
        if (roomA !== roomB) return roomA.localeCompare(roomB);
        return a.bedNumber - b.bedNumber;
    });

    let html = '';
    if (filtered.length === 0) {
        html = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:0.9rem;">لا يوجد مقيمين' + (searchTerm ? ' مطابقين للبحث' : ' في هذا الدور') + '</div>';
    } else {
        filtered.forEach(p => {
            const roomName = db.rooms.find(r => r.id === p.roomId)?.name || '';
            const badge = roomName ? `${roomName.replace('غرفة ', '')}-${p.bedNumber}` : `${p.bedNumber}`;
            html += passengerItemHtml(p, badge);
        });
    }

    $('#roomsPassengerList').html(html);
    $('#roomsListCount').text(filtered.length + ' مقيم');
}

function openBedEdit(roomId, bedNum) {
    const resident = db.participants.find(p => p.roomId === roomId && p.bedNumber === bedNum);
    if (resident) {
        openEdit(resident.id);
    } else {
        openBedAdd(roomId, bedNum);
    }
}

function openBedAdd(roomId, bedNum) {
    openAddModal();
    $('#addRoom').val(roomId);
    $('#addBed').val(bedNum);
    validateAddAssignment();
}

/* ========================================================
   المرحلة 4 — وحدة المجموعات (Groups Board)
   ======================================================== */
function renderGroupsBoard() {
    if (!db || !db.groups) return;
    const searchTerm = $('#searchInput').val().trim().toLowerCase();
    const board = document.getElementById('groupsBoard');

    const groups = [...db.groups];
    groups.push({ id: 'none', name: '👥 غير محدد' });

    let html = '';
    groups.forEach(g => {
        let members = db.participants.filter(p => {
            if (g.id === 'none') return !p.groupId;
            return p.groupId === g.id;
        });

        if (searchTerm) {
            members = members.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        let membersHtml = members.map((p, idx) => passengerItemHtml(p, idx + 1)).join('');
        if (!membersHtml) {
            membersHtml = '<div style="text-align:center;color:var(--text-muted);font-size:.75rem;padding:20px 0;">لا يوجد أعضاء</div>';
        }

        html += `<div class="group-column" data-group="${g.id}" 
            ondragover="event.preventDefault(); this.classList.add('drag-over')" 
            ondragleave="this.classList.remove('drag-over')"
            ondrop="this.classList.remove('drag-over'); onDropInGroup(event, '${g.id}')">
            <div class="group-column-title" style="flex-direction: column; align-items: stretch; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <span style="font-weight: 800;">${escapeHTML(g.name)}</span>
                    <span class="count-badge">${members.length}</span>
                </div>
                ${g.id !== 'none' ? `
                <div class="group-score-control" style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; background: rgba(0,0,0,0.18); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
                    <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="bi bi-trophy text-warning me-1"></i> سكور التحدي:</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" class="group-score-input" min="0" max="100" value="${g.score || 0}" 
                            style="width: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fbbf24; border-radius: 6px; text-align: center; font-size: 0.78rem; padding: 1px 3px; font-weight: 800;"
                            onchange="updateGroupScore('${g.id}', this.value)">
                        <span style="font-size: 0.72rem; color: var(--text-muted);">%</span>
                    </div>
                </div>
                ` : ''}
            </div>
            ${g.id !== 'none' ? `<div class="group-column-add" onclick="openAddModalForGroup('${g.id}')"><i class="bi bi-plus-lg me-1"></i> إضافة للمجموعة</div>` : ''}
            <div class="group-members-list">
                ${membersHtml}
            </div>
        </div>`;
    });

    board.innerHTML = html;
}

function openAddModalForGroup(groupId) {
    openAddModal();
    $('#addGroup').val(groupId);
}

function updateGroupScore(groupId, scoreStr) {
    if (!db || !db.groups) return;
    const scoreVal = Math.min(100, Math.max(0, parseInt(scoreStr) || 0));
    const group = db.groups.find(g => g.id === groupId);
    if (group) {
        group.score = scoreVal;
        markUnsaved();
        saveToStorage();
        showToast(`تم تحديث سكور "${group.name}" إلى ${scoreVal}% 🎯`, 'success');
        
        // تحديث القيمة المعروضة للمدخل
        const inputs = document.querySelectorAll('.group-score-input');
        inputs.forEach(input => {
            if (input.getAttribute('onchange') && input.getAttribute('onchange').includes(groupId)) {
                input.value = scoreVal;
            }
        });
    }
}

/* drag & drop support */
function onDragStartParticipant(event, participantId) {
    event.dataTransfer.setData('text/plain', participantId);
}

function onDropInGroup(event, groupId) {
    event.preventDefault();
    const participantId = event.dataTransfer.getData('text/plain');
    if (!participantId) return;
    const p = db.participants.find(x => x.id === participantId);
    if (p) {
        const targetGroupId = groupId === 'none' ? null : groupId;
        if (p.groupId !== targetGroupId) {
            p.groupId = targetGroupId;
            markUnsaved();
            saveToStorage();
            renderGroupsBoard();
            showToast(`تم نقل "${p.name}" بنجاح ✅`, 'success');
        }
    }
}

/* ========================================================
   المرحلة 5 — نافذة التعديل الموحدة
   ======================================================== */
function openEdit(participantId) {
    editingParticipantId = participantId;
    const p = db.participants.find(x => x.id === participantId);
    if (!p) return;

    $('#editTitle').text('تعديل بيانات المشترك');
    $('#editSeatInfo').text(`معرف المشترك: ${p.id}`);
    $('#editName').val(p.name);
    $('#editGroup').val(p.groupId || 'none');
    $('#editBus').val(p.busNumber != null ? p.busNumber.toString() : 'none');
    $('#editSeat').val(p.seatNumber != null ? p.seatNumber : '');
    
    // الغرف والتسكين
    $('#editRoom').val(p.roomId || 'none');
    $('#editBed').val(p.bedNumber != null ? p.bedNumber : '');

    $('#editOverlay').addClass('show');

    if (currentSection === 'buses') {
        $('#clearBtn').html('<i class="bi bi-x-circle me-1"></i> إخلاء المقعد (إلغاء ركوب الأتوبيس)');
    } else if (currentSection === 'rooms') {
        $('#clearBtn').html('<i class="bi bi-x-circle me-1"></i> إخلاء السرير (إلغاء التسكين)');
    } else {
        $('#clearBtn').html('<i class="bi bi-x-circle me-1"></i> إزالة من المجموعة');
    }

    setTimeout(() => $('#editName').focus(), 300);
}

function closeEdit() {
    $('#editOverlay').removeClass('show');
}

function clearActiveTabAssignment() {
    if (!editingParticipantId) return;
    const p = db.participants.find(x => x.id === editingParticipantId);
    if (!p) return;

    if (currentSection === 'buses') {
        p.busNumber = null;
        p.seatNumber = null;
        showToast(`تم إخلاء الأتوبيس للمشترك "${p.name}" ✅`, 'info');
    } else if (currentSection === 'rooms') {
        p.roomId = null;
        p.bedNumber = null;
        showToast(`تم إخلاء السكن للمشترك "${p.name}" ✅`, 'info');
    } else if (currentSection === 'groups') {
        p.groupId = null;
        showToast(`تمت إزالة المشترك "${p.name}" من المجموعة ✅`, 'info');
    }

    markUnsaved();
    saveToStorage();
    closeEdit();
    refreshAll();
}

function saveEdit() {
    if (!editingParticipantId) return;
    const p = db.participants.find(x => x.id === editingParticipantId);
    if (!p) return;

    const name = $('#editName').val().trim();
    if (!name) {
        showToast('اكتب اسم المشترك!', 'error');
        return;
    }

    const groupId = $('#editGroup').val();
    const finalGroupId = groupId === 'none' ? null : groupId;

    const busVal = $('#editBus').val();
    const seatVal = $('#editSeat').val();
    let finalBus = busVal === 'none' ? null : parseInt(busVal);
    let finalSeat = seatVal ? parseInt(seatVal) : null;

    const roomVal = $('#editRoom').val();
    const bedVal = $('#editBed').val();
    let finalRoom = roomVal === 'none' ? null : roomVal;
    let finalBed = bedVal ? parseInt(bedVal) : null;

    // 1. التحقق من مقعد الأتوبيس
    if (finalBus !== null) {
        if (finalSeat === null || isNaN(finalSeat) || finalSeat < 1 || finalSeat > SEATS_PER_BUS) {
            showToast('رقم المقعد غير صحيح!', 'error');
            return;
        }
        const busConflict = db.participants.find(x => x.id !== p.id && x.busNumber === finalBus && x.seatNumber === finalSeat);
        if (busConflict) {
            showConfirm(
                'تعارض المقاعد',
                `المقعد ${finalSeat} في أتوبيس ${finalBus} محجوز للمشترك "${busConflict.name}". هل تريد مبادلة المقاعد بينهما؟`,
                function() {
                    busConflict.busNumber = p.busNumber;
                    busConflict.seatNumber = p.seatNumber;

                    p.name = name;
                    p.groupId = finalGroupId;
                    p.busNumber = finalBus;
                    p.seatNumber = finalSeat;
                    p.roomId = finalRoom;
                    p.bedNumber = finalBed;

                    completeSave(p);
                }
            );
            return;
        }
    } else {
        finalSeat = null;
    }

    // 2. التحقق من سرير الغرفة
    if (finalRoom !== null) {
        const room = db.rooms.find(r => r.id === finalRoom);
        const capacity = room ? room.capacity : 6;
        if (finalBed === null || isNaN(finalBed) || finalBed < 1 || finalBed > capacity) {
            showToast('رقم السرير غير صحيح!', 'error');
            return;
        }
        const roomConflict = db.participants.find(x => x.id !== p.id && x.roomId === finalRoom && x.bedNumber === finalBed);
        if (roomConflict) {
            showConfirm(
                'تعارض الأسرّة',
                `السرير ${finalBed} في غرفة ${room.name} محجوز للمشترك "${roomConflict.name}". هل تريد مبادلة الأسرّة بينهما؟`,
                function() {
                    roomConflict.roomId = p.roomId;
                    roomConflict.bedNumber = p.bedNumber;

                    p.name = name;
                    p.groupId = finalGroupId;
                    p.busNumber = finalBus;
                    p.seatNumber = finalSeat;
                    p.roomId = finalRoom;
                    p.bedNumber = finalBed;

                    completeSave(p);
                }
            );
            return;
        }
    } else {
        finalBed = null;
    }

    p.name = name;
    p.groupId = finalGroupId;
    p.busNumber = finalBus;
    p.seatNumber = finalSeat;
    p.roomId = finalRoom;
    p.bedNumber = finalBed;

    completeSave(p);
}

function completeSave(p) {
    markUnsaved();
    saveToStorage();
    closeEdit();
    refreshAll();
    showToast(`تم حفظ تعديلات "${p.name}" بنجاح ✅`, 'success');
}

/* ========================================================
   نافذة إضافة مشترك جديد
   ======================================================== */
function openAddModal() {
    $('#addName').val('');
    $('#addGroup').val('none');
    $('#addBus').val(currentSection === 'buses' ? currentBus.toString() : 'none');
    $('#addSeat').val('');
    $('#addRoom').val('none');
    $('#addBed').val('');
    $('#addStatus').text('');

    if (currentSection === 'rooms' && currentFloor && currentGender) {
        // Pre-fill active room if possible (optional layout aid)
    }

    $('#addOverlay').addClass('show');
    setTimeout(() => $('#addName').focus(), 300);
}

function closeAddModal() {
    $('#addOverlay').removeClass('show');
}

function validateAddAssignment() {
    if (!db) return;
    const busVal = $('#addBus').val();
    const seatVal = $('#addSeat').val();
    const roomVal = $('#addRoom').val();
    const bedVal = $('#addBed').val();

    let statusHtml = '';

    if (busVal !== 'none' && seatVal) {
        const bus = parseInt(busVal);
        const seat = parseInt(seatVal);
        const conflict = db.participants.find(x => x.busNumber === bus && x.seatNumber === seat);
        if (conflict) {
            statusHtml += `<div style="color:var(--danger);">⚠️ المقعد ${seat} في أتوبيس ${bus} محجوز لـ "${conflict.name}"</div>`;
        } else if (seat < 1 || seat > SEATS_PER_BUS) {
            statusHtml += `<div style="color:var(--danger);">⚠️ رقم مقعد غير صحيح</div>`;
        } else {
            statusHtml += `<div style="color:var(--seat-avail-light);">✅ المقعد ${seat} في أتوبيس ${bus} متاح</div>`;
        }
    }

    if (roomVal !== 'none' && bedVal) {
        const bed = parseInt(bedVal);
        const room = db.rooms.find(r => r.id === roomVal);
        const capacity = room ? room.capacity : 6;
        const conflict = db.participants.find(x => x.roomId === roomVal && x.bedNumber === bed);
        if (conflict) {
            statusHtml += `<div style="color:var(--danger);">⚠️ السرير ${bed} في غرفة ${room ? room.name : roomVal} محجوز لـ "${conflict.name}"</div>`;
        } else if (bed < 1 || bed > capacity) {
            statusHtml += `<div style="color:var(--danger);">⚠️ رقم سرير غير صحيح (السعة: ${capacity})</div>`;
        } else {
            statusHtml += `<div style="color:var(--seat-avail-light);">✅ السرير ${bed} في غرفة ${room ? room.name : roomVal} متاح</div>`;
        }
    }

    $('#addStatus').html(statusHtml);
}

$(document).on('input change', '#addBus, #addSeat, #addRoom, #addBed', validateAddAssignment);

function saveAddPassenger() {
    const name = $('#addName').val().trim();
    if (!name) {
        showToast('اكتب اسم المشترك!', 'error');
        return;
    }

    const groupId = $('#addGroup').val();
    const finalGroupId = groupId === 'none' ? null : groupId;

    const busVal = $('#addBus').val();
    const seatVal = $('#addSeat').val();
    let finalBus = busVal === 'none' ? null : parseInt(busVal);
    let finalSeat = seatVal ? parseInt(seatVal) : null;

    const roomVal = $('#addRoom').val();
    const bedVal = $('#addBed').val();
    let finalRoom = roomVal === 'none' ? null : roomVal;
    let finalBed = bedVal ? parseInt(bedVal) : null;

    // Validate bus seat conflict
    if (finalBus !== null) {
        if (finalSeat === null || isNaN(finalSeat) || finalSeat < 1 || finalSeat > SEATS_PER_BUS) {
            showToast('رقم المقعد غير صحيح!', 'error');
            return;
        }
        const busConflict = db.participants.find(x => x.busNumber === finalBus && x.seatNumber === finalSeat);
        if (busConflict) {
            showToast(`المقعد ${finalSeat} محجوز للمشترك "${busConflict.name}"`, 'warning');
            return;
        }
    }

    // Validate room bed conflict
    if (finalRoom !== null) {
        const room = db.rooms.find(r => r.id === finalRoom);
        const capacity = room ? room.capacity : 6;
        if (finalBed === null || isNaN(finalBed) || finalBed < 1 || finalBed > capacity) {
            showToast('رقم السرير غير صحيح!', 'error');
            return;
        }
        const roomConflict = db.participants.find(x => x.roomId === finalRoom && x.bedNumber === finalBed);
        if (roomConflict) {
            showToast(`السرير ${finalBed} محجوز للمشترك "${roomConflict.name}"`, 'warning');
            return;
        }
    }

    const newId = 'p' + Date.now();
    const newParticipant = {
        id: newId,
        name: name,
        groupId: finalGroupId,
        roomId: finalRoom,
        bedNumber: finalBed,
        busNumber: finalBus,
        seatNumber: finalSeat
    };

    db.participants.push(newParticipant);
    markUnsaved();
    saveToStorage();
    closeAddModal();
    refreshAll();
    showToast(`تم إضافة المشترك "${name}" بنجاح ✅`, 'success');
}

/* ========================================================
   منطق حذف مشترك
   ======================================================== */
function deleteParticipant(id) {
    const p = db.participants.find(x => x.id === id);
    if (!p) return;

    showConfirm(
        'حذف مشترك',
        `هل تريد حذف المشترك "${escapeHTML(p.name)}" نهائياً من قاعدة البيانات؟`,
        function() {
            const idx = db.participants.findIndex(x => x.id === id);
            if (idx !== -1) {
                db.participants.splice(idx, 1);
                markUnsaved();
                saveToStorage();
                refreshAll();
                showToast(`تم حذف المشترك "${p.name}" ✅`, 'info');
            }
        }
    );
}

/* ========================================================
   تصدير واستيراد وتهيئة البيانات
   ======================================================== */
function exportJSONBackup() {
    if (!db) return;
    const jsonStr = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conference-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    hasUnsavedChanges = false;
    hasExported = true;
    updateSaveIndicator();
    showToast('تم تصدير conference-data.json بنجاح ✅', 'success');
}

function confirmClearAll() {
    showConfirm(
        'تهيئة قاعدة البيانات',
        'هل تريد مسح جميع المشتركين تماماً؟<br>هذا الإجراء لا يمكن التراجع عنه!',
        function() {
            db.participants = [];
            markUnsaved();
            saveToStorage();
            refreshAll();
            showToast('تم مسح جميع المشتركين بنجاح ✅', 'info');
        }
    );
}

function toggleImport() {
    const $section = $('#importSection');
    $section.toggle();
    if ($section.is(':visible')) {
        $('html, body').animate({ scrollTop: $section.offset().top - 60 }, 400);
    }
}

function importData(mode) {
    const raw = $('#importArea').val().trim();
    if (!raw) { showToast('الصق البيانات أولاً!', 'warning'); return; }

    try {
        let newData = JSON.parse(raw);
        if (!newData.participants || !Array.isArray(newData.participants)) {
            throw new Error('البيانات يجب أن تحتوي على مصفوفة المشتركين (participants)');
        }

        db = newData;
        populateDropdowns();
        markUnsaved();
        saveToStorage();
        refreshAll();
        $('#importArea').val('');
        $('#importSection').hide();
        showToast('تم استيراد البيانات بنجاح ✅', 'success');
    } catch (e) {
        showToast('خطأ في صيغة الملف: ' + e.message, 'error');
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    processFile(file);
    event.target.value = '';
}

function processFile(file) {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showToast('الملف لازم يكون بصيغة JSON!', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let parsed = JSON.parse(content);

            if (!parsed.participants || !Array.isArray(parsed.participants)) {
                throw new Error('الملف لا يحتوي على مصفوفة المشتركين (participants)');
            }

            db = parsed;
            populateDropdowns();
            markUnsaved();
            saveToStorage();
            refreshAll();
            showToast('تم استيراد البيانات من الملف بنجاح ✅', 'success');
        } catch (err) {
            showToast('خطأ في الملف: ' + err.message, 'error');
        }
    };
    reader.onerror = function() {
        showToast('حدث خطأ أثناء قراءة الملف!', 'error');
    };
    reader.readAsText(file);
}

function initDragDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
}

function filterPassengers() {
    if (currentSection === 'buses') {
        renderPassengerList();
    } else if (currentSection === 'rooms') {
        renderRoomsPassengerList();
    } else if (currentSection === 'groups') {
        renderGroupsBoard();
    }
}

/* ========================================================
   تهيئة الصفحة
   ======================================================== */
$(document).ready(async function() {
    try {
        // دائماً نقوم بجلب البيانات الموحدة والمدمجة بمسودة المشتركين من DataService
        db = await DataService.loadConference();
        
        populateDropdowns();
        renderStatsBar();
        refreshAll();
        initDragDrop();
        updateSaveIndicator();
    } catch (e) {
        console.error('Failed to load conference-data: ', e);
        showToast('تعذر تحميل البيانات من الملف المساعد. الرجاء استيراد ملف JSON يدوياً.', 'error');
        toggleImport();
    }

    $('.edit-overlay, .add-overlay, .confirm-overlay').on('click', function(e) {
        if (e.target === this) {
            $(this).removeClass('show');
        }
    });

    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.edit-overlay, .add-overlay, .confirm-overlay').removeClass('show');
        }
    });

    $('#addName').on('keypress', function(e) {
        if (e.which === 13) saveAddPassenger();
    });
    $('#editName').on('keypress', function(e) {
        if (e.which === 13) saveEdit();
    });

    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});
