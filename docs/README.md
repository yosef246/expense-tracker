# מעקב הוצאות אישי 💰

אפליקציית מובייל אישית למעקב אחר הוצאות יומיות.  
**אין שרת, אין התחברות, אין סנכרון** — כל הנתונים נשמרים מקומית בטלפון.

Built with React Native + Expo | עברית RTL | מטבע: ₪

---

## דרישות מקדימות

- Node.js 18+
- npm
- אפליקציית **Expo Go** בטלפון ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

## התקנה

```bash
cd frontend
npm install
npx expo install expo-linear-gradient expo-status-bar expo-updates @react-native-community/datetimepicker
```

---

## הרצה

### בדפדפן (לבדיקה מהירה)
```bash
cd frontend
npx expo start --web
```
פותח בכתובת: `http://localhost:8081`

### בטלפון דרך Expo Go (חוויה מלאה)
```bash
cd frontend
npx expo start
```
1. סרוק את ה-QR שמופיע בטרמינל
2. **iPhone:** פתח מצלמה → כוון ל-QR → לחץ על ההתראה
3. **Android:** פתח Expo Go → "Scan QR code" → סרוק
4. הטלפון והמחשב חייבים להיות על **אותה רשת WiFi**

> **הפעלה ראשונה:** האפליקציה תיטען מחדש פעם אחת כדי להפעיל עברית RTL — זה תקין לחלוטין.

---

## מסכים

| מסך | תיאור |
|---|---|
| 🏠 בית | תקציב חודשי, בר התקדמות, 5 הוצאות אחרונות |
| ➕ הוספת הוצאה | סכום + תיאור + תאריך, שמירה ב-AsyncStorage |
| ⚙️ הגדרות | תקציב חודשי + יום תחילת חודש (1 או 15) |
| 📊 היסטוריה | ניווט בין חודשים, סיכום, תובנות |

---

## מבנה הפרויקט

```
frontend/
  App.tsx                   ← נקודת כניסה + הגדרת RTL
  src/
    screens/                ← 4 מסכים
    components/             ← רכיבים משותפים (ProgressBar, ExpenseItem, ...)
    hooks/                  ← useExpenses, useSettings
    storage/                ← גישה ל-AsyncStorage
    utils/                  ← formatCurrency, getBudgetPeriod, ...
    constants/              ← צבעים, טיפוגרפיה
    navigation/             ← AppNavigator (Stack)
    types/                  ← TypeScript interfaces
```

---

## מודל הנתונים (AsyncStorage)

```typescript
// מפתח: "expenses"
{ id, amount, description, date: "YYYY-MM-DD", createdAt: ISO }

// מפתח: "settings"
{ monthlyBudget: 2000, monthStartDay: 1 | 15 }
```

---

## הגבלות ידועות

- ניתן לפתוח מספר שורות מחיקה בו-זמנית (אין נעילה לשורה אחת)
- הגדרות תקציב: קלט עם אגורות לא נתמך (מספרים שלמים בלבד)
- אין גיבוי — אם מוחקים את האפליקציה, הנתונים נמחקים
