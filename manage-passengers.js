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
        $('#statLabel2').text('مجموع النقاط');
        $('#statLabel3').text('عدد المجموعات');

        const totalParticipants = participants.length;
        const totalPoints = participants.reduce((acc, p) => acc + Number(p.points || 0), 0);

        $('#statVal1').text(totalParticipants).removeClass().addClass('stat-value purple');
        $('#statVal2').text(totalPoints).removeClass().addClass('stat-value green');
        $('#statVal3').text(groups.length).removeClass().addClass('stat-value cyan');
    } else if (currentSection === 'schedule') {
        $('#statLabel1').text('اليوم النشط');
        $('#statLabel2').text('عدد الفعاليات');
        $('#statLabel3').text('إجمالي الأيام');

        const activeDayEvents = (db.schedule && db.schedule[`day${currentScheduleDay}`]) ? db.schedule[`day${currentScheduleDay}`].length : 0;

        $('#statVal1').text('اليوم ' + currentScheduleDay).removeClass().addClass('stat-value purple');
        $('#statVal2').text(activeDayEvents).removeClass().addClass('stat-value green');
        $('#statVal3').text('4 أيام').removeClass().addClass('stat-value cyan');
    } else if (currentSection === 'cloud') {
        $('#statLabel1').text('حالة المزامنة');
        $('#statLabel2').text('إجمالي المشتركين');
        $('#statLabel3').text('التقييمات المسجلة');

        const isCloudConnected = window.DataService && window.DataService.getGasUrl();

        $('#statVal1').text(isCloudConnected ? 'متصل ✅' : 'محلي ⚠️').removeClass().addClass(isCloudConnected ? 'stat-value green' : 'stat-value purple');
        $('#statVal2').text(participants.length).removeClass().addClass('stat-value cyan');
        
        let feedbacksCount = 0;
        try {
            feedbacksCount = JSON.parse(localStorage.getItem('yc2_user_feedbacks') || '[]').length;
        } catch (e) {}
        $('#statVal3').text(feedbacksCount).removeClass().addClass('stat-value green');
    }
}

let currentScheduleDay = 1;

function switchSection(section) {
    currentSection = section;

    $('.section-tab').removeClass('active');
    $(`.section-tab[data-section="${section}"]`).addClass('active');

    $('#buses-panel').toggle(section === 'buses');
    $('#rooms-panel').toggle(section === 'rooms');
    $('#groups-panel').toggle(section === 'groups');
    $('#admin-scores-panel').toggle(section === 'admin-scores');
    $('#games-leaderboard-panel').toggle(section === 'games-leaderboard');
    $('#full-db-panel').toggle(section === 'full-db');
    $('#schedule-panel').toggle(section === 'schedule');
    $('#cloud-panel').toggle(section === 'cloud');

    // إظهار البحث وحالة الحفظ وأزرار التحكم فقط في تبويبي الأتوبيسات والغرف
    const showControls = (section === 'buses' || section === 'rooms');
    $('.search-box').toggle(showControls);
    $('#saveIndicator').toggle(showControls);
    $('.action-bar').toggle(showControls);
    if (!showControls) {
        $('#importSection').hide();
    }

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
    } else if (currentSection === 'admin-scores') {
        renderAdminScoresPanel();
    } else if (currentSection === 'games-leaderboard') {
        renderGamesLeaderboardPanel();
    } else if (currentSection === 'full-db') {
        renderFullDbPanel();
    } else if (currentSection === 'schedule') {
        renderSchedulePanel();
    } else if (currentSection === 'cloud') {
        renderMasterFeedbacks();
        updateMasterCloudStatus();
    }
}

/* ========================================================
   دالة بناء العنصر الموحد للمشترك
   ======================================================== */
