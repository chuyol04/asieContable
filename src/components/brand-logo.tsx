import Image from "next/image";

import phantoLogo from "../../docs/referencias-ui/PHANTOLOGO.png";

export function BrandLogo({ className = "h-12 w-36" }: { className?: string }) {
  return <span className={`relative block shrink-0 overflow-hidden bg-white ${className}`}>
    <Image alt="PHANTO" className="absolute left-1/2 top-1/2 h-auto w-[200%] max-w-none -translate-x-1/2 -translate-y-1/2" loading="eager" src={phantoLogo} />
  </span>;
}
