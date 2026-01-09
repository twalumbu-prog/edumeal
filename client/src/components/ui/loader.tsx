import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoaderProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    text?: string;
}

export function Loader({ className, size = "md", text = "Loading..." }: LoaderProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-4 min-h-[200px]", className)}>
            <div className="relative">
                <motion.div
                    className={cn(
                        "rounded-full border-4 border-primary/20",
                        sizeClasses[size]
                    )}
                />
                <motion.div
                    className={cn(
                        "absolute top-0 left-0 rounded-full border-4 border-transparent border-t-primary",
                        sizeClasses[size]
                    )}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.div
                    className={cn(
                        "absolute inset-0 m-auto bg-primary/10 rounded-full",
                        size === "lg" ? "w-8 h-8" : size === "md" ? "w-5 h-5" : "w-3 h-3"
                    )}
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>
            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground text-sm font-medium animate-pulse"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
}