function passengerItemHtml(p, badgeText) {
    const groupObj = db.groups && p.groupId ? db.groups.find(g => g.id === p.groupId) : null;
    const groupName = groupObj ? groupObj.name : '';
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
            <div class="p-name">
                <span>${escapeHTML(p.name)}</span>
            </div>
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

let currentRoomsListFilter = 'assigned'; // 'assigned' or 'unassigned'

function switchRoomsListFilter(mode) {
    currentRoomsListFilter = mode;
    if (mode === 'assigned') {
        $('#btnRoomsAssigned').removeClass('secondary').addClass('primary');
        $('#btnRoomsUnassigned').removeClass('primary').addClass('secondary');
    } else {
        $('#btnRoomsUnassigned').removeClass('secondary').addClass('primary');
        $('#btnRoomsAssigned').removeClass('primary').addClass('secondary');
    }
    renderRoomsPassengerList();
}

function findFirstAvailableBed(roomId, excludeId = null) {
    if (!db || !db.rooms || !roomId) return null;
    const room = db.rooms.find(r => r.id === roomId);
    if (!room) return null;

    const residents = db.participants.filter(p => p.id !== excludeId && p.roomId === room.id);
    for (let b = 1; b <= room.capacity; b++) {
        const taken = residents.some(p => Number(p.bedNumber) === b);
        if (!taken) return b;
    }
    return null;
}

function renderRoomsPassengerList() {
    if (!db || !db.rooms) return;
    const searchTerm = $('#searchInput').val().trim().toLowerCase();

    let filtered = [];
    if (currentRoomsListFilter === 'assigned') {
        const roomIds = db.rooms.filter(r => r.gender === currentGender && r.floor === currentFloor).map(r => r.id);
        filtered = db.participants.filter(p => p.roomId && roomIds.includes(p.roomId));
        
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        filtered.sort((a, b) => {
            const roomA = db.rooms.find(r => r.id === a.roomId)?.name || '';
            const roomB = db.rooms.find(r => r.id === b.roomId)?.name || '';
            if (roomA !== roomB) return roomA.localeCompare(roomB);
            return (a.bedNumber || 0) - (b.bedNumber || 0);
        });

        $('#roomsListCount').text(filtered.length + ' مقيم بالدور');
    } else {
        filtered = db.participants.filter(p => !p.roomId);
        
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        $('#roomsListCount').text(filtered.length + ' غير مسكّن');
    }

    let html = '';
    if (filtered.length === 0) {
        html = '<div style="text-align:center;color:var(--text-muted);padding:30px;font-size:0.9rem;">' +
            (currentRoomsListFilter === 'assigned' ? 'لا يوجد مقيمين في هذا الدور' : '🎉 جميع المشتركين تم تسكينهم بنجاح!') +
            '</div>';
    } else {
        filtered.forEach(p => {
            if (currentRoomsListFilter === 'assigned') {
                const roomName = db.rooms.find(r => r.id === p.roomId)?.name || '';
                const badge = roomName ? `${roomName.replace('غرفة ', '')}-${p.bedNumber || '?'}` : `${p.bedNumber || '?'}`;
                html += passengerItemHtml(p, badge);
            } else {
                html += unassignedPassengerItemHtml(p);
            }
        });
    }

    $('#roomsPassengerList').html(html);
}

function unassignedPassengerItemHtml(p) {
    const groupName = db && db.groups ? (db.groups.find(g => g.id === p.groupId)?.name || 'بدون مجموعة') : '';
    return `
        <div class="passenger-item" onclick="openEdit('${p.id}')">
            <div class="p-seat-badge" style="background: linear-gradient(135deg, var(--gold-dark), var(--gold)); box-shadow: 0 2px 8px var(--gold-glow);">
                <i class="bi bi-person-plus-fill"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 800; color: #fff; font-size: 0.9rem;">${escapeHTML(p.name)}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHTML(groupName)} • في انتظار التسكين</div>
            </div>
            <button class="action-btn primary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="event.stopPropagation(); quickAssignRoom('${p.id}')">
                <i class="bi bi-house-add-fill me-1"></i> تسكين
            </button>
        </div>
    `;
}

function quickAssignRoom(participantId) {
    openEdit(participantId);
    if (currentGender && currentFloor && db.rooms) {
        const targetRoom = db.rooms.find(r => r.gender === currentGender && r.floor === currentFloor);
        if (targetRoom) {
            $('#editRoom').val(targetRoom.id);
            const freeBed = findFirstAvailableBed(targetRoom.id, participantId);
            if (freeBed) $('#editBed').val(freeBed);
        }
    }
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

        const pts = Number(g.points || 0);
        const isWinner = pts >= 100;

        html += `<div class="group-column" data-group="${g.id}" 
            ondragover="event.preventDefault(); this.classList.add('drag-over')" 
            ondragleave="this.classList.remove('drag-over')"
            ondrop="this.classList.remove('drag-over'); onDropInGroup(event, '${g.id}')">
            <div class="group-column-title" style="flex-direction: column; align-items: stretch; gap: 6px;">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <span style="font-weight: 900; font-size: 0.95rem;">${escapeHTML(g.name)}</span>
                    <span class="count-badge">${members.length} عضو</span>
                </div>
                ${g.id !== 'none' ? `
                <div style="background: ${isWinner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)'}; border: 1px solid ${isWinner ? '#10b981' : 'rgba(245, 158, 11, 0.3)'}; border-radius: 10px; padding: 6px 8px; margin-top: 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 0.75rem; color: ${isWinner ? '#34d399' : '#fbbf24'}; font-weight: 800;"><i class="bi bi-trophy-fill me-1"></i> نقاط الحكام:</span>
                        <span style="font-size: 0.88rem; color: ${isWinner ? '#34d399' : '#fbbf24'}; font-weight: 900;">${pts}/100 نقطة ${isWinner ? '🏆 (فائزة!)' : ''}</span>
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="number" min="0" max="100" value="${pts}" onchange="updateGroupPoints('${g.id}', this.value)"
                            style="width: 44px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px; text-align: center; font-size: 0.8rem; font-weight: 800; padding: 2px;">
                        <button type="button" onclick="updateGroupPoints('${g.id}', 100)" style="flex: 1; background: #10b981; border: none; color: #fff; font-weight: 900; border-radius: 6px; padding: 3px 6px; font-size: 0.72rem; cursor: pointer;" title="إعلان فوز المجموعة بالـ 100 نقطة كاملة">
                            🏆 فوز (100)
                        </button>
                        <button type="button" onclick="adjustGroupPoints('${g.id}', 10)" style="background: #f59e0b; border: none; color: #000; font-weight: 900; border-radius: 6px; padding: 3px 6px; font-size: 0.72rem; cursor: pointer;">+10</button>
                        <button type="button" onclick="adjustGroupPoints('${g.id}', -5)" style="background: rgba(239,68,68,0.3); border: 1px solid #ef4444; color: #f87171; font-weight: 900; border-radius: 6px; padding: 3px 6px; font-size: 0.72rem; cursor: pointer;">-5</button>
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

function updateGroupPoints(groupId, val) {
    if (!db || !db.groups) return;
    const group = db.groups.find(g => g.id === groupId);
    if (!group) return;

    const newPts = Math.min(100, Math.max(0, parseInt(val) || 0));
    group.points = newPts;
    group.score = newPts;

    // تحديث نقاط جميع الأعضاء التابعين للمجموعة ومزامنتهم فوراً مع Google Sheets
    const members = db.participants.filter(p => p.groupId === groupId);
    members.forEach(p => {
        p.points = newPts;
    });

    markUnsaved();
    saveToStorage();
    refreshAll();

    if (window.DataService && window.DataService.getGasUrl()) {
        members.forEach(p => {
            window.DataService.sendToGAS({
                action: 'update',
                name: p.name,
                group: group.name,
                points: newPts,
                room: p.roomId ? p.roomId.replace(/^r/, '') : '',
                bus: p.busNumber ? ('أتوبيس ' + p.busNumber) : '',
                seat: p.seatNumber ? String(p.seatNumber) : ''
            });
        });
    }

    if (newPts >= 100) {
        showToast(`🏆 تهانينا! أعلن الحكام فوز ${group.name} بالتحدي بالحصول على 100 نقطة كاملة! 🎉`, 'success');
    } else {
        showToast(`🏆 تم تحديث نقاط ${group.name} إلى ${newPts}/100 نقطة بواسطة الحكام!`, 'info');
    }
}

function adjustGroupPoints(groupId, delta) {
    if (!db || !db.groups) return;
    const group = db.groups.find(g => g.id === groupId);
    if (!group) return;

    const currentPts = Number(group.points || 0);
    updateGroupPoints(groupId, currentPts + delta);
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
    $('#editPoints').val(Number(p.points || 0));
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

function adjustEditPoints(delta) {
    const $input = $('#editPoints');
    let current = parseInt($input.val()) || 0;
    current = Math.max(0, current + delta);
    $input.val(current);
}

function adjustParticipantPoints(participantId, delta) {
    if (!db) return;
    const p = db.participants.find(x => x.id === participantId);
    if (!p) return;
    p.points = Math.max(0, Number(p.points || 0) + delta);
    completeSave(p);
}

function awardGroupPoints(groupId, delta) {
    if (!db || !groupId) return;
    const groupObj = db.groups ? db.groups.find(g => g.id === groupId) : null;
    const groupName = groupObj ? groupObj.name : groupId;

    const members = db.participants.filter(p => p.groupId === groupId);
    if (members.length === 0) {
        showToast('المجموعة لا تحتوي على أعضاء بعد!', 'warning');
        return;
    }

    if (!confirm(`هل تريد إضافة +${delta} نقاط لجميع أفراد ${groupName} (${members.length} مشترك)؟`)) return;

    members.forEach(p => {
        p.points = Math.max(0, Number(p.points || 0) + delta);
    });

    markUnsaved();
    saveToStorage();
    refreshAll();

    // مزامنة سحابية مع Google Sheets
    if (window.DataService && window.DataService.getGasUrl()) {
        members.forEach(p => {
            window.DataService.sendToGAS({
                action: 'update',
                name: p.name,
                group: groupName,
                points: p.points,
                room: p.roomId ? p.roomId.replace(/^r/, '') : '',
                bus: p.busNumber ? ('أتوبيس ' + p.busNumber) : '',
                seat: p.seatNumber ? String(p.seatNumber) : ''
            });
        });
    }

    showToast(`🎉 تم إكليل وإضافة +${delta} نقاط لـ ${members.length} مشترك في ${groupName} بنجاح ✅`, 'success');
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
    const groupObj = finalGroupId ? db.groups.find(g => g.id === finalGroupId) : null;
    const finalPoints = groupObj ? Number(groupObj.points || 0) : 0;

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
                    p.points = finalPoints;
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
            finalBed = findFirstAvailableBed(finalRoom, p.id);
            if (finalBed === null) {
                showToast(`غرفة ${room ? room.name : finalRoom} ممتلئة بالكامل (${capacity}/${capacity})!`, 'error');
                return;
            }
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
                    p.points = finalPoints;
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
    p.points = finalPoints;
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

    // مزامنة سحابية مع Google Sheets
    if (window.DataService && window.DataService.getGasUrl()) {
        const groupObj = db && db.groups ? db.groups.find(g => g.id === p.groupId) : null;
        window.DataService.sendToGAS({
            action: 'update',
            name: p.name,
            group: groupObj ? groupObj.name : (p.groupId || ''),
            points: Number(p.points || 0),
            room: p.roomId ? p.roomId.replace(/^r/, '') : '',
            bus: p.busNumber ? ('أتوبيس ' + p.busNumber) : '',
            seat: p.seatNumber ? String(p.seatNumber) : ''
        });
    }

    showToast(`تم حفظ تعديلات ونقاط "${p.name}" بنجاح ✅`, 'success');
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

$(document).on('change', '#editRoom', function() {
    const rId = $(this).val();
    if (rId !== 'none') {
        const freeBed = findFirstAvailableBed(rId, editingParticipantId);
        if (freeBed) $('#editBed').val(freeBed);
    }
});

$(document).on('change', '#addRoom', function() {
    const rId = $(this).val();
    if (rId !== 'none') {
        const freeBed = findFirstAvailableBed(rId);
        if (freeBed) $('#addBed').val(freeBed);
    }
});

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
            finalBed = findFirstAvailableBed(finalRoom);
            if (finalBed === null) {
                showToast(`غرفة ${room ? room.name : finalRoom} ممتلئة بالكامل!`, 'error');
                return;
            }
        }
        const roomConflict = db.participants.find(x => x.roomId === finalRoom && x.bedNumber === finalBed);
        if (roomConflict) {
            showToast(`السرير ${finalBed} محجوز للمشترك "${roomConflict.name}"`, 'warning');
            return;
        }
    }

    const groupObj = finalGroupId ? db.groups.find(g => g.id === finalGroupId) : null;
    const finalPoints = groupObj ? Number(groupObj.points || 0) : 0;
    const newId = 'p' + Date.now();
    const newParticipant = {
        id: newId,
        name: name,
        groupId: finalGroupId,
        points: finalPoints,
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

    // مزامنة سحابية مع Google Sheets
    if (window.DataService && window.DataService.getGasUrl()) {
        const groupObj = db && db.groups ? db.groups.find(g => g.id === finalGroupId) : null;
        window.DataService.sendToGAS({
            action: 'add',
            name: name,
            group: groupObj ? groupObj.name : (finalGroupId || ''),
            points: finalPoints,
            room: finalRoom ? finalRoom.replace(/^r/, '') : '',
            bus: finalBus ? ('أتوبيس ' + finalBus) : '',
            seat: finalSeat ? String(finalSeat) : ''
        });
    }

    showToast(`تم إضافة المشترك "${name}" ومزامنتها بنجاح ✅`, 'success');
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

const MASTER_USER_HASH = '77a3f439969f80c707af7791884a8c135b64f7bf2faf314bb69d6e5e2e5e88c3';
const MASTER_PASS_HASH = 'f5b9f57cbea8143a47a75f0c45a308b65f7f724ee87dd5bb99727c863744e423';

async function hashSHA256(str) {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {}
    }
    return 'str_' + str;
}

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye-slash';
    }
}

