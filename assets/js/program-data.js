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
    title: "قداس",
    type: "prayer",
    time: "08:00",
    endTime: "10:00",
    place: "الكنيسة/بيت المؤتمرات",
    notes: "بركة انطلاق المؤتمر"
  },
  {
    id: "d1-a4",
    day: 1,
    title: "فطار",
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
    place: "بيت الشباب",
    notes: ""
  },
  {
    id: "d1-a6",
    day: 1,
    title: "الوصول للبيت واستلام الغرف",
    type: "other",
    time: "11:00",
    endTime: "12:00",
    place: "البيت",
    notes: "توزيع الغرف والاستلام"
  },
  {
    id: "d1-a7",
    day: 1,
    title: "راحه",
    type: "free",
    time: "12:00",
    endTime: "13:00",
    place: "الغرف",
    notes: ""
  },
  {
    id: "d1-a8",
    day: 1,
    title: "محاضرة",
    type: "lecture",
    time: "13:00",
    endTime: "15:00",
    place: "القاعة الرئيسية",
    notes: "المحاضرة الافتتاحية للمؤتمر",
    linkedId: "d1-l1"
  },
  {
    id: "d1-a9",
    day: 1,
    title: "الغداء",
    type: "meal",
    time: "15:00",
    endTime: "16:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d1-a10",
    day: 1,
    title: "بسيين",
    type: "free",
    time: "16:00",
    endTime: "18:00",
    place: "حمام السباحة",
    notes: "أنشطة ترفيهية مائية"
  },
  {
    id: "d1-a11",
    day: 1,
    title: "شاور",
    type: "other",
    time: "18:00",
    endTime: "19:00",
    place: "الغرف",
    notes: "تجهيز للمحاضرة المسائية"
  },
  {
    id: "d1-a12",
    day: 1,
    title: "محاضرة بالورشه",
    type: "workshop",
    time: "19:00",
    endTime: "21:00",
    place: "قاعة ورش العمل",
    notes: "تطبيقات عملية تفاعلية",
    linkedId: "d1-w1"
  },
  {
    id: "d1-a13",
    day: 1,
    title: "عشاء",
    type: "meal",
    time: "21:00",
    endTime: "22:00",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d1-a14",
    day: 1,
    title: "العاب",
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
    title: "صلاه",
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
    title: "بسيين",
    type: "free",
    time: "10:00",
    endTime: "12:00",
    place: "حمام السباحة",
    notes: "ترفيه وسباحة"
  },
  {
    id: "d2-a4",
    day: 2,
    title: "شاور + راحه",
    type: "free",
    time: "12:00",
    endTime: "14:00",
    place: "الغرف",
    notes: "قسط من الراحة والاسترخاء"
  },
  {
    id: "d2-a5",
    day: 2,
    title: "محاضرة",
    type: "lecture",
    time: "14:00",
    endTime: "16:00",
    place: "القاعة الرئيسية",
    notes: "المحاضرة الروحية الرئيسية لليوم الثاني",
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
    title: "حلقه صلاه",
    type: "prayer",
    time: "17:00",
    endTime: "18:00",
    place: "الكنيسة / القاعة الرئيسية",
    notes: "صلاة مشتركة وتأمل"
  },
  {
    id: "d2-a8",
    day: 2,
    title: "العاب",
    type: "free",
    time: "18:00",
    endTime: "19:00",
    place: "الملعب",
    notes: "أنشطة رياضية وتنافسية"
  },
  {
    id: "d2-a9",
    day: 2,
    title: "محاضرة بالورشه",
    type: "workshop",
    time: "19:00",
    endTime: "21:00",
    place: "قاعة ورش العمل",
    notes: "تواصل وتعبير عن الرأي وتفاعل جماعي",
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
    title: "العاب",
    type: "free",
    time: "22:00",
    endTime: "23:59",
    place: "قاعة الاحتفالات",
    notes: "ألعاب جماعية وفترات ترفيهية"
  },

  /* ─── اليوم الثالث ─── */
  {
    id: "d3-a1",
    day: 3,
    title: "القداس الالهي",
    type: "prayer",
    time: "07:00",
    endTime: "09:00",
    place: "الكنيسة",
    notes: "بركة الصباح والقداس الإلهي"
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
    title: "بسيين",
    type: "free",
    time: "10:00",
    endTime: "12:00",
    place: "حمام السباحة",
    notes: "ترفيه وسباحة"
  },
  {
    id: "d3-a4",
    day: 3,
    title: "شاور + راحه",
    type: "free",
    time: "12:00",
    endTime: "14:00",
    place: "الغرف",
    notes: "قسط من الراحة"
  },
  {
    id: "d3-a5",
    day: 3,
    title: "محاضرة بالورشه",
    type: "workshop",
    time: "14:00",
    endTime: "16:00",
    place: "قاعة ورش العمل",
    notes: "ورشة عمل تفاعلية ختامية",
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
    title: "العاب",
    type: "free",
    time: "17:00",
    endTime: "18:00",
    place: "الملعب",
    notes: "أنشطة جماعية وتنافسية"
  },
  {
    id: "d3-a8",
    day: 3,
    title: "محاضرة",
    type: "lecture",
    time: "18:00",
    endTime: "20:00",
    place: "القاعة الرئيسية",
    notes: "المحاضرة الروحية الختامية للمؤتمر",
    linkedId: "d3-l1"
  },
  {
    id: "d3-a9",
    day: 3,
    title: "العاب",
    type: "free",
    time: "20:00",
    endTime: "21:00",
    place: "الملعب / الصالة",
    notes: ""
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
    title: "حفله الثمر",
    type: "free",
    time: "22:00",
    endTime: "23:59",
    place: "قاعة الاحتفالات الختامية",
    notes: "عروض وفقرات متنوعة ختامية"
  },

  /* ─── اليوم الرابع ─── */
  {
    id: "d4-a1",
    day: 4,
    title: "فطور",
    type: "meal",
    time: "08:30",
    endTime: "09:30",
    place: "المطعم",
    notes: ""
  },
  {
    id: "d4-a2",
    day: 4,
    title: "تسليم غرف وتجميع شنط",
    type: "other",
    time: "09:30",
    endTime: "10:30",
    place: "الغرف",
    notes: "الاستعداد للمغادرة والرحيل"
  },
  {
    id: "d4-a3",
    day: 4,
    title: "التحرك والعودة",
    type: "travel",
    time: "10:30",
    endTime: "12:30",
    place: "الأتوبيسات",
    notes: "سلامة العودة للمنزل بالمنشية"
  }
];
