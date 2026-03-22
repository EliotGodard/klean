"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Thermometer,
  Truck,
  SprayCan,
  FlaskConical,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil", icon: LayoutDashboard },
  { href: "/temperature", label: "T°", icon: Thermometer },
  { href: "/livraisons", label: "Livraisons", icon: Truck },
  { href: "/nettoyage", label: "Nettoyage", icon: SprayCan },
  { href: "/analyse-surfaces", label: "Surfaces", icon: FlaskConical },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
      <div className="flex justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 text-xs transition-colors",
                active ? "text-green-600" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
