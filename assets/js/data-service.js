/* =====================================================
   data-service.js — مؤتمر الشباب 2.0
   المسؤول الموحد عن جلب وإدارة البيانات الثابتة للمؤتمر
   ===================================================== */

'use strict';

class DataService {
    static cachedData = null;
    static loadPromise = null;

    static async loadConference() {
        if (this.cachedData) {
            return this.cachedData;
        }
        if (this.loadPromise) {
            return this.loadPromise;
        }

        const prefix = location.pathname.includes('/pages/') ? '../' : '';
        const url = prefix + 'assets/data/conference-data.json';

        this.loadPromise = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('فشل جلب ملف البيانات: ' + res.status);
                return res.json();
            })
            .then(data => {
                // دمج مسودة المتصفح إن وجدت للحفاظ على تعديلات المشتركين وتوزيعاتهم دون الكتابة فوق بقية البيانات الثابتة الجديدة
                try {
                    const saved = localStorage.getItem('conference_db_draft');
                    if (saved) {
                        const draft = JSON.parse(saved);
                        if (draft && draft.db && Array.isArray(draft.db.participants)) {
                            // نستبدل فقط مصفوفة المشاركين بتعديلاتها
                            data.participants = draft.db.participants;
                        }
                    }
                } catch (e) {
                    console.warn('DataService: فشل دمج مسودة المشتركين من localStorage:', e);
                }

                this.cachedData = data;
                window.conferenceData = data;
                return data;
            })
            .catch(err => {
                console.error('DataService.loadConference: ', err);
                throw err;
            });

        return this.loadPromise;
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