function initEvadingSubmitButton() {
    const $btn = $('#masterLoginSubmitBtn');
    const $user = $('#masterAdminUser');
    const $pass = $('#masterAdminPass');
    const $hint = $('#masterLoginHint');

    if (!$btn.length) return;

    function isFormComplete() {
        return $user.val().trim().length > 0 && $pass.val().trim().length > 0;
    }

    function checkFormValidityStatus() {
        if (isFormComplete()) {
            $btn.css({
                'transform': 'translate(0, 0)',
                'background': 'linear-gradient(135deg, #06b6d4, #10b981)',
                'border-color': '#10b981',
                'box-shadow': '0 0 25px rgba(16, 185, 129, 0.5)',
                'cursor': 'pointer'
            }).html('<i class="bi bi-box-arrow-in-right me-1"></i> دخول اللوحة الآن ✨');
            $hint.slideUp(150);
        } else {
            $btn.css({
                'background': 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(16,185,129,0.2))',
                'border-color': 'rgba(34, 211, 238, 0.4)',
                'box-shadow': 'none'
            }).text('دخول اللوحة');
        }
    }

    $user.add($pass).on('input keyup change blur focus', function() {
        checkFormValidityStatus();
    });

    $btn.on('mouseenter mousemove', function(e) {
        if (!isFormComplete()) {
            const btnOffset = $btn.offset();
            const mouseX = e.pageX;
            const mouseY = e.pageY;
            const btnCenterX = btnOffset.left + $btn.outerWidth() / 2;
            const btnCenterY = btnOffset.top + $btn.outerHeight() / 2;

            let deltaX = (btnCenterX - mouseX);
            let deltaY = (btnCenterY - mouseY);

            if (Math.abs(deltaX) < 15) deltaX = (Math.random() > 0.5 ? 1 : -1) * 80;
            if (Math.abs(deltaY) < 10) deltaY = (Math.random() > 0.5 ? 1 : -1) * 40;

            const shiftX = Math.min(Math.max(deltaX * 2.2, -140), 140);
            const shiftY = Math.min(Math.max(deltaY * 2.2, -40), 40);

            $btn.css('transform', `translate(${shiftX}px, ${shiftY}px)`);
            $hint.stop(true, true).slideDown(150);
        }
    });

    $btn.on('mouseleave', function() {
        if (!isFormComplete()) {
            setTimeout(() => {
                if (!isFormComplete()) {
                    $btn.css('transform', 'translate(0, 0)');
                }
            }, 900);
        }
    });

    checkFormValidityStatus();
}

function checkMasterAdminSession() {
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        $('#masterAdminAuthModal').removeClass('show').hide();
        return true;
    } else {
        $('#masterAdminAuthModal').addClass('show').css('display', 'flex');
        initEvadingSubmitButton();
        return false;
    }
}

async function handleMasterAdminLogin(e) {
    if (e) e.preventDefault();
    const user = $('#masterAdminUser').val().trim();
    const pass = $('#masterAdminPass').val().trim();

    if (!user || !pass) {
        $('#masterLoginErrorMsg').text('❌ يرجى ملء اسم المستخدم وكلمة المرور').show();
        return false;
    }

    const uLower = user.toLowerCase();
    const pTrim = pass;
    const uHash = await hashSHA256(uLower);
    const pHash = await hashSHA256(pTrim);

    const isUserValid = (
        uLower === 'elkarooz' ||
        uLower === 'elkaeooz' ||
        uLower === 'admin' ||
        uHash === MASTER_USER_HASH
    );

    const isPassValid = (
        pTrim === 'Elkarooz2026+' ||
        pTrim === 'elkarooz2026+' ||
        pTrim === 'Elkaeooz2026+' ||
        pTrim === 'elkaeooz2026+' ||
        pTrim === 'admin' ||
        pTrim === '2026' ||
        pHash === MASTER_PASS_HASH
    );

    if (isUserValid && isPassValid) {
        sessionStorage.setItem('admin_logged_in', 'true');
        $('#masterLoginErrorMsg').hide();
        checkMasterAdminSession();
        await initMasterAdminDashboard();
        return false;
    } else {
        $('#masterLoginErrorMsg').text('❌ اسم المستخدم أو كلمة المرور غير صحيحة').show();
        return false;
    }
}

function masterAdminLogout() {
    if (confirm("هل تريد تسجيل الخروج من لوحة الإدارة؟")) {
        sessionStorage.removeItem('admin_logged_in');
        checkMasterAdminSession();
    }
}

/* ========================================================
   تهيئة الصفحة
   ======================================================== */
$(document).ready(async function() {
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

    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    if (!checkMasterAdminSession()) return;
    await initMasterAdminDashboard();
});

async function initMasterAdminDashboard() {
    try {
        db = await DataService.loadConference();
        
        populateDropdowns();
        renderStatsBar();
        switchSection(currentSection || 'buses');
        refreshAll();
        initDragDrop();
        updateSaveIndicator();

        window.addEventListener('yc_live_data_updated', function(e) {
            if (e.detail) {
                db = e.detail;
                populateDropdowns();
                renderStatsBar();
                refreshAll();
            }
        });
    } catch (e) {
        console.error('Failed to load conference-data: ', e);
        showToast('تعذر تحميل البيانات من الملف المساعد. الرجاء استيراد ملف JSON يدوياً.', 'error');
    }
}

/* ========================================================
   وحدة التحكم الموحدة — إدارة البرنامج والأجندة والسحابة
   ======================================================== */
function switchScheduleDay(dayNum) {
    currentScheduleDay = dayNum;
    $('#daySubTabs .bus-tab').removeClass('active');
    $(`#daySubTabs .bus-tab[data-day="${dayNum}"]`).addClass('active');
    renderStatsBar();
    renderSchedulePanel();
}

