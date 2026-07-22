/**
 * ════════════════════════════════════════════════════════════════════════
 *  Google Apps Script (Code.gs) - قاعدة بيانات مؤتمر الشباب 2026
 * ════════════════════════════════════════════════════════════════════════
 * 
 *  طريقة الاستخدام:
 *  1. افتح Google Sheet جديد باسم: "مؤتمر الشباب 2026 - قاعدة البيانات"
 *  2. من القائمة العلوية اختر: التمديدات (Extensions) -> Apps Script
 *  3. انسخ هذا الكود بالكامل واستبدل أي كود موجود في Code.gs
 *  4. احفظ الملف (Ctrl + S)
 *  5. اضغط على زر "نشر" (Deploy) -> "تطبيق ويب جديد" (New deployment)
 *  6. في خانة "من يحق له الوصول" (Who has access) اختر: "أي شخص" (Anyone)
 *  7. اضغط Deploy وانخس رابط Web App URL وضعه في لوحة تحكم admin.html!
 */

// إذا قمت بإنشاء السكربت بشكل مستقل من script.google.com، يمكنك وضع ID الشيت هنا (الموجود في رابط الشيت)
const SPREADSHEET_ID = ''; 

// مفتاح الأمان لحماية العمليات الحساسة (الحذف، التعديل، الاستيراد الشامل)
// يرجى مطابقة هذا المفتاح في لوحة التحكم (admin.html)
const SECURITY_TOKEN = 'YC2026_SECURE_TOKEN_8921';

const SHEET_NAME = 'Attendees';
const HEADERS = ['الاسم', 'المجموعة', 'النقاط', 'الغرفة', 'الاتوبيس', 'المقعد', 'رايك فى المؤتمر', 'ترشيح الرحلة الجاية'];

