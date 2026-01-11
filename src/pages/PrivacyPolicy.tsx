const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">מדיניות פרטיות</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">מבוא</h2>
            <p>
              אנו מכבדים את פרטיותך ומחויבים להגן על המידע האישי שלך. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך כאשר אתה משתמש באפליקציה שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">מידע שאנו אוספים</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>שם מלא - לזיהוי התור</li>
              <li>מספר טלפון - לאימות ושליחת תזכורות</li>
              <li>תאריך ושעת התור - לניהול הזמנות</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">כיצד אנו משתמשים במידע</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>לאימות זהותך באמצעות קוד SMS</li>
              <li>לשליחת אישורי תור ותזכורות</li>
              <li>לניהול ותיאום התורים שלך</li>
              <li>ליצירת קשר במקרה של שינויים או ביטולים</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">שמירת המידע</h2>
            <p>
              המידע שלך נשמר באופן מאובטח בשרתים מוגנים. אנו שומרים את המידע רק כל עוד הוא נחוץ לספק לך את השירותים שלנו.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">שיתוף מידע</h2>
            <p>
              אנו לא מוכרים, סוחרים או מעבירים את המידע האישי שלך לצדדים שלישיים. המידע משמש אך ורק לצורך מתן השירות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">הזכויות שלך</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>לבקש גישה למידע האישי שלך</li>
              <li>לבקש תיקון מידע שגוי</li>
              <li>לבקש מחיקת המידע שלך</li>
              <li>לבטל תורים בכל עת</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">יצירת קשר</h2>
            <p>
              לשאלות בנוגע למדיניות הפרטיות שלנו, ניתן ליצור קשר דרך האפליקציה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">עדכונים למדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים יפורסמו בעמוד זה.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              עדכון אחרון: ינואר 2026
            </p>
          </section>
        </div>

        <div className="mt-8">
          <a href="/" className="text-primary hover:underline">
            → חזרה לעמוד הראשי
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;