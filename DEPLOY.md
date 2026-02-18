# פריסה ל-Render (Deploy)

## התקנה אוטומטית – חיבור GitHub

1. **היכנס ל-[Render.com](https://render.com)** ולחץ **New** → **Web Service**

2. **חבר את ה-repo:**
   - בחר **Connect a repository**
   - חפש או הזן: `stech-il/auto`
   - אשר חיבור

3. **Render יקרא אוטומטית את `render.yaml`:**
   - Root Directory: `api`
   - Build: `npm install`
   - Start: `npm start`

4. **הוסף Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `ANTHROPIC_API_KEY` | המפתח שלך מ-[Anthropic Console](https://console.anthropic.com/) |
   | `LICENSE_MODE` | `strict` (או `skip` לפיתוח) |

5. **Create Web Service** – הפריסה תתחיל

6. **Auto Deploy:** כל `git push` ל-branch `main` יפעיל פריסה אוטומטית חדשה

---

## כתובת ה-API

לאחר הפריסה תקבל URL כמו:
```
https://wp-ai-builder-api.onrender.com
```

השתמש בכתובת זו בשדה **API URL** בתוסף הוורדפרס.
