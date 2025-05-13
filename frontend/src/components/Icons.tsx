import { LucideProps } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const Icons = {
  logo: ({ className, ...props }: LucideProps) => (
    <div className={cn("relative", className)}>
      <Image
        src="/3d3.png"
        alt="Logo"
        fill
        className="object-contain"
        {...props}
      />
    </div>
  ),
};