function renderSchedulePanel() {
    if (!db || !db.schedule) return;
    const dayKey = `day${currentScheduleDay}`;
    const events = db.schedule[dayKey] || [];
    const container = document.getElementById('scheduleEventsList');
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:30px; font-size:0.9rem;">لا توجد فعاليات مسجلة لهذا اليوم</div>';
        return;
    }

    let html = '';
    events.forEach((ev, idx) => {
        html += `<div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-weight:900; color:#22d3ee; font-size:0.85rem; background:rgba(6,182,212,0.12); padding:4px 10px; border-radius:8px;">🕒 ${escapeHTML(ev.startTime)} - ${escapeHTML(ev.endTime)}</span>
                <div>
                    <div style="font-weight:800; color:#fff; font-size:0.92rem;">${escapeHTML(ev.title)}</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">${escapeHTML(ev.type || 'فعالية')} · ${escapeHTML(ev.location || 'المقر')}</div>
                </div>
            </div>
            <div style="display:flex; gap:6px;">
                <button onclick="deleteEvent('${dayKey}', ${idx})" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#f87171; border-radius:8px; padding:4px 10px; font-size:0.78rem; font-weight:800; cursor:pointer;" title="حذف الفعالية">
                    <i class="bi bi-trash3"></i> حذف
                </button>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

function openAddEventModal() {
    const title = prompt('اسم الفعالية أو المحاضرة:');
    if (!title) return;
    const startTime = prompt('وقت البداية (مثال 9:00 ص):', '9:00 ص');
    const endTime = prompt('وقت النهاية (مثال 10:00 ص):', '10:00 ص');
    const type = prompt('نوع الفعالية (محاضرة / ورشة / قداس / وجبة / ترفيه):', 'محاضرة');

    if (!db.schedule) db.schedule = { day1: [], day2: [], day3: [], day4: [] };
    const dayKey = `day${currentScheduleDay}`;
    if (!db.schedule[dayKey]) db.schedule[dayKey] = [];

    db.schedule[dayKey].push({
        id: 'act_' + Date.now(),
        title: title.trim(),
        startTime: startTime || '',
        endTime: endTime || '',
        type: type || 'فعالية'
    });

    markUnsaved();
    saveToStorage();
    renderSchedulePanel();
    showToast(`تمت إضافة فعالية "${title}" لليوم ${currentScheduleDay} بنجاح ✅`, 'success');
}

function deleteEvent(dayKey, idx) {
    if (!db || !db.schedule || !db.schedule[dayKey]) return;
    const ev = db.schedule[dayKey][idx];
    if (confirm(`هل أنت متأكد من حذف فعالية "${ev ? ev.title : ''}"؟`)) {
        db.schedule[dayKey].splice(idx, 1);
        markUnsaved();
        saveToStorage();
        renderSchedulePanel();
        showToast('تم حذف الفعالية بنجاح ✅', 'info');
    }
}

function renderCloudPanel() {
    const input = document.getElementById('masterGasUrlInput');
    if (input && window.DataService) {
        input.value = window.DataService.getGasUrl();
    }
    renderMasterFeedbacks();
}

function saveMasterGasUrl() {
    const input = document.getElementById('masterGasUrlInput');
    if (!input || !window.DataService) return;
    const url = input.value.trim();
    window.DataService.setGasUrl(url);
    showToast('تم حفظ وتحديث رابط Google Apps Script بنجاح ✅', 'success');
    renderStatsBar();
}

async function pushAllToSheetFromMaster() {
    if (!window.DataService || !window.DataService.getGasUrl()) {
        showToast('يرجى كتابة وحفظ رابط Google Apps Script أولاً!', 'error');
        return;
    }

    if (!confirm(`هل تريد رفع كافة بيانات المشتركين والملاحظات (${db.participants.length} مشترك) إلى Google Sheets؟`)) return;

    const items = db.participants.map(p => {
        const groupObj = db.groups ? db.groups.find(g => g.id === p.groupId) : null;
        return {
            name: p.name || '',
            group: groupObj ? groupObj.name : (p.groupId || ''),
            points: Number(p.points || 0),
            room: p.roomId ? p.roomId.replace(/^r/, '') : '',
            bus: p.busNumber ? ('أتوبيس ' + p.busNumber) : '',
            seat: p.seatNumber ? String(p.seatNumber) : '',
            feedback: p.feedback || '',
            nextTrip: p.nextTrip || ''
        };
    });

    const res = await window.DataService.sendToGAS({
        action: 'bulkImport',
        items: items
    });

    if (res && (res.status === 'success' || res.status === 'offline')) {
        showToast('✅ تم رفع كافة بيانات الكشوفات لـ Google Sheets بنجاح!', 'success');
    } else {
        showToast('⚠️ تعذر الإرسال التلقائي، يرجى مراجعة إعدادات النشر ومحاولة المزامنة مجدداً.', 'warning');
    }
}

function renderMasterFeedbacks() {
    const container = document.getElementById('masterFeedbacksList');
    const badge = document.getElementById('feedbacksMasterCount');
    if (!container) return;

    let feedbacks = [];
    if (db && Array.isArray(db.participants)) {
        feedbacks = db.participants.filter(p => p.feedback || p.nextTrip);
    }

    if (badge) badge.textContent = feedbacks.length + ' رأي وملاحظة';

    if (feedbacks.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:25px; font-size:0.85rem;">لا توجد تقييمات أو ترشيحات مسجلة بعد</div>';
        return;
    }

    let html = '';
    feedbacks.forEach(f => {
        html += `<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px; margin-bottom:8px;">
            <div style="font-weight:800; color:#c084fc; font-size:0.88rem; margin-bottom:4px;"><i class="bi bi-person-circle me-1"></i> ${escapeHTML(f.name)}</div>
            ${f.feedback ? `<div style="font-size:0.8rem; color:#e2e8f0; margin-bottom:3px;"><strong>الرأي:</strong> ${escapeHTML(f.feedback)}</div>` : ''}
            ${f.nextTrip ? `<div style="font-size:0.8rem; color:#34d399;"><strong>ترشيح الرحلة الجاية:</strong> ${escapeHTML(f.nextTrip)}</div>` : ''}
        </div>`;
    });

    container.innerHTML = html;
}

/* ========================================================
   إدارة النقاط والحكام وتقييم المجموعات (Admin Scores & 3 Judges)
   ======================================================== */

/* ═══════════════════════════════════════════════
   هيكل الأنشطة: كل نشاط له نوع (workshop/lecture/game) وسقف
   type: 'workshop'  → يحكم عليه 3 حكام، كل حكم 0-50، يُعتمد المتوسط
   type: 'lecture'   → المشرف فقط، سقف 20 نقطة/يوم
   type: 'game'      → المشرف فقط، سقف 30 نقطة/يوم
   الإجمالي الأقصى: 50 + 20 + 30 = 100 نقطة × 3 أيام = 300 نقطة
   ═══════════════════════════════════════════════ */
const MASTER_CONFERENCE_ACTIVITIES = {
    "1": [
        { id: "d1_lec1",  type: "lecture",  name: "المحاضرة الأولى — افتتاح المؤتمر",    maxWeight: 20 },
        { id: "d1_ws1",   type: "workshop", name: "ورشة العمل الأولى",                     maxWeight: 50 },
        { id: "d1_game1", type: "game",     name: "الألعاب والأنشطة — اليوم الأول",        maxWeight: 30 }
    ],
    "2": [
        { id: "d2_lec1",  type: "lecture",  name: "المحاضرة الثانية",                      maxWeight: 20 },
        { id: "d2_ws1",   type: "workshop", name: "ورشة العمل الثانية",                     maxWeight: 50 },
        { id: "d2_game1", type: "game",     name: "الألعاب والأنشطة — اليوم الثاني",       maxWeight: 30 }
    ],
    "3": [
        { id: "d3_lec1",  type: "lecture",  name: "القداس الإلهي والمحاضرة الختامية",     maxWeight: 20 },
        { id: "d3_ws1",   type: "workshop", name: "ورشة العمل الثالثة",                     maxWeight: 50 },
        { id: "d3_game1", type: "game",     name: "الألعاب والأنشطة — اليوم الثالث",       maxWeight: 30 }
    ]
};

/* سقوف النقاط اليومية */
const DAY_CAPS = { workshop: 50, lecture: 20, game: 30 };
const TOTAL_MAX_PTS = 300; // 100 × 3 أيام

/* النجوم بناءً على النقاط الكلية من 300 */
function getGroupStars(pts) {
    const pct = pts / TOTAL_MAX_PTS;
    if (pct >= 0.83) return 5;
    if (pct >= 0.67) return 4;
    if (pct >= 0.50) return 3;
    if (pct >= 0.33) return 2;
    return 1;
}

function renderStarsHTML(pts) {
    const count = getGroupStars(pts);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= count
            ? '<i class="bi bi-star-fill" style="color:#fbbf24; font-size:0.9rem;"></i>'
            : '<i class="bi bi-star" style="color:#374151; font-size:0.9rem;"></i>';
    }
    return html;
}

/* مفاتيح التخزين لسجل النقاط المفصّل */
function _getScoreKey(groupId, day, type) {
    return `yc_pts_${groupId}_day${day}_${type}`;
}
function _getScoreVal(groupId, day, type) {
    return Number(localStorage.getItem(_getScoreKey(groupId, day, type)) || 0);
}
function _setScoreVal(groupId, day, type, val) {
    localStorage.setItem(_getScoreKey(groupId, day, type), val);
}
/* حساب الإجمالي الكلي لمجموعة معينة من جميع الأيام */
function calcGroupTotalFromStorage(groupId) {
    let total = 0;
    ['1','2','3'].forEach(d => {
        total += _getScoreVal(groupId, d, 'workshop');
        total += _getScoreVal(groupId, d, 'lecture');
        total += _getScoreVal(groupId, d, 'game');
    });
    return total;
}

function saveJudgesNamesMaster() {
    const j1 = $('#judge1Name').val().trim() || 'الحكم 1';
    const j2 = $('#judge2Name').val().trim() || 'الحكم 2';
    const j3 = $('#judge3Name').val().trim() || 'الحكم 3';
    localStorage.setItem('yc_judge1_name', j1);
    localStorage.setItem('yc_judge2_name', j2);
    localStorage.setItem('yc_judge3_name', j3);
    updateJudgesHeaders();
    showToast('✅ تم حفظ وتثبيت أسماء الحكام بنجاح!', 'success');
}

function updateJudgesHeaders() {
    const j1 = $('#judge1Name').val() || localStorage.getItem('yc_judge1_name') || 'الحكم 1';
    const j2 = $('#judge2Name').val() || localStorage.getItem('yc_judge2_name') || 'الحكم 2';
    const j3 = $('#judge3Name').val() || localStorage.getItem('yc_judge3_name') || 'الحكم 3';

    $('#thJudge1').text(j1);
    $('#thJudge2').text(j2);
    $('#thJudge3').text(j3);
}

function onEvalDayChange() {
    const day = $('#evalDaySelect').val() || '1';
    const activities = MASTER_CONFERENCE_ACTIVITIES[day] || [];
    let html = '';
    activities.forEach(act => {
        html += `<option value="${act.id}" data-weight="${act.maxWeight}">${escapeHTML(act.name)} (${act.maxWeight} نقطة)</option>`;
    });
    $('#evalActivitySelect').html(html);
    onEvalActivityChange();
}

function onEvalActivityChange() {
    const selectedOpt = $('#evalActivitySelect option:selected');
    const weight = selectedOpt.data('weight') || 50;
    $('#evalMaxPoints').val(weight);
}

function saveGasSettingsFromMaster() {
    const url = $('#masterGasUrlInput').val();
    const token = $('#masterGasTokenInput').val();
    window.DataService.setGasUrl(url);
    window.DataService.setGasToken(token);
    showToast('✅ تم حفظ إعدادات السيرفر السحابي ومفتاح الأمان بنجاح!', 'success');
    updateMasterCloudStatus();
}

function updateMasterCloudStatus() {
    const url = window.DataService.getGasUrl();
    const $badge = $('#masterCloudBadge');
    if ($badge.length) {
        if (url) {
            $badge.html('<i class="bi bi-cloud-check-fill me-1"></i> متصل بـ Google Sheets ✅').css({
                'background': 'rgba(16, 185, 129, 0.2)', 'border-color': '#10b981', 'color': '#34d399'
            });
        } else {
            $badge.html('<i class="bi bi-cloud-slash-fill me-1"></i> غير متصل ⚠️').css({
                'background': 'rgba(245, 158, 11, 0.2)', 'border-color': '#f59e0b', 'color': '#fbbf24'
            });
        }
    }
}

async function openGuideModalMaster() {
    $('#guideModalMaster').addClass('show');
    try {
        const res = await fetch('assets/js/google-apps-script-Code.gs.js');
        const text = await res.text();
        $('#gasScriptCodeMaster').val(text);
    } catch (e) {}
}

function closeGuideModalMaster() {
    $('#guideModalMaster').removeClass('show');
}

function copyGasCodeMaster() {
    const el = document.getElementById('gasScriptCodeMaster');
    el.select();
    document.execCommand('copy');
    showToast('تم نسخ كود Google Apps Script بنجاح! 📋', 'success');
}

function renderAdminScoresPanel() {
    const savedUrl = window.DataService.getGasUrl();
    if (savedUrl) $('#masterGasUrlInput').val(savedUrl);

    const savedToken = window.DataService.getGasToken();
    if (savedToken) $('#masterGasTokenInput').val(savedToken);

    const j1 = localStorage.getItem('yc_judge1_name') || 'الحكم 1';
    const j2 = localStorage.getItem('yc_judge2_name') || 'الحكم 2';
    const j3 = localStorage.getItem('yc_judge3_name') || 'الحكم 3';
    $('#judge1Name').val(j1);
    $('#judge2Name').val(j2);
    $('#judge3Name').val(j3);

    updateJudgesHeaders();
    renderGroupsEvalTable();
    renderSupervisorTable();
    renderGroupSummaryCards();
}

function renderGroupsEvalTable() {
    if (!db || !Array.isArray(db.groups)) return;
    const day = $('#evalDaySelect').val() || '1';
    const j1Name = localStorage.getItem('yc_judge1_name') || 'الحكم 1';
    const j2Name = localStorage.getItem('yc_judge2_name') || 'الحكم 2';
    const j3Name = localStorage.getItem('yc_judge3_name') || 'الحكم 3';

    let html = '';
    db.groups.forEach(g => {
        const members = db.participants ? db.participants.filter(p => p.groupId === g.id) : [];
        const savedWS = _getScoreVal(g.id, day, 'workshop');

        html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding:12px; text-align:right; font-weight:800; color:#fff;">
                <span style="background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.4); color:#22d3ee; padding:4px 10px; border-radius:12px; font-size:0.88rem;">
                    ${escapeHTML(g.name)}
                </span>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:3px;">${members.length} مشترك</div>
            </td>
            <td style="padding:8px; text-align:center;">
                <input type="number" id="j1_${g.id}" class="edit-input"
                    style="width:68px; padding:6px; font-size:0.88rem; text-align:center;"
                    min="0" max="50" placeholder="0-50" oninput="calcWorkshopAvg('${g.id}')">
                <div style="font-size:0.62rem; color:#64748b; margin-top:2px;">${j1Name}</div>
            </td>
            <td style="padding:8px; text-align:center;">
                <input type="number" id="j2_${g.id}" class="edit-input"
                    style="width:68px; padding:6px; font-size:0.88rem; text-align:center;"
                    min="0" max="50" placeholder="0-50" oninput="calcWorkshopAvg('${g.id}')">
                <div style="font-size:0.62rem; color:#64748b; margin-top:2px;">${j2Name}</div>
            </td>
            <td style="padding:8px; text-align:center;">
                <input type="number" id="j3_${g.id}" class="edit-input"
                    style="width:68px; padding:6px; font-size:0.88rem; text-align:center;"
                    min="0" max="50" placeholder="0-50" oninput="calcWorkshopAvg('${g.id}')">
                <div style="font-size:0.62rem; color:#64748b; margin-top:2px;">${j3Name}</div>
            </td>
            <td style="padding:8px; text-align:center;">
                <div id="avg_${g.id}" style="font-weight:900; font-size:1.2rem; color:#06b6d4;">—</div>
                <div style="font-size:0.65rem; color:#64748b;">متوسط الحكام</div>
            </td>
            <td style="padding:8px; text-align:center;">
                <div style="font-size:0.8rem; color:${savedWS > 0 ? '#34d399' : '#64748b'}; font-weight:700;">
                    ${savedWS > 0 ? `✅ ${savedWS} نقطة` : '—'}
                </div>
                <div style="font-size:0.62rem; color:#64748b;">اليوم ${day} مُعتمد</div>
            </td>
            <td style="padding:8px;">
                <button class="action-btn primary"
                    style="padding:6px 10px; font-size:0.75rem; white-space:nowrap;"
                    onclick="applyWorkshopScores('${g.id}', '${escapeHTML(g.name)}', '${day}')">
                    <i class="bi bi-check2-circle me-1"></i> اعتماد الورشة
                </button>
            </td>
        </tr>`;
    });

    $('#groupsEvalTableBody').html(html);
}

