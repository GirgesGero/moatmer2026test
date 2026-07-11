/* program-data.js — برنامج المؤتمر الفعلي المستخرج من جدول المؤتمر
   أنواع الأنشطة: prayer | lecture | workshop | meal | free | travel | other
*/

const program = [
  /* ─── اليوم الأول ─── */
  {
    id: "d1-a1",
    day: 1,
    title: "التجمع",
    type: "travel",
    time: "06:00",
    endTime: "06:30",
    place: "نقطة التجمع الكنيسة",
    notes: "حضور باكر للالتزام بالتحرك"
  },
  {
    id: "d1-a2",
    day: 1,
    title: "التحرك",
    type: "travel",
    time: "06:30",
    endTime: "08:00",
    place: "الأتوبيسات",
    notes: "بداية رحلة المؤتمر"
  },
  {
    id: "d1-a3",
    day: 1,
    title: "القداس الإلهي",
    type: "prayer",
    time: "08:00",
    endTime: "10:00",
    place: "الكنيسة/بيت المؤتمرات",
    notes: "بركة انطلاق المؤتمر"
  },
  {
    id: "d1-a4",
    day: 1,
    title: "فطور",
    type: "meal",
    time: "10:00",
    endTime: "10:30",
    place: "مطعم بيت المؤتمرات",
    notes: ""
  },
  {
    id: "d1-a5",
    day: 1,
    title: "التحرك للبيت",
    type: "travel",
    time: "10:30",
    endTime: "11:00",
    place: "الأتوبيسات",
    notes: "التحرك لمقر الإقامة والتسكين"
  },
  {
    id: "d1-a6",
    day: 1,
    title: "الوصول للبيت",
    type: "travel",
    time: "11:00",
    endTime: "11:15",
    place: "بيت المؤتمر",
    notes: "حمد لله على السلامة"
  },
  {
    id: "d1-a7",
    day: 1,
    title: "استلام الغرف",
    type: "other",
    time: "11:00",
    endTime: "12:00",
    place: "مكاتب التسكين",
    notes: "توزيع الغرف والأسرّة"
  },
  {
    id: "d1-a8",
    day: 1,
    title: "راحة",
    type: "free",
    time: "12:00",
    endTime: "13:00",
    place: "الغرف",
    notes: "فترة استراحة وتجهيز"
  },
  {
    id: "d1-a9",
    day: 1,
    title: "المحاضرة الأولى",
    type: "lecture",
    time: "13:00",
    endTime: "15:00",
    place: "القاعة الرئيسية",
    notes: "المحاضر: سيتم تحديده",
    linkedId: "d1-l1"
  },
  {
    id: "d1-a10",
    day: 1,
    title: "الغداء",
    type: "meal",
    time: "15:00",
    endTime: "16:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d1-a11",
    day: 1,
    title: "بسين (حمام السباحة)",
    type: "free",
    time: "16:00",
    endTime: "18:00",
    place: "حمام السباحة",
    notes: "أنشطة ترفيهية مائية"
  },
  {
    id: "d1-a12",
    day: 1,
    title: "شاور",
    type: "other",
    time: "18:00",
    endTime: "19:00",
    place: "الغرف",
    notes: "تجهيز للمحاضرة المسائية"
  },
  {
    id: "d1-a13",
    day: 1,
    title: "محاضرة بالورشة",
    type: "workshop",
    time: "19:00",
    endTime: "21:00",
    place: "قاعة ورش العمل",
    notes: "تطبيقات عملية تفاعلية",
    linkedId: "d1-w1"
  },
  {
    id: "d1-a14",
    day: 1,
    title: "العشاء",
    type: "meal",
    time: "21:00",
    endTime: "22:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d1-a15",
    day: 1,
    title: "ألعاب وفترة ترفيهية",
    type: "free",
    time: "22:00",
    endTime: "23:59",
    place: "الملعب / الصالة الرئيسية",
    notes: "مسابقات وألعاب جماعية"
  },

  /* ─── اليوم الثاني ─── */
  {
    id: "d2-a1",
    day: 2,
    title: "صلاة باكر / صلاة جماعية",
    type: "prayer",
    time: "08:00",
    endTime: "09:00",
    place: "الكنيسة / القاعة الرئيسية",
    notes: "بداية اليوم بطلب معونة الله"
  },
  {
    id: "d2-a2",
    day: 2,
    title: "فطور",
    type: "meal",
    time: "09:00",
    endTime: "10:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d2-a3",
    day: 2,
    title: "بسين (حمام السباحة)",
    type: "free",
    time: "10:00",
    endTime: "12:00",
    place: "حمام السباحة",
    notes: "ترفيه وسباحة"
  },
  {
    id: "d2-a4",
    day: 2,
    title: "شاور + راحة",
    type: "free",
    time: "12:00",
    endTime: "14:00",
    place: "الغرف",
    notes: "قسط من الراحة والاسترخاء"
  },
  {
    id: "d2-a5",
    day: 2,
    title: "المحاضرة الثانية",
    type: "lecture",
    time: "14:00",
    endTime: "16:00",
    place: "القاعة الرئيسية",
    notes: "المحاضر: سيتم تحديده",
    linkedId: "d2-l1"
  },
  {
    id: "d2-a6",
    day: 2,
    title: "الغداء",
    type: "meal",
    time: "16:00",
    endTime: "17:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d2-a7",
    day: 2,
    title: "حلقة صلاة وتأمل",
    type: "prayer",
    time: "17:00",
    endTime: "18:00",
    place: "قاعة التأملات",
    notes: "فترة صلاة روحية مشتركة"
  },
  {
    id: "d2-a8",
    day: 2,
    title: "ألعاب مسائية",
    type: "free",
    time: "18:00",
    endTime: "19:00",
    place: "الملعب",
    notes: "أنشطة رياضية وتنافسية"
  },
  {
    id: "d2-a9",
    day: 2,
    title: "محاضرة بالورشة",
    type: "workshop",
    time: "19:00",
    endTime: "21:00",
    place: "قاعة ورش العمل",
    notes: "الورش التفاعلية لليوم الثاني",
    linkedId: "d2-w1"
  },
  {
    id: "d2-a10",
    day: 2,
    title: "العشاء",
    type: "meal",
    time: "21:00",
    endTime: "22:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d2-a11",
    day: 2,
    title: "ألعاب وسهرة للمؤتمر",
    type: "free",
    time: "22:00",
    endTime: "23:59",
    place: "الصالة الكبرى",
    notes: "فقرات ترفيهية وسهرة روحية"
  },

  /* ─── اليوم الثالث ─── */
  {
    id: "d3-a1",
    day: 3,
    title: "القداس الإلهي",
    type: "prayer",
    time: "07:00",
    endTime: "09:00",
    place: "الكنيسة",
    notes: "قداس ختام المؤتمر"
  },
  {
    id: "d3-a2",
    day: 3,
    title: "فطور",
    type: "meal",
    time: "09:00",
    endTime: "10:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d3-a3",
    day: 3,
    title: "بسين (حمام السباحة)",
    type: "free",
    time: "10:00",
    endTime: "12:00",
    place: "حمام السباحة",
    notes: "فترة ترفيهية مائية أخيرة"
  },
  {
    id: "d3-a4",
    day: 3,
    title: "شاور + راحة",
    type: "free",
    time: "12:00",
    endTime: "14:00",
    place: "الغرف",
    notes: "تجهيز الحقائب والاستراحة"
  },
  {
    id: "d3-a5",
    day: 3,
    title: "محاضرة بالورشة",
    type: "workshop",
    time: "14:00",
    endTime: "16:00",
    place: "قاعة ورش العمل",
    notes: "الورش التفاعلية لليوم الثالث",
    linkedId: "d3-w1"
  },
  {
    id: "d3-a6",
    day: 3,
    title: "الغداء",
    type: "meal",
    time: "16:00",
    endTime: "17:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d3-a7",
    day: 3,
    title: "ألعاب",
    type: "free",
    time: "17:00",
    endTime: "18:00",
    place: "الملعب",
    notes: "أنشطة ختامية وتجميع النقاط"
  },
  {
    id: "d3-a8",
    day: 3,
    title: "المحاضرة الثالثة",
    type: "lecture",
    time: "18:00",
    endTime: "20:00",
    place: "القاعة الرئيسية",
    notes: "محاضرة الختام وتقييم المؤتمر",
    linkedId: "d3-l1"
  },
  {
    id: "d3-a9",
    day: 3,
    title: "ألعاب ختامية",
    type: "free",
    time: "20:00",
    endTime: "21:00",
    place: "الصالة الكبرى",
    notes: "ختام الأنشطة الجماعية"
  },
  {
    id: "d3-a10",
    day: 3,
    title: "العشاء",
    type: "meal",
    time: "21:00",
    endTime: "22:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d3-a11",
    day: 3,
    title: "حفلة الثمر",
    type: "other",
    time: "22:00",
    endTime: "23:59",
    place: "القاعة الرئيسية",
    notes: "توزيع الهدايا والختام وإعلان الفائزين"
  }
];
