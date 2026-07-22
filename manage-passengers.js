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
    $('#schedule-panel').toggle(section === 'schedule');
    $('#cloud-panel').toggle(section === 'cloud');

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
    } else if (currentSection === 'schedule') {
        renderSchedulePanel();
    } else if (currentSection === 'cloud') {
        renderCloudPanel();
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

    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
});

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