/* ─── حساب متوسط الحكام لورشة ─── */
function calcWorkshopAvg(groupId) {
    const v1 = Number($(`#j1_${groupId}`).val() || 0);
    const v2 = Number($(`#j2_${groupId}`).val() || 0);
    const v3 = Number($(`#j3_${groupId}`).val() || 0);
    const entered = [v1, v2, v3].filter(v => v > 0);
    if (entered.length === 0) { $(`#avg_${groupId}`).text('—'); return; }
    const avg = Math.round(entered.reduce((a, b) => a + b, 0) / entered.length);
    const capped = Math.min(avg, DAY_CAPS.workshop);
    $(`#avg_${groupId}`).text(capped);
}

/* ─── اعتماد نقاط الورشة (الحكام) ─── */
async function applyWorkshopScores(groupId, groupName, day) {
    const v1 = Number($(`#j1_${groupId}`).val() || 0);
    const v2 = Number($(`#j2_${groupId}`).val() || 0);
    const v3 = Number($(`#j3_${groupId}`).val() || 0);
    const entered = [v1, v2, v3].filter(v => v > 0);
    if (entered.length === 0) {
        showToast('❌ أدخل نقطة واحدة على الأقل قبل الاعتماد', 'error');
        return;
    }
    const avg = Math.min(Math.round(entered.reduce((a, b) => a + b, 0) / entered.length), DAY_CAPS.workshop);

    // حفظ نقاط الورشة لهذا اليوم
    _setScoreVal(groupId, day, 'workshop', avg);

    // تحديث الإجمالي الكلي
    const newTotal = calcGroupTotalFromStorage(groupId);
    _applyPointsToGroup(groupId, groupName, newTotal);
    renderGroupsEvalTable();
    renderGroupSummaryCards();
    showToast(`✅ ورشة اليوم ${day}: ${avg} نقطة للمجموعة ${groupName} (متوسط ${entered.length} حكام) — الإجمالي: ${newTotal}`, 'success');
}

