# WP AI Site Builder

כלי AI שבונה אתרי וורדפרס בלחיצת כפתור לפי פרומפט. הלקוח מתקין תוסף על וורדפרס, מזין קוד רישיון, ומקבל אתר מלא אוטומטית.

## ארכיטקטורה

- **API (Render)** – Node.js + Express + Claude API
- **תוסף וורדפרס** – PHP, מתקין הלקוח על האתר שלו

## התקנה

### 1. API (Render)

```bash
cd api
cp .env.example .env
# ערוך .env והזן ANTHROPIC_API_KEY
npm install
npm start
```

**העלאה אוטומטית ל-Render:**
1. היכנס ל-[Render](https://render.com) → New → Web Service
2. חבר את ה-repo: https://github.com/stech-il/auto
3. Render יזהה אוטומטית את `render.yaml` (rootDir: api)
4. הוסף Environment Variables: `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD` (סיסמת ממשק הניהול)
5. Deploy – כל push ל-`main` מפעיל פריסה אוטומטית

**ממשק ניהול:** `https://your-api.onrender.com/admin` – התחבר עם ADMIN_PASSWORD, הנפק קודי רישיון ללקוחות

### 2. תוסף וורדפרס

1. העתק את תיקיית `wordpress-plugin/wp-ai-site-builder` ל-`wp-content/plugins/`
2. הפעל את התוסף מניהול התוספים
3. עבור ל-**AI Site Builder** בתפריט
4. הזן:
   - **API URL** – כתובת ה-API ב-Render (למשל `https://wp-ai-builder-api.onrender.com`)
   - **קוד רישיון** – הקוד שהלקוח מקבל ממך
5. לחץ "בדוק רישיון" ואז "שמור הגדרות"
6. הזן פרומפט ולחץ "בנה אתר בלחיצת כפתור"

### 3. פיתוח מקומי

ב-`.env` של ה-API:
```
LICENSE_MODE=skip
```

כך אימות הרישיון מדולג (מתאים לפיתוח).

## רישיונות

כרגע הרישיון נבדק בצד ה-API באופן בסיסי. להמשך:
- הוסף מסד נתונים (Supabase / PostgreSQL)
- טבלת `licenses` עם: `license_key`, `site_url`, `status`, `expires_at`
- עדכן `api/src/services/license.js` לבדיקה מול DB

## מבנה הפרויקט

```
├── api/                    # Backend ל-Render
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   │   ├── build.js
│   │   │   └── license.js
│   │   └── services/
│   │       ├── claude.js
│   │       └── license.js
│   ├── package.json
│   └── render.yaml
├── wordpress-plugin/
│   └── wp-ai-site-builder/  # תוסף וורדפרס
│       ├── wp-ai-site-builder.php
│       └── assets/
└── README.md
```
