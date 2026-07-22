/* =====================================================
   data-service.js — مؤتمر الشباب 2.0
   المسؤول الموحد عن جلب وإدارة البيانات ومزامنتها مع Google Apps Script & Google Sheets
   ===================================================== */

'use strict';

class DataService {
    static cachedData = null;
    static loadPromise = null;
    static GAS_URL_KEY = 'yc_gas_url';
    static GAS_TOKEN_KEY = 'yc_gas_token';
    static DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxKuHvDa7bu5SGxRK1xYPyY8aZHG_1kC8KJb5RGFDGGdUsVEc2Irr9fIzMC55mu-AiC/exec';
    static DEFAULT_GAS_TOKEN = 'YC2026_SECURE_TOKEN_8921';

    /**
     * الحصول على رابط Web App المربوط بـ Google Apps Script
     */
    static getGasUrl() {
        return (localStorage.getItem(this.GAS_URL_KEY) || this.DEFAULT_GAS_URL).trim();
    }

    /**
     * ضبط وتحديث رابط Google Apps Script Web App
     */
    static setGasUrl(url) {
        if (url) {
            localStorage.setItem(this.GAS_URL_KEY, url.trim());
        } else {
            localStorage.removeItem(this.GAS_URL_KEY);
        }
    }

    /**
     * الحصول على مفتاح الأمان (Security Token) للمزامنة الحساسة
     */
    static getGasToken() {
        return (localStorage.getItem(this.GAS_TOKEN_KEY) || this.DEFAULT_GAS_TOKEN).trim();
    }

    /**
     * ضبط وتحديث مفتاح الأمان
     */
    static setGasToken(token) {
        if (token) {
            localStorage.setItem(this.GAS_TOKEN_KEY, token.trim());
        } else {
            localStorage.removeItem(this.GAS_TOKEN_KEY);
        }
    }