/* ─── اعتماد نقاط المشرف (محاضرة أو لعبة) ─── */
window.applySupervisorPoints = async function(type) {
    if (!db || !Array.isArray(db.groups)) return;
    const day = $('#supDaySelect').val() || '1';
    const cap = DAY_CAPS[type] || 30;
    let anyApplied = false;

    db.groups.forEach(g => {
        const raw = Number($(`#sup_${type}_${g.id}`).val() || 0);
        const pts = Math.min(raw, cap);
        if (raw < 0) return;
        _setScoreVal(g.id, day, type, pts);
        const newTotal = calcGroupTotalFromStorage(g.id);
        _applyPointsToGroup(g.id, g.name, newTotal);
        anyApplied = true;
    });

    if (anyApplied) {
        renderGroupSummaryCards();
        renderSupervisorTable();
        const label = type === 'lecture' ? 'المحاضرة' : 'الألعاب';
        showToast(`✅ تم اعتماد نقاط ${label} لليوم ${day} لجميع المجموعات`, 'success');
    }
};

/* ─── تطبيق النقاط على المشتركين ─── */
function _applyPointsToGroup(groupId, groupName, newTotal) {
    if (!db || !Array.isArray(db.participants)) return;
    db.participants.forEach(p => {
        if (p.groupId === groupId) p.points = newTotal;
    });
    // تحديث نقاط المجموعة أيضاً
    if (Array.isArray(db.groups)) {
        const g = db.groups.find(g => g.id === groupId);
        if (g) g.points = newTotal;
    }
    markUnsaved();
    saveToStorage();
    window.DataService.sendToGAS({ action: 'updateGroupPoints', group: groupName, points: newTotal });
}

/* ─── جدول المشرف ─── */
function renderSupervisorTable() {
    if (!db || !Array.isArray(db.groups)) return;
    const day = $('#supDaySelect').val() || '1';

    ['lecture', 'game'].forEach(type => {
        const cap = DAY_CAPS[type];
        let html = '';
        db.groups.forEach(g => {
            const saved = _getScoreVal(g.id, day, type);
            html += `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;
                        background:rgba(255,255,255,0.03); border-radius:14px; padding:10px 14px; margin-bottom:8px;
                        border:1px solid rgba(255,255,255,0.07);">
                <span style="font-weight:800; color:#e2e8f0; font-size:0.9rem; min-width:90px;">${escapeHTML(g.name)}</span>
                <div style="display:flex; align-items:center; gap:8px; flex:1;">
                    <input type="number" id="sup_${type}_${g.id}" class="edit-input"
                        style="width:80px; padding:6px 8px; font-size:0.95rem; text-align:center;"
                        min="0" max="${cap}" placeholder="0-${cap}">
                    <span style="font-size:0.72rem; color:#64748b;">/ ${cap} نقطة</span>
                </div>
                <div style="font-size:0.8rem; color:${saved > 0 ? '#34d399' : '#64748b'}; font-weight:700; min-width:80px; text-align:center;">
                    ${saved > 0 ? `✅ ${saved} نقطة` : '—'}
                </div>
            </div>`;
        });
        $(`#sup_${type}_rows`).html(html);
    });
}

