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

        let staticDataPromise;
        const cacheKey = 'static_conference_data';
        const cachedStatic = sessionStorage.getItem(cacheKey);

        if (cachedStatic) {
            try {
                const parsed = JSON.parse(cachedStatic);
                const hasScores = parsed && parsed.groups && parsed.groups.every(g => typeof g.score !== 'undefined');
                const hasNewWorkshops = parsed && parsed.workshops && parsed.workshops.some(w => w.title && w.title.includes('فك الشفرة'));
                const hasNewProgram = parsed && parsed.program && parsed.program.some(p => p.day === 4);
                
                if (hasScores && hasNewWorkshops && hasNewProgram) {
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
            .then(data => {
                const dataCopy = JSON.parse(JSON.stringify(data));

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