    /**
     * جلب البيانات الرئيسية للمؤتمر (تدمج بيانات ملف JSON مع Google Sheets إذا تم الربط)
     */
    static async loadConference() {
        if (this.cachedData) {
            return this.cachedData;
        }
        if (this.loadPromise) {
            return this.loadPromise;
        }

        const prefix = location.pathname.includes('/pages/') ? '../' : '';
        const url = prefix + 'assets/data/conference-data.json';

        let staticDataPromise;
        const cacheKey = 'static_conference_data';
        const cachedStatic = sessionStorage.getItem(cacheKey);

        if (cachedStatic) {
            try {
                const parsed = JSON.parse(cachedStatic);
                if (parsed && parsed.program && parsed.program.length > 0) {
                    staticDataPromise = Promise.resolve(parsed);
                }
            } catch(e) {}
        }
        
        if (!staticDataPromise) {
            const busterUrl = `${url}?v=${Date.now()}`;
            staticDataPromise = fetch(busterUrl)
                .then(res => {
                    if (!res.ok) throw new Error('فشل جلب ملف البيانات: ' + res.status);
                    return res.json();
                })
                .then(data => {
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                    return data;
                });
        }

        this.loadPromise = staticDataPromise
            .then(async data => {
                const dataCopy = JSON.parse(JSON.stringify(data));

                // 1. دمج مسودة البيانات المحلية (LocalStorage Draft)
                try {
                    const saved = localStorage.getItem('conference_db_draft');
                    if (saved) {
                        const draft = JSON.parse(saved);
                        if (draft && draft.db) {
                            if (Array.isArray(draft.db.participants)) {
                                dataCopy.participants = draft.db.participants;
                            }
                            if (Array.isArray(draft.db.groups)) {
                                dataCopy.groups = draft.db.groups;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('DataService: فشل دمج مسودة البيانات من localStorage:', e);
                }

                // تطبيع وتنسيق بيانات المشاركين لضمان التوافق بين JSON و Google Sheets
                if (Array.isArray(dataCopy.participants)) {
                    const groupsMap = new Map();
                    if (Array.isArray(dataCopy.groups)) {
                        dataCopy.groups.forEach(g => groupsMap.set(g.id, g.name));
                    }

                    dataCopy.participants.forEach(p => {
                        if (!p.group && p.groupId) p.group = groupsMap.get(p.groupId) || p.groupId;
                        
                        // تطبيع الغرف والسكن
                        if (!p.roomId && p.room) {
                            const digits = String(p.room).match(/\d+/);
                            if (digits) p.roomId = 'r' + digits[0];
                            else p.roomId = String(p.room);
                        }
                        if (!p.room && p.roomId) {
                            p.room = String(p.roomId).replace(/^r/, '');
                        }
                        if (p.bedNumber == null && p.bed != null) {
                            const b = parseInt(p.bed);
                            if (!isNaN(b)) p.bedNumber = b;
                        }

                        // تطبيع الأتوبيسات والمقاعد
                        if (!p.busNumber && p.bus) {
                            const busDigits = String(p.bus).match(/\d+/);
                            if (busDigits) p.busNumber = parseInt(busDigits[0]);
                        }
                        if (!p.bus && p.busNumber) p.bus = 'أتوبيس ' + p.busNumber;

                        if (!p.seatNumber && p.seat) {
                            const sNum = parseInt(p.seat);
                            if (!isNaN(sNum)) p.seatNumber = sNum;
                        }
                        if (!p.seat && p.seatNumber) p.seat = String(p.seatNumber);
                    });
                }

                // 2. مزامنة سحابية خلفية من Google Sheets بدون تعطيل فتح الصفحة (Non-blocking Fast Load)
                const gasUrl = this.getGasUrl();
                if (gasUrl) {
                    this.fetchFromGAS(gasUrl).then(liveGasData => {
                        if (liveGasData && Array.isArray(liveGasData) && liveGasData.length > 0) {
                            this.mergeGASItemsIntoConference(dataCopy, liveGasData);
                            console.log('✅ تم جلب ومزامنة البيانات الحية من Google Sheets بنجاح!');
                            window.dispatchEvent(new CustomEvent('yc_live_data_updated', { detail: dataCopy }));
                        }
                    }).catch(gasErr => {
                        console.warn('DataService: يتعذر الجلب من Google Apps Script حالياً، الاعتماد على البيانات المحلية:', gasErr);
                    });
                }

                this.cachedData = dataCopy;
                window.conferenceData = dataCopy;
                return dataCopy;
            })
            .catch(err => {
                console.error('DataService.loadConference: ', err);
                this.loadPromise = null;
                throw err;
            });

        return this.loadPromise;
    }

    /**
     * جلب البيانات مباشرة من رابط Google Apps Script Web App بمهلة زمنية محددة
     */
    static async fetchFromGAS(url) {
        const targetUrl = url || this.getGasUrl();
        if (!targetUrl) return null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        try {
            const res = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error('HTTP Error: ' + res.status);
            const json = await res.json();
            if (json.status === 'success' && Array.isArray(json.data)) {
                return json.data;
            }
            return null;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.warn('DataService: تجاوز مهلة الانتظار لـ Google Apps Script (3.5s timeout)');
            } else {
                console.warn('DataService.fetchFromGAS Error:', err);
            }
            return null;
        }
    }

    /**
     * إبطال الكاش المحلي لإجبار التطبيق على إعادة الجلب المباشر من Google Sheets
     */
    static invalidateCache() {
        this.cachedData = null;
        this.loadPromise = null;
    }

    /**
     * إرسال طلب POST إلى Google Apps Script لتدوين الإجراءات (إضافة، تعديل، تقييم، حذف)
     */
    static async sendToGAS(payload) {
        const gasUrl = this.getGasUrl();
        if (!gasUrl) {
            console.warn('DataService: رابط Google Apps Script غير مضبوط في الإعدادات');
            return { status: 'offline', message: 'لم يتم ربط Google Apps Script' };
        }

        try {
            this.invalidateCache();
            const fullPayload = {
                ...payload,
                token: payload.token || this.getGasToken()
            };
            const res = await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(fullPayload)
            });
            return { status: 'success', message: 'تم إرسال الطلب للسيرفر السحابي بنجاح' };
        } catch (err) {
            console.error('DataService.sendToGAS Error:', err);
            return { status: 'error', message: err.toString() };
        }
    }

