"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "Analyze Policy",    href: "/prepurchase" },
  { name: "Audit Rejection",   href: "/audit" },
  { name: "Compare Policies",  href: "/compare" },
  { name: "Learn", href: "/learn" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Mono:wght@300;400&display=swap');

        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 48px;
          height: 68px;
          backdrop-filter: blur(12px);
          background: rgba(250, 248, 243, 0.92);
          border-bottom: 1px solid rgba(221, 216, 206, 0.8);
        }

        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #2d5a3d;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 40px;
          list-style: none;
          margin: 0; padding: 0;
        }

        .nav-link {
          position: relative;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          color: #8fa896;
          transition: color 0.2s;
          padding-bottom: 2px;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          height: 1px;
          background: #2d5a3d;
          width: 0;
          transition: width 0.25s ease;
        }

        .nav-link:hover        { color: #2d5a3d; }
        .nav-link:hover::after { width: 100%; }

        .nav-link.active        { color: #2d5a3d; }
        .nav-link.active::after { width: 100%; }

        .nav-cta {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          background: #2d5a3d;
          color: white;
          padding: 10px 22px;
          border-radius: 2px;
          transition: background 0.2s;
        }
        .nav-cta:hover { background: #4a7c5f; }

        /* Mobile */
        .nav-mobile-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px;
        }
        .nav-mobile-toggle span {
          display: block;
          width: 22px; height: 1px;
          background: #2d5a3d;
          transition: all 0.2s;
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 24px; }
          .nav-links, .nav-cta { display: none; }
          .nav-mobile-toggle { display: flex; }
        }
      `}</style>

      <header className="navbar">
        <Link href="/" className="nav-logo">CareBridge</Link>

        <nav>
          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? "active" : ""}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/prepurchase" className="nav-cta">
          Get Started
        </Link>

        {/* Mobile toggle — wire up state if needed */}
        <button className="nav-mobile-toggle" aria-label="Menu">
          <span /><span /><span />
        </button>
      </header>
    </>
  );
}