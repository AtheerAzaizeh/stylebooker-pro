import { Phone, Clock, MapPin, Instagram, Facebook } from "lucide-react";
import { BARBERSHOP_CONFIG } from "@/lib/constants";
import logo from "@/assets/mea-barber-logo.jpg";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-card/50 border-t border-border/50 py-12 px-6"
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand Section */}
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img 
                src={logo} 
                alt="MEA-BARBER לוגו" 
                className="h-12 w-12 rounded-full object-cover border-2 border-primary/30"
                width="48"
                height="48"
                loading="lazy"
              />
              <div>
                <span className="text-lg font-serif font-bold text-foreground block">
                  MEA-BARBER
                </span>
                <span className="text-xs text-muted-foreground">
                  by Mohammad Eyad
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              מספרה מקצועית בדבוריה. חווית ספרות ברמה הגבוהה ביותר.
            </p>
          </div>

          {/* Contact Info */}
          <div className="text-center">
            <h3 className="font-serif font-bold text-foreground mb-4">צור קשר</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href={`tel:${BARBERSHOP_CONFIG.phone}`}
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  <span>{BARBERSHOP_CONFIG.phone}</span>
                </a>
              </li>
              <li className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>{BARBERSHOP_CONFIG.hours} א'-ו'</span>
              </li>
              <li>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BARBERSHOP_CONFIG.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>{BARBERSHOP_CONFIG.address}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-serif font-bold text-foreground mb-4">קישורים</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#our-story" className="text-muted-foreground hover:text-primary transition-colors">
                  הסיפור שלנו
                </a>
              </li>
              <li>
                <a href="#certifications" className="text-muted-foreground hover:text-primary transition-colors">
                  הסמכות
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  שאלות נפוצות
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  מדיניות פרטיות
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs">
            © {currentYear} MEA-BARBER. כל הזכויות שמורות.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              aria-label="עקוב אחרינו באינסטגרם"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </a>
            <a 
              href="#" 
              aria-label="עקוב אחרינו בפייסבוק"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
