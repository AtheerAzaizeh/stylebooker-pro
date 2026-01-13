import { Award, Shield, CheckCircle } from "lucide-react";

// Placeholder for user's certificates - they can upload and add them here
const PLACEHOLDER_CERTIFICATES = [
  {
    id: 1,
    title: "תעודת ספרות מקצועית",
    issuer: "משרד העבודה",
    description: "הסמכה רשמית בספרות גברים",
    icon: Award,
  },
  {
    id: 2,
    title: "השתלמות סטיילינג מתקדם",
    issuer: "אקדמיית עיצוב שיער",
    description: "טכניקות חיתוך וסטיילינג מתקדמות",
    icon: Shield,
  },
  {
    id: 3,
    title: "קורס היגיינה ובטיחות",
    issuer: "משרד הבריאות",
    description: "תקני בטיחות והיגיינה במספרות",
    icon: CheckCircle,
  },
];

export function Certifications() {
  return (
    <section 
      id="certifications" 
      aria-labelledby="certifications-heading"
      className="py-20 px-6 bg-card/30"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-px w-12 bg-primary/50" aria-hidden="true" />
            <Award className="w-6 h-6 text-primary" aria-hidden="true" />
            <span className="h-px w-12 bg-primary/50" aria-hidden="true" />
          </div>
          <h2 
            id="certifications-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4"
          >
            הסמכות ותעודות
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            מחויבות למקצועיות ולמצוינות - הסמכות רשמיות המעידות על רמת השירות הגבוהה
          </p>
        </header>

        {/* Certificates Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          role="list"
          aria-label="רשימת תעודות והסמכות"
        >
          {PLACEHOLDER_CERTIFICATES.map((cert) => (
            <article 
              key={cert.id}
              role="listitem"
              className="glass-card p-8 text-center hover:border-primary/50 transition-all duration-300 group"
            >
              {/* Certificate Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <cert.icon className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              
              {/* Certificate Details */}
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                {cert.title}
              </h3>
              <p className="text-primary font-medium mb-3">
                {cert.issuer}
              </p>
              <p className="text-muted-foreground text-sm">
                {cert.description}
              </p>
            </article>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>כל התעודות מאומתות ועומדות בתקנים הרשמיים</span>
          </p>
        </div>
      </div>
    </section>
  );
}
