import { useOnlineStatus } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

/**
 * Shows a small indicator when the user is offline
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-destructive text-destructive-foreground",
        "text-center text-sm py-2 px-4",
        "animate-in slide-in-from-top duration-300"
      )}
    >
      <span>📡 אין חיבור לאינטרנט - חלק מהתכונות לא יעבדו</span>
    </div>
  );
}
