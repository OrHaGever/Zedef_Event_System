/**
 * Zedef Event Menu — Apps Script Backend
 * 1) Create a Google Sheet.
 * 2) Extensions → Apps Script → paste this file.
 * 3) Deploy → Web app → Execute as: Me, Who has access: Anyone.
 * 4) Put the deployment URL in index.html/admin.html if it changed.
 */

const SHEET_NAME = 'Events';
const ADMIN_EMAIL = 'zedefr@gmail.com';

const HEADERS = [
  'id','submitted_at','source','status','full_name','phone','email','company',
  'event_date','event_day','event_time','guest_count','kids_count','event_type','seating_style',
  'pricing_type','price_per_person','total_estimated',
  'has_projector','has_microphone','has_gifts_table','has_music','wine_option','inter_option',
  'salads','inter_dishes','main_dishes','side_dishes','diet_notes','allergies','notes','internal_notes',
  'email_body','raw_form_payload'
];

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (data.action === 'updateEvent') return json_({ ok: true, data: updateEvent_(data) });
    const event = normalizeEvent_(data);
    appendEvent_(event);
    sendEmail_(event);
    return json_({ ok: true, data: event });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'list';
    const data = action === 'list' ? listEvents_() : { ok: true };
    return json_(data, e.parameter && e.parameter.callback);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) }, e.parameter && e.parameter.callback);
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  const existing = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), HEADERS.length)).getValues()[0];
  if (existing[0] !== 'id') {
    sh.clear();
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function normalizeEvent_(data) {
  const date = data.event_date || data.eventDate || '';
  const calc = calc_(date, data);
  const equipment = Array.isArray(data.equipment) ? data.equipment : [];
  const id = data.github_submission_id || data.id || ('zedef-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
  return {
    id,
    submitted_at: data.submitted_at || new Date().toISOString(),
    source: data.source || 'github-menu-form',
    status: data.status || 'תפריט התקבל',
    full_name: data.full_name || data.fullName || '',
    phone: data.phone || '',
    email: data.email || '',
    company: data.company || '',
    event_date: date,
    event_day: calc.event_day,
    event_time: data.event_time || data.eventTime || '',
    guest_count: Number(data.guest_count || data.guestCount || 0),
    kids_count: Number(data.kids_count || data.kidsCount || 0),
    event_type: data.event_type || data.eventType || '',
    seating_style: data.seating_style || data.seatingStyle || '',
    pricing_type: calc.pricing_type,
    price_per_person: calc.price_per_person,
    total_estimated: calc.total_estimated,
    has_projector: bool_(data.has_projector) || equipment.indexOf('מקרן') > -1,
    has_microphone: bool_(data.has_microphone) || equipment.indexOf('מיקרופון') > -1,
    has_gifts_table: bool_(data.has_gifts_table) || equipment.indexOf('שולחן מתנות') > -1,
    has_music: bool_(data.has_music) || equipment.indexOf('מוזיקה') > -1,
    wine_option: bool_(data.wine_option),
    inter_option: bool_(data.inter_option),
    salads: join_(data.salads),
    inter_dishes: join_(data.inter_dishes),
    main_dishes: join_(data.main_dishes),
    side_dishes: join_(data.side_dishes),
    diet_notes: join_(data.diet_flags || data.diet_notes),
    allergies: data.allergies || '',
    notes: data.notes || '',
    internal_notes: data.internal_notes || '',
    email_body: data.email_body || '',
    raw_form_payload: JSON.stringify(data)
  };
}

function calc_(date, data) {
  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  let dow = 0;
  if (date) {
    const p = date.split('-').map(Number);
    dow = new Date(p[0], p[1] - 1, p[2]).getDay();
  }
  const weekend = dow === 5 || dow === 6;
  const baseAdult = weekend ? 310 : 265;
  const baseKid = weekend ? 220 : 180;
  const price = baseAdult + (bool_(data.wine_option) ? 30 : 0) + (bool_(data.inter_option) ? 40 : 0);
  const guests = Number(data.guest_count || data.guestCount || 0);
  const kids = Number(data.kids_count || data.kidsCount || 0);
  const adults = Math.max(guests - kids, 0);
  return {
    event_day: date ? 'יום ' + days[dow] : '',
    pricing_type: weekend ? 'שישי–שבת' : 'ראשון–חמישי',
    price_per_person: price,
    total_estimated: Math.round(((adults * price) + (kids * baseKid)) * 1.15)
  };
}

function appendEvent_(ev) {
  const sh = getSheet_();
  const ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat() : [];
  const idx = ids.indexOf(ev.id);
  const row = HEADERS.map(h => ev[h] === undefined ? '' : ev[h]);
  if (idx >= 0) sh.getRange(idx + 2, 1, 1, HEADERS.length).setValues([row]);
  else sh.appendRow(row);
  return ev;
}

function updateEvent_(data) {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  const id = data.id;
  for (let r = 1; r < values.length; r++) {
    if (values[r][0] === id) {
      if (data.status !== undefined) sh.getRange(r + 1, HEADERS.indexOf('status') + 1).setValue(data.status);
      if (data.internal_notes !== undefined) sh.getRange(r + 1, HEADERS.indexOf('internal_notes') + 1).setValue(data.internal_notes);
      return { id, updated: true };
    }
  }
  throw new Error('Event not found: ' + id);
}

function listEvents_() {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    try { obj.raw_form_payload = JSON.parse(obj.raw_form_payload || '{}'); } catch(e) {}
    return obj;
  });
}

function sendEmail_(ev) {
  const subject = 'בקשת אירוע חדשה — הצדף — ' + (ev.full_name || 'ללא שם') + ' — ' + (ev.event_date || 'ללא תאריך');
  const body = ev.email_body || buildEmailBody_(ev);
  MailApp.sendEmail({ to: ADMIN_EMAIL, subject, body });
}

function buildEmailBody_(ev) {
  return `בקשת אירוע חדשה — מסעדת הצדף\n\nשם: ${ev.full_name}\nטלפון: ${ev.phone}\nתאריך: ${ev.event_date} — ${ev.event_day}\nשעה: ${ev.event_time}\nמוזמנים: ${ev.guest_count}\nילדים: ${ev.kids_count}\nסוג אירוע: ${ev.event_type}\n\nסלטים: ${ev.salads}\nמנות ביניים: ${ev.inter_dishes}\nעיקריות: ${ev.main_dishes}\nתוספות: ${ev.side_dishes}\n\nאלרגיות: ${ev.allergies}\nהערות: ${ev.notes}\n\nסה״כ משוער כולל שירות: ₪${ev.total_estimated}`;
}

function join_(v) { return Array.isArray(v) ? v.join(' • ') : (v || ''); }
function bool_(v) { return v === true || v === 'true' || v === 'yes' || v === 'כן' || v === 1; }

function json_(obj, callback) {
  const text = callback ? `${callback}(${JSON.stringify(obj)});` : JSON.stringify(obj);
  return ContentService.createTextOutput(text).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
