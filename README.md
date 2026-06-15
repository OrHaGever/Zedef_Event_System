# Zedef Event Menu + Admin Dashboard

מערכת מוכנה להרצה ב-GitHub Pages:

- `index.html` — טופס בחירת תפריט האירוע הקיים, עם `github_submission_id`, `source`, `submitted_at`.
- `admin.html` — צד ניהולי מלא: KPI, טבלה/כרטיסיות, סינונים, מודאל אירוע, Import JSON ידני.
- `Code.gs` — Google Apps Script Backend: מקבל את הטפסים, שולח מייל, שומר ל-Google Sheet ומחזיר JSONP לדשבורד.

## פריסה מהירה

1. צור ריפו חדש ב-GitHub, למשל `Zedef_Event_System`.
2. העלה את `index.html` ואת `admin.html` לשורש הריפו.
3. Settings → Pages → Deploy from branch → main / root.
4. הטופס יהיה:
   `https://<username>.github.io/Zedef_Event_System/`
5. הניהול יהיה:
   `https://<username>.github.io/Zedef_Event_System/admin.html`

## חיבור אוטומטי לטפסים

הקובץ `index.html` כבר שולח לכתובת Apps Script הזו:

`https://script.google.com/macros/s/AKfycbz3-tRJ7FyKBA0_YczvMIIH4mNzId53Rp9kHnTg5_qgQlM8khRadGgXb-qEf2hIJh0KTg/exec`

כדי שהניהול יקבל נתונים אוטומטית ולא רק במייל:

1. פתח את Google Sheet שבו אתה רוצה לשמור אירועים.
2. Extensions → Apps Script.
3. הדבק את כל התוכן של `Code.gs`.
4. Deploy → New deployment → Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. קבל URL חדש.
8. החלף ב־`index.html` וב־`admin.html` את כתובת ה־Apps Script ל־URL החדש.

## מצב בלי Apps Script

גם בלי חיבור אוטומטי, `admin.html` עובד עם Import JSON ידני ושומר אירועים ב-localStorage של המחשב.
