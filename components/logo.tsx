import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string;
    iconContainerClassName?: string; // Kept for backwards compatibility if passed
    iconClassName?: string;          // Kept for backwards compatibility
    textClassName?: string;          // Kept for backwards compatibility
    href?: string;
}

export function Logo({ 
    className, 
    href = "/"
}: LogoProps = {}) {
    return (
        <Link href={href} className={cn("flex items-center shrink-0 w-fit transition-transform hover:opacity-90 hover:scale-[1.02]", className)}>
            <div className="relative flex items-center">
                <div className="absolute inset-0 bg-white/95 shadow-sm rounded-lg opacity-0 dark:opacity-100 transition-opacity pointer-events-none" style={{ margin: "-2px -8px" }} />
                <img 
                    src="/logo.webp" 
                    alt="GrabNext Logo" 
                    width={180}
                    height={48}
                    decoding="async"
                    className="relative z-10 h-10 sm:h-12 w-auto object-contain drop-shadow-sm border-none outline-none" 
                />
            </div>
        </Link>
    )
}