function getOrCreateSheet() {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}
  
  if (!ss && SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {}
  }
  
  if (!ss) {
    throw new Error("تعذر الوصول لجدول البيانات. يرجى فتح السكربت من داخل Google Sheet من (التمديدات -> Apps Script) أو كتابة SPREADSHEET_ID في الكود.");
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#06b6d4').setFontColor('#ffffff');
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const action = (e && e.parameter && e.parameter.action) || 'get';

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON(action === 'getScores' ? [] : { status: 'success', data: [] });
    }

    if (action === 'getScores') {
      const groupScores = {};
      for (let i = 1; i < data.length; i++) {
        const groupName = String(data[i][1] || '').trim();
        const pts = Number(data[i][2] || 0);
        if (groupName && !groupScores[groupName]) {
          groupScores[groupName] = pts;
        }
      }
      const scoresArr = [
        { id: 'g1', name: 'مجموعة 1', points: groupScores['مجموعة 1'] || 0, score: groupScores['مجموعة 1'] || 0 },
        { id: 'g2', name: 'مجموعة 2', points: groupScores['مجموعة 2'] || 0, score: groupScores['مجموعة 2'] || 0 },
        { id: 'g3', name: 'مجموعة 3', points: groupScores['مجموعة 3'] || 0, score: groupScores['مجموعة 3'] || 0 },
        { id: 'g4', name: 'مجموعة 4', points: groupScores['مجموعة 4'] || 0, score: groupScores['مجموعة 4'] || 0 }
      ];
      return responseJSON(scoresArr);
    }
    
    const items = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1] && !row[2]) continue; // تجاهل الصفوف الفارغة
      items.push({
        rowIndex: i + 1,
        name: String(row[0] || ''),
        group: String(row[1] || ''),
        points: Number(row[2] || 0),
        room: String(row[3] || ''),
        bus: String(row[4] || ''),
        seat: String(row[5] || ''),
        feedback: String(row[6] || ''),
        nextTrip: String(row[7] || '')
      });
    }
    
    return responseJSON({ status: 'success', data: items });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    
    const action = body.action || 'get';
    
    if (action === 'get') {
      return doGet(e);
    }

    // فحص التوكين الأمني للعمليات الإدارية
    if (action !== 'addFeedback') {
      if (SECURITY_TOKEN && body.token !== SECURITY_TOKEN) {
        return responseJSON({ status: 'error', message: 'غير مصرح: مفتاح الأمان (Security Token) غير صحيح أو مفقود.' });
      }
    }

    if (action === 'updateGroupPoints') {
      const groupName = String(body.group || '').trim();
      const points = Number(body.points || 0);
      if (!groupName) return responseJSON({ status: 'error', message: 'اسم المجموعة مطلوب' });

      const data = sheet.getDataRange().getValues();
      let updatedCount = 0;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][1]).trim().toLowerCase() === groupName.toLowerCase()) {
          sheet.getRange(i + 1, 3).setValue(points); // تحديث عمود النقاط C
          updatedCount++;
        }
      }
      return responseJSON({ status: 'success', message: `تم تحديث نقاط ${groupName} إلى ${points} نقطة لـ ${updatedCount} مشترك` });
    }
    
    if (action === 'add' || action === 'update') {
      const name = String(body.name || '').trim();
      if (!name) return responseJSON({ status: 'error', message: 'الاسم مطلوب' });
      
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }
      
      const rowValues = [
        name,
        body.group !== undefined ? body.group : '',
        body.points !== undefined ? Number(body.points) : 0,
        body.room !== undefined ? body.room : '',
        body.bus !== undefined ? body.bus : '',
        body.seat !== undefined ? body.seat : '',
        body.feedback !== undefined ? body.feedback : '',
        body.nextTrip !== undefined ? body.nextTrip : ''
      ];
      
      if (foundIndex > 0) {
        // تحديث صف موجود
        const existingRow = data[foundIndex - 1];
        if (body.group === undefined) rowValues[1] = existingRow[1];
        if (body.points === undefined) rowValues[2] = existingRow[2];
        if (body.room === undefined) rowValues[3] = existingRow[3];
        if (body.bus === undefined) rowValues[4] = existingRow[4];
        if (body.seat === undefined) rowValues[5] = existingRow[5];
        if (body.feedback === undefined) rowValues[6] = existingRow[6];
        if (body.nextTrip === undefined) rowValues[7] = existingRow[7];
        
        sheet.getRange(foundIndex, 1, 1, HEADERS.length).setValues([rowValues]);
        return responseJSON({ status: 'success', message: 'تم تحديث البيانات بنجاح', action: 'updated', name });
      } else {
        // إضافة صف جديد
        sheet.appendRow(rowValues);
        return responseJSON({ status: 'success', message: 'تم إضافة المشترك بنجاح', action: 'added', name });
      }
    }
    
    if (action === 'addFeedback') {
      const name = String(body.name || 'زائر').trim();
      const feedback = String(body.feedback || '').trim();
      const nextTrip = String(body.nextTrip || '').trim();
      
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex > 0) {
        if (feedback) sheet.getRange(foundIndex, 7).setValue(feedback);
        if (nextTrip) sheet.getRange(foundIndex, 8).setValue(nextTrip);
        return responseJSON({ status: 'success', message: 'تم تسجيل التقييم بنجاح' });
      } else {
        sheet.appendRow([name, '', 0, '', '', '', feedback, nextTrip]);
        return responseJSON({ status: 'success', message: 'تم إضافة التقييم بنجاح' });
      }
    }
    
    if (action === 'delete') {
      const name = String(body.name || '').trim();
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) {
          sheet.deleteRow(i + 1);
          return responseJSON({ status: 'success', message: 'تم حذف المشترك بنجاح' });
        }
      }
      return responseJSON({ status: 'error', message: 'المشترك غير موجود' });
    }
    
    if (action === 'bulkImport') {
      const items = body.items || [];
      if (!Array.isArray(items)) return responseJSON({ status: 'error', message: 'قائمة غير صالحة' });
      
      sheet.clearContents();
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#06b6d4').setFontColor('#ffffff');
      
      const rows = items.map(item => [
        item.name || '',
        item.group || '',
        Number(item.points || 0),
        item.room || '',
        item.bus || '',
        item.seat || '',
        item.feedback || '',
        item.nextTrip || ''
      ]);
      
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }
      return responseJSON({ status: 'success', message: `تم استيراد ${rows.length} مشترك بنجاح` });
    }
    
    return responseJSON({ status: 'error', message: 'إجراء غير معروف' });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
