import { Scissors } from "lucide-react";

export function OurStory() {
  return (
    <section 
      id="our-story" 
      aria-labelledby="story-heading"
      className="py-20 px-6 bg-background"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-px w-12 bg-primary/50" aria-hidden="true" />
            <Scissors className="w-6 h-6 text-primary" aria-hidden="true" />
            <span className="h-px w-12 bg-primary/50" aria-hidden="true" />
          </div>
          <h2 
            id="story-heading" 
            className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4"
          >
            הסיפור שלנו
          </h2>
          <p className="text-muted-foreground text-lg">
            המסע שהוביל לפתיחת MEA-BARBER
          </p>
        </header>

        {/* Story Content */}
        <article className="glass-card p-8 md:p-12 space-y-6 text-right">
          <p className="text-foreground/90 leading-relaxed text-lg">
            שלום, אני <strong className="text-primary">מוחמד איאד</strong>, 
            והתשוקה שלי לספרות התחילה עוד בגיל צעיר. מילדות נמשכתי לאומנות 
            עיצוב השיער, וכשגדלתי הבנתי שזה לא רק מקצוע – זו שליחות.
          </p>
          
          <p className="text-foreground/90 leading-relaxed text-lg">
            אחרי שנים של למידה, התמחות והשתלמויות מקצועיות, פתחתי את 
            <strong className="text-primary"> MEA-BARBER</strong> בדבוריה 
            עם חזון אחד ברור: להעניק לכל לקוח חוויה יוצאת דופן, 
            לא רק תספורת.
          </p>

          <p className="text-foreground/90 leading-relaxed text-lg">
            אני מאמין שתספורת טובה יכולה לשנות את היום, להעלות ביטחון עצמי, 
            ולתת תחושה של רעננות. לכן אני משקיע בכל לקוח את מלוא תשומת הלב, 
            מקשיב לצרכים, ומתאים את הסגנון בדיוק לאישיות.
          </p>

          <blockquote className="border-r-4 border-primary pr-6 py-4 my-8 bg-primary/5 rounded-l-lg">
            <p className="text-xl font-serif text-primary italic">
              "לא מדובר רק בתספורת – מדובר בחוויה. בכבוד. ביחס אישי."
            </p>
            <footer className="mt-2 text-muted-foreground">
              — מוחמד איאד, מייסד MEA-BARBER
            </footer>
          </blockquote>

          <p className="text-foreground/90 leading-relaxed text-lg">
            המספרה שלי היא מקום שבו מסורת פוגשת חדשנות, שבו כל לקוח מרגיש 
            כמו VIP. אני מזמין אותך להגיע, להתנסות, ולהצטרף למשפחת MEA-BARBER.
          </p>
        </article>
      </div>
    </section>
  );
}