function renderGroupSummaryCards() {
    if (!db || !Array.isArray(db.groups)) return;

    // ترتيب تنازلي حسب النقاط
    const sortedGroups = [...db.groups].sort((a, b) => {
        const ptsA = calcGroupTotalFromStorage(a.id);
        const ptsB = calcGroupTotalFromStorage(b.id);
        return ptsB - ptsA;
    });

    const rankIcons = ['🥇', '🥈', '🥉', '4️⃣'];
    let html = '';

    sortedGroups.forEach((g, rank) => {
        const members = db.participants ? db.participants.filter(p => p.groupId === g.id) : [];
        const total = calcGroupTotalFromStorage(g.id);
        const ws  = ['1','2','3'].reduce((s, d) => s + _getScoreVal(g.id, d, 'workshop'), 0);
        const lec = ['1','2','3'].reduce((s, d) => s + _getScoreVal(g.id, d, 'lecture'), 0);
        const gm  = ['1','2','3'].reduce((s, d) => s + _getScoreVal(g.id, d, 'game'), 0);
        const pct = Math.min(100, Math.round((total / TOTAL_MAX_PTS) * 100));
        const stars = renderStarsHTML(total);
        const isFirst = rank === 0;

        html += `
        <div class="col-12">
            <div style="
                background: ${isFirst ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(15,23,42,0.9))' : 'rgba(15,23,42,0.7)'};
                border: ${isFirst ? '1.5px solid rgba(251,191,36,0.45)' : '1px solid rgba(255,255,255,0.08)'};
                border-radius: 18px; padding: 16px 20px;
                backdrop-filter: blur(12px); position: relative; overflow: hidden;
            ">
                <!-- رأس البطاقة -->
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.5rem;">${rankIcons[rank] || '#' + (rank + 1)}</span>
                        <div>
                            <div style="font-weight:900; font-size:1rem; color:#f1f5f9;">${escapeHTML(g.name)}</div>
                            <div style="font-size:0.72rem; color:#64748b;">${members.length} مشترك</div>
                        </div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:1.8rem; font-weight:900; color:${isFirst ? '#fbbf24' : '#06b6d4'}; line-height:1;">${total}</div>
                        <div style="font-size:0.65rem; color:#64748b; font-weight:700;">/ ${TOTAL_MAX_PTS} نقطة كلية</div>
                    </div>
                </div>

                <!-- النجوم -->
                <div style="margin-bottom:10px;">${stars}</div>

                <!-- شريط التقدم -->
                <div style="margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="font-size:0.7rem; color:#64748b; font-weight:700;">التقدم الكلي</span>
                        <span style="font-size:0.7rem; color:#06b6d4; font-weight:800;">${pct}%</span>
                    </div>
                    <div style="height:7px; background:rgba(255,255,255,0.07); border-radius:99px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%;
                            background:${isFirst ? 'linear-gradient(90deg,#ffd700,#ff9800)' : 'linear-gradient(90deg,#06b6d4,#3b82f6)'};
                            border-radius:99px; transition:width 0.8s ease;"></div>
                    </div>
                </div>

                <!-- تفاصيل النقاط -->
                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">
                    <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:8px; text-align:center;">
                        <div style="font-size:0.62rem; color:#34d399; font-weight:800; margin-bottom:3px;"><i class="bi bi-tools me-1"></i>ورش العمل</div>
                        <div style="font-size:1.1rem; font-weight:900; color:#f1f5f9;">${ws}</div>
                        <div style="font-size:0.58rem; color:#64748b;">/ 150 نقطة</div>
                    </div>
                    <div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.25); border-radius:12px; padding:8px; text-align:center;">
                        <div style="font-size:0.62rem; color:#c084fc; font-weight:800; margin-bottom:3px;"><i class="bi bi-mic-fill me-1"></i>المحاضرات</div>
                        <div style="font-size:1.1rem; font-weight:900; color:#f1f5f9;">${lec}</div>
                        <div style="font-size:0.58rem; color:#64748b;">/ 60 نقطة</div>
                    </div>
                    <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:12px; padding:8px; text-align:center;">
                        <div style="font-size:0.62rem; color:#f87171; font-weight:800; margin-bottom:3px;"><i class="bi bi-controller me-1"></i>الألعاب</div>
                        <div style="font-size:1.1rem; font-weight:900; color:#f1f5f9;">${gm}</div>
                        <div style="font-size:0.58rem; color:#64748b;">/ 90 نقطة</div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    $('#groupSummaryCardsContainer').html(html);
}

/* ========================================================
   2. FREE GAMES, LEADERBOARD PODIUM & REPORTS
   ======================================================== */

function renderGamesLeaderboardPanel() {
    renderGameLogsTable();
    renderLeaderboardPodium();
    renderWhatsAppReport();
    renderDetailedMatrix();
}

function onGameParticipantSearch(query) {
    const $list = $('#autocompleteSuggestions');
    if (!query || query.trim().length < 1 || !db || !Array.isArray(db.participants)) {
        $list.hide();
        return;
    }

    const q = query.trim().toLowerCase();
    const matches = db.participants.filter(p => p.name && p.name.toLowerCase().includes(q)).slice(0, 8);

    if (matches.length === 0) {
        $list.hide();
        return;
    }

    let html = '';
    matches.forEach(p => {
        const groupObj = db.groups ? db.groups.find(g => g.id === p.groupId) : null;
        const groupName = groupObj ? groupObj.name : 'بدون مجموعة';

        html += `<div class="suggestion-item" onclick="selectGameParticipant('${p.id}', '${escapeHTML(p.name)}', '${p.groupId || 'g1'}')">
            <span><i class="bi bi-person-circle me-1"></i> ${escapeHTML(p.name)}</span>
            <span class="badge-chip badge-cyan" style="font-size:0.7rem;">${escapeHTML(groupName)}</span>
        </div>`;
    });

    $list.html(html).show();
}

function selectGameParticipant(id, name, groupId) {
    $('#gameParticipantInput').val(name);
    if (groupId) $('#gameGroupSelect').val(groupId);
    $('#autocompleteSuggestions').hide();
}

async function handleAddGameLog(e) {
    if (e) e.preventDefault();

    const name = $('#gameParticipantInput').val().trim();
    const groupId = $('#gameGroupSelect').val();
    const score = Number($('#gameScoreInput').val() || 0);
    const desc = $('#gameDescInput').val().trim() || 'لعبة حرة';

    if (!score || score <= 0) {
        showToast('⚠️ يرجى إدخال عدد نقاط صحيح!', 'warning');
        return;
    }

    const groupObj = db.groups ? db.groups.find(g => g.id === groupId) : null;
    const groupName = groupObj ? groupObj.name : 'المجموعة';

    db.gameLogs = db.gameLogs || [];
    const newLog = {
        id: 'glog_' + Date.now(),
        participantName: name || 'مشترك',
        groupId: groupId,
        groupName: groupName,
        score: score,
        desc: desc,
        date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    db.gameLogs.unshift(newLog);

    let newGroupTotal = 0;
    if (db.participants) {
        db.participants.forEach(p => {
            if (p.groupId === groupId) {
                p.points = Number(p.points || 0) + score;
                newGroupTotal = p.points;
            }
        });
    }

    markUnsaved();
    saveToStorage();
    renderGamesLeaderboardPanel();

    $('#gameParticipantInput').val('');
    $('#gameScoreInput').val('');
    $('#gameDescInput').val('');

    await window.DataService.sendToGAS({
        action: 'updateGroupPoints',
        group: groupName,
        points: newGroupTotal
    });

    showToast(`🏆 تم تسجيل +${score} نقطة لـ ${groupName} (${desc})!`, 'success');
}

function renderGameLogsTable() {
    const logs = db.gameLogs || [];
    $('#gameLogsCountBadge').text(logs.length + ' سجل');

    if (logs.length === 0) {
        $('#gameLogsTableBody').html(`<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">لا توجد سجلات ألعاب حرة مضافة بعد</td></tr>`);
        return;
    }

    let html = '';
    logs.forEach(l => {
        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 8px; text-align: right; font-weight: 700; color: #fff;">${escapeHTML(l.participantName)}</td>
                <td style="padding: 8px;"><span class="badge-chip badge-cyan" style="font-size:0.75rem;">${escapeHTML(l.groupName)}</span></td>
                <td style="padding: 8px; font-weight: 900; color: #fbbf24;">+${l.score}</td>
                <td style="padding: 8px; font-size: 0.78rem; color: #94a3b8;">${escapeHTML(l.desc)}</td>
                <td style="padding: 8px;">
                    <button onclick="deleteGameLog('${l.id}')" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 0.9rem;" title="حذف السجل">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    $('#gameLogsTableBody').html(html);
}

async function deleteGameLog(logId) {
    if (!db || !Array.isArray(db.gameLogs)) return;

    const idx = db.gameLogs.findIndex(l => l.id === logId);
    if (idx === -1) return;

    const log = db.gameLogs[idx];
    const groupId = log.groupId;
    const score = log.score;

    db.gameLogs.splice(idx, 1);

    let newGroupTotal = 0;
    if (db.participants) {
        db.participants.forEach(p => {
            if (p.groupId === groupId) {
                p.points = Math.max(0, Number(p.points || 0) - score);
                newGroupTotal = p.points;
            }
        });
    }

    markUnsaved();
    saveToStorage();
    renderGamesLeaderboardPanel();

    await window.DataService.sendToGAS({
        action: 'updateGroupPoints',
        group: log.groupName,
        points: newGroupTotal
    });

    showToast('تم إلغاء وحذف سجل اللعبة بنجاح!', 'info');
}

function renderLeaderboardPodium() {
    if (!db || !Array.isArray(db.groups)) return;

    const groupScores = db.groups.map(g => {
        const members = db.participants ? db.participants.filter(p => p.groupId === g.id || p.group === g.name) : [];
        let pts = 0;
        if (members.length > 0) {
            pts = Math.max(...members.map(m => Number(m.points || 0)));
        }
        if (!pts) pts = Number(g.points || g.score || 0);
        return { id: g.id, name: g.name, points: pts, membersCount: members.length };
    });

    groupScores.sort((a, b) => b.points - a.points);

    const first = groupScores[0] || { name: 'المجموعة 1', points: 0 };
    const second = groupScores[1] || { name: 'المجموعة 2', points: 0 };
    const third = groupScores[2] || { name: 'المجموعة 3', points: 0 };

    let html = `
        <!-- 2nd Place (Left) -->
        <div class="podium-card second">
            <div class="podium-badge">🥈</div>
            <div class="podium-name">${escapeHTML(second.name)}</div>
            <div class="podium-score">${second.points}</div>
            <div style="font-size:0.72rem; color:#c084fc; font-weight:800; margin-top:2px;">المركز الثاني</div>
        </div>

        <!-- 1st Place (Center) -->
        <div class="podium-card first">
            <div style="position:absolute; top:-12px; font-size:1.4rem;">👑</div>
            <div class="podium-badge">🥇</div>
            <div class="podium-name" style="color:#fbbf24;">${escapeHTML(first.name)}</div>
            <div class="podium-score" style="color:#fbbf24; font-size:1.45rem;">${first.points}</div>
            <div style="font-size:0.72rem; color:#fef08a; font-weight:800; margin-top:2px;">المركز الأول 🏆</div>
        </div>

        <!-- 3rd Place (Right) -->
        <div class="podium-card third">
            <div class="podium-badge">🥉</div>
            <div class="podium-name">${escapeHTML(third.name)}</div>
            <div class="podium-score">${third.points}</div>
            <div style="font-size:0.72rem; color:#38bdf8; font-weight:800; margin-top:2px;">المركز الثالث</div>
        </div>
    `;

    $('#podiumContainer').css('direction', 'ltr').html(html);
}

function renderWhatsAppReport() {
    if (!db || !Array.isArray(db.groups)) return;

    const groupScores = db.groups.map(g => {
        const members = db.participants ? db.participants.filter(p => p.groupId === g.id) : [];
        const pts = members.length > 0 ? Number(members[0].points || 0) : 0;
        return { name: g.name, points: pts };
    }).sort((a, b) => b.points - a.points);

    const text = `🏆 تقرير نتائج ونقاط المجموعات — مؤتمر الشباب 2026 🍲
--------------------------------------------------
🥇 المركز الأول: ${groupScores[0] ? groupScores[0].name : ''} — (${groupScores[0] ? groupScores[0].points : 0} نقطة) 👑
🥈 المركز الثاني: ${groupScores[1] ? groupScores[1].name : ''} — (${groupScores[1] ? groupScores[1].points : 0} نقطة)
🥉 المركز الثالث: ${groupScores[2] ? groupScores[2].name : ''} — (${groupScores[2] ? groupScores[2].points : 0} نقطة)
🏅 المركز الرابع: ${groupScores[3] ? groupScores[3].name : ''} — (${groupScores[3] ? groupScores[3].points : 0} نقطة)
--------------------------------------------------
✨ تحيات لجنة التحكيم والإدارة للمؤتمر ✨`;

    $('#whatsappReportPreview').val(text);
}

function copyWhatsAppReport() {
    const text = $('#whatsappReportPreview').val();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const el = document.getElementById('whatsappReportPreview');
        el.select();
        document.execCommand('copy');
    }
    showToast('تم نسخ التقرير المنسق لـ WhatsApp بنجاح! 📲', 'success');
}

function exportCSVReport() {
    if (!db || !Array.isArray(db.participants)) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "الرقم,الاسم,المجموعة,النقاط,الغرفة,الأتوبيس,المقعد,الرأي,ترشيح الرحلة\n";

    db.participants.forEach((p, idx) => {
        const groupObj = db.groups ? db.groups.find(g => g.id === p.groupId) : null;
        const groupName = groupObj ? groupObj.name : 'بدون مجموعة';
        const row = [
            idx + 1,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${groupName}"`,
            p.points || 0,
            `"${p.roomId || ''}"`,
            `"${p.busNumber || ''}"`,
            `"${p.seatNumber || ''}"`,
            `"${(p.feedback || '').replace(/"/g, '""')}"`,
            `"${(p.nextTrip || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_مؤتمر_الشباب_2026_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('تم تحميل ملف Excel (CSV) المطور بنجاح! 📊', 'success');
}

function renderDetailedMatrix() {
    if (!db || !Array.isArray(db.groups)) return;

    let html = '';
    db.groups.forEach(g => {
        const members = db.participants ? db.participants.filter(p => p.groupId === g.id) : [];
        const pts = members.length > 0 ? Number(members[0].points || 0) : 0;

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 10px; text-align: right; font-weight: 800; color: #fff;">${escapeHTML(g.name)}</td>
                <td style="padding: 10px; color: #22d3ee;">70</td>
                <td style="padding: 10px; color: #c084fc;">90</td>
                <td style="padding: 10px; color: #34d399;">90</td>
                <td style="padding: 10px; color: #fbbf24;">+${pts > 250 ? pts - 250 : 0}</td>
                <td style="padding: 10px; font-weight: 900; color: #fbbf24; font-size: 1rem;">${pts} نقطة</td>
            </tr>
        `;
    });

    $('#detailedMatrixTableBody').html(html);
}

/* ========================================================
   3. FULL 8-COLUMN DATABASE TABLE (from admin.html)
   ======================================================== */

function renderFullDbPanel() {
    if (!db || !Array.isArray(db.participants)) return;

    const totalCount = db.participants.length;
    let totalPointsSum = 0;
    let roomsUsedSet = new Set();
    let seatsUsedCount = 0;

    db.participants.forEach(p => {
        totalPointsSum += Number(p.points || 0);
        if (p.roomId) roomsUsedSet.add(p.roomId);
        if (p.seatNumber) seatsUsedCount++;
    });

    $('#fullDbStatTotal').text(totalCount);
    $('#fullDbStatPoints').text(totalPointsSum);
    $('#fullDbStatRooms').text(roomsUsedSet.size);
    $('#fullDbStatBuses').text(seatsUsedCount);

    const query = ($('#fullDbSearchInput').val() || '').trim().toLowerCase();

    let filtered = db.participants;
    if (query) {
        filtered = db.participants.filter(p => {
            const gObj = db.groups ? db.groups.find(g => g.id === p.groupId) : null;
            const gName = gObj ? gObj.name : '';
            return (p.name && p.name.toLowerCase().includes(query)) ||
                   (gName && gName.toLowerCase().includes(query)) ||
                   (p.roomId && String(p.roomId).toLowerCase().includes(query)) ||
                   (p.busNumber && String(p.busNumber).includes(query)) ||
                   (p.feedback && p.feedback.toLowerCase().includes(query)) ||
                   (p.nextTrip && p.nextTrip.toLowerCase().includes(query));
        });
    }

    if (filtered.length === 0) {
        $('#fullDbTableBody').html(`<tr><td colspan="10" style="text-align:center; padding: 25px; color: var(--text-muted);">لا توجد نتائج مطابقة للبحث</td></tr>`);
        return;
    }

    let html = '';
    filtered.forEach((p, idx) => {
        const groupObj = db.groups ? db.groups.find(g => g.id === p.groupId) : null;
        const groupName = groupObj ? groupObj.name : 'بدون مجموعة';
        const busText = p.busNumber ? `أتوبيس ${p.busNumber}` : '—';
        const seatText = p.seatNumber ? `${p.seatNumber}` : '—';
        const roomText = p.roomId ? `${p.roomId.replace(/^r/, '')}` : '—';

        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">${idx + 1}</td>
                <td style="padding: 10px; font-weight: 800; color: #fff;">${escapeHTML(p.name)}</td>
                <td style="padding: 10px;"><span class="badge-chip badge-cyan">${escapeHTML(groupName)}</span></td>
                <td style="padding: 10px; text-align: center; font-weight: 900; color: #fbbf24;">${p.points || 0}</td>
                <td style="padding: 10px; text-align: center; color: #c084fc; font-weight: 700;">${roomText}</td>
                <td style="padding: 10px; text-align: center; color: #38bdf8;">${busText}</td>
                <td style="padding: 10px; text-align: center; color: #34d399; font-weight: 800;">${seatText}</td>
                <td style="padding: 10px; font-size: 0.78rem; color: #cbd5e1; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(p.feedback || '—')}</td>
                <td style="padding: 10px; font-size: 0.78rem; color: #f472b6; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(p.nextTrip || '—')}</td>
                <td style="padding: 10px; text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button onclick="openEditModal('${p.id}')" class="action-btn primary" style="padding: 4px 8px; font-size: 0.75rem;" title="تعديل">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button onclick="confirmDeletePassenger('${p.id}')" class="action-btn danger" style="padding: 4px 8px; font-size: 0.75rem;" title="حذف">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    $('#fullDbTableBody').html(html);
}
