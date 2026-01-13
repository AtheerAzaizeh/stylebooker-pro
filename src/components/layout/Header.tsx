import { Phone } from "lucide-react";
import { BARBERSHOP_CONFIG } from "@/lib/constants";
import logo from "@/assets/mea-barber-logo.jpg";

interface HeaderProps {
  onBookClick?: () => void;
}

export function Header({ onBookClick }: HeaderProps) {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      role="banner"
    >
      <nav 
        className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"
        role="navigation"
        aria-label="ניווט ראשי"
      >
        {/* Logo */}
        <a 
          href="/" 
          className="flex items-center gap-3"
          aria-label="MEA-BARBER - חזרה לעמוד הבית"
        >
          <img 
            src={logo} 
            alt="MEA-BARBER מספרה מקצועית בדבוריה - לוגו" 
            className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border-2 border-primary/30"
            width="56"
            height="56"
            loading="eager"
          />
          <div className="hidden sm:block">
            <span className="text-lg font-serif font-bold text-foreground">
              MEA-BARBER
            </span>
            <span className="block text-xs text-muted-foreground">
              by Mohammad Eyad
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <ul className="hidden md:flex items-center gap-6 text-sm" role="menubar">
          <li role="none">
            <a 
              href="#our-story" 
              className="text-muted-foreground hover:text-primary transition-colors"
              role="menuitem"
            >
              הסיפור שלנו
            </a>
          </li>
          <li role="none">
            <a 
              href="#certifications" 
              className="text-muted-foreground hover:text-primary transition-colors"
              role="menuitem"
            >
              הסמכות
            </a>
          </li>
          <li role="none">
            <a 
              href="#faq" 
              className="text-muted-foreground hover:text-primary transition-colors"
              role="menuitem"
            >
              שאלות נפוצות
            </a>
          </li>
        </ul>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <a 
            href={`tel:${BARBERSHOP_CONFIG.phone}`}
            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors md:hidden"
            aria-label="התקשר עכשיו"
          >
            <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
          </a>
          {onBookClick && (
            <button 
              onClick={onBookClick}
              className="btn-gold text-sm py-2 px-4"
            >
              קביעת תור
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
