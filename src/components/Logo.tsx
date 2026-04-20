import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export const Logo = ({ className, alt = "ABN News" }: { className?: string; alt?: string }) => (
  <img
    src={logo}
    alt={alt}
    className={cn("rounded-sm object-cover shrink-0", className)}
  />
);