    /**
     * تسجيل وإرسال رأي المشترك وترشيح الرحلة الجاية مباشرة إلى Google Sheets
     */
    static async submitFeedback(name, feedback, nextTrip) {
        const payload = {
            action: 'addFeedback',
            name: name || 'زائر',
            feedback: feedback || '',
            nextTrip: nextTrip || ''
        };

        // حفظ محلياً في الـ LocalStorage أولاً لضمان عدم الضياع
        try {
            const localFeedbacks = JSON.parse(localStorage.getItem('yc2_user_feedbacks') || '[]');
            localFeedbacks.push({ ...payload, date: new Date().toISOString() });
            localStorage.setItem('yc2_user_feedbacks', JSON.stringify(localFeedbacks));
        } catch (e) {}

        // الإرسال السحابي لقاعدة بيانات Google Sheets
        return await this.sendToGAS(payload);
    }

    /**
     * دمج عناصر Google Sheets الحية داخل كائن البيانات الداخلي للموقع
     */
    static mergeGASItemsIntoConference(confData, gasItems) {
        if (!confData.participants) confData.participants = [];
        
        // خريطة لتسريع البحث والتسجيل
        const pMap = new Map();
        confData.participants.forEach(p => {
            if (p.name) pMap.set(p.name.trim().toLowerCase(), p);
        });

        // خريطة أسماء المجموعات
        const groupNameToId = new Map();
        if (Array.isArray(confData.groups)) {
            confData.groups.forEach(g => {
                groupNameToId.set(g.name.trim().toLowerCase(), g.id);
                groupNameToId.set(g.id.trim().toLowerCase(), g.id);
            });
        }

        gasItems.forEach(item => {
            if (!item.name) return;
            const key = item.name.trim().toLowerCase();
            let p = pMap.get(key);
            if (!p) {
                p = { id: 'gas-' + Math.random().toString(36).substr(2, 9), name: item.name };
                confData.participants.push(p);
                pMap.set(key, p);
            }

            if (item.group) {
                p.group = item.group;
                p.groupId = groupNameToId.get(item.group.trim().toLowerCase()) || item.group;
            }
            if (typeof item.points !== 'undefined') p.points = Number(item.points);
            
            if (item.room) {
                const roomDigits = String(item.room).match(/\d+/);
                if (roomDigits) {
                    const rNum = roomDigits[0];
                    p.room = rNum;
                    p.roomId = 'r' + rNum;
                } else {
                    p.room = String(item.room);
                    p.roomId = item.room;
                }
            }

            if (item.bus) {
                const busMatch = String(item.bus).match(/\d+/);
                p.busNumber = busMatch ? parseInt(busMatch[0]) : null;
                p.bus = p.busNumber ? ('أتوبيس ' + p.busNumber) : item.bus;
            }

            if (item.seat) {
                const seatNum = parseInt(item.seat);
                p.seatNumber = !isNaN(seatNum) ? seatNum : null;
                p.seat = String(item.seat);
            }

            if (item.feedback) p.feedback = item.feedback;
            if (item.nextTrip) p.nextTrip = item.nextTrip;
        });
    }

    static async getParticipants() {
        const data = await this.loadConference();
        return data.participants || [];
    }

    static async getRooms() {
        const data = await this.loadConference();
        return data.rooms || [];
    }

    static async getBuses() {
        const data = await this.loadConference();
        return data.buses || [];
    }

    static async getGroups() {
        const data = await this.loadConference();
        return data.groups || [];
    }

    static async getMeta() {
        const data = await this.loadConference();
        return data.meta || {};
    }
}

window.DataService = DataService;
