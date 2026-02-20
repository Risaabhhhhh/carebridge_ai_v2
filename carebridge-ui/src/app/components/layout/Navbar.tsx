"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "PrePurchase", href: "/prepurchase" },
    { name: "Compare", href: "/compare" },
    { name: "Post-Rejection", href: "/audit" },
  ];

  return (
    <header className="w-full fixed top-0 z-50 bg-ivory/90 backdrop-blur-sm border-b border-stone/40">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="font-serif text-xl tracking-wide">
          CareBridge AI
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative text-sm tracking-wide transition ${
                  isActive
                    ? "text-sage"
                    : "text-charcoal/80 hover:text-sage"
                }`}
              >
                {item.name}

                {/* Underline Animation */}
                <span
                  className={`absolute left-0 -bottom-1 h-px bg-sage transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <Link
          href="/prepurchase"
          className="hidden md:inline-block px-5 py-2 border border-sage text-sage text-sm rounded-md hover:bg-sage hover:text-white transition"
        >
          Analyze
        </Link>

      </nav>
    </header>
  );
}
