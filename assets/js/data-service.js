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
                this.cachedData = data;
                // لا نُعيد الكتابة على window.conferenceData إذا كانت مسودة localStorage
                // موجودة — لأن manage-passengers.js يضع نسخة أحدث هناك
                const hasDraft = (() => {
                    try {
                        const s = localStorage.getItem('conference_db_draft');
                        return !!(s && JSON.parse(s)?.db?.participants);
                    } catch (e) { return false; }
                })();
                if (!hasDraft) {
                    window.conferenceData = data;
                }
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
