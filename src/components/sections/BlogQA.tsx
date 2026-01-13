import { HelpCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// FAQ data - structured for SEO (will be used in schema markup)
export const FAQ_DATA = [
  {
    question: "מהן שעות הפעילות של המספרה?",
    answer: "המספרה פתוחה מיום ראשון עד יום שישי, בין השעות 10:00-17:00. יום שני המספרה סגורה.",
  },
  {
    question: "האם צריך לקבוע תור מראש?",
    answer: "כן, אנו ממליצים בחום לקבוע תור מראש דרך האתר. זה מבטיח שתקבלו את השירות הטוב ביותר ללא המתנה.",
  },
  {
    question: "מה המחיר לתספורת?",
    answer: "מחיר התספורת הוא 50 ש\"ח. המחיר כולל שירות מקצועי, ייעוץ סגנון ושטיפה.",
  },
  {
    question: "כמה זמן לוקחת תספורת?",
    answer: "תספורת אורכת בממוצע 40 דקות. אנחנו מקדישים זמן איכותי לכל לקוח כדי להבטיח תוצאה מושלמת.",
  },
  {
    question: "האם אפשר לבטל או לשנות תור?",
    answer: "כן, ניתן לבטל או לשנות תור עד 3 שעות לפני המועד המתוכנן. פשוט צרו איתנו קשר בטלפון.",
  },
  {
    question: "איפה המספרה ממוקמת?",
    answer: "המספרה ממוקמת בכתובת אלסעדיה 48, דבוריה. יש חניה זמינה בקרבת מקום.",
  },
  {
    question: "האם יש שירותים נוספים מלבד תספורת?",
    answer: "בנוסף לתספורות, אנו מציעים עיצוב זקן, גילוח מסורתי, וטיפולי שיער. צרו קשר לפרטים נוספים.",
  },
  {
    question: "האם המספרה מתאימה לילדים?",
    answer: "בהחלט! אנחנו מקבלים לקוחות בכל הגילאים ויודעים ליצור אווירה נעימה גם לילדים.",
  },
];

export function BlogQA() {
  return (
    <section 
      id="faq" 
      aria-labelledby="faq-heading"
      className="py-20 px-6 bg-background"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-px w-12 bg-primary/50" aria-hidden="true" />
            <HelpCircle className="w-6 h-6 text-primary" aria-hidden="true" />
            <span className="h-px w-12 bg-primary/50" aria-hidden="true" />
          </div>
          <h2 
            id="faq-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4"
          >
            שאלות נפוצות
          </h2>
          <p className="text-muted-foreground text-lg">
            כל מה שצריך לדעת לפני הביקור במספרה
          </p>
        </header>

        {/* FAQ Accordion */}
        <div className="glass-card p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-b border-border/50 last:border-0"
              >
                <AccordionTrigger className="text-right text-foreground hover:text-primary py-4 text-lg font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            לא מצאת תשובה לשאלה שלך?
          </p>
          <a 
            href="tel:0540000000" 
            className="btn-gold inline-block"
          >
            צור קשר עכשיו
          </a>
        </div>
      </div>
    </section>
  );
}
