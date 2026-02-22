"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "Analyze Policy",   href: "/prepurchase" },
  { name: "Audit Rejection",  href: "/audit" },
  { name: "Compare Policies", href: "/compare" },
  {name : "learn", href: "/learn"},
  { name: "Get Help",         href: "/support" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Mono:wght@400;500&display=swap');
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 52px; height: 70px;
          backdrop-filter: blur(16px);
          background: rgba(15, 21, 18, 0.94);
          border-bottom: 1px solid rgba(45, 90, 61, 0.4);
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600; letter-spacing: 0.03em;
          color: #e8f0ea; text-decoration: none;
        }
        .nav-logo span { color: #5aad74; }
        .nav-links {
          display: flex; align-items: center; gap: 40px;
          list-style: none; margin: 0; padding: 0;
        }
        .nav-link {
          position: relative;
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          text-decoration: none; color: #7aab8a;
          transition: color 0.2s; padding-bottom: 3px;
        }
        .nav-link::after {
          content: ''; position: absolute;
          bottom: -2px; left: 0; height: 1.5px;
          background: #5aad74; width: 0;
          transition: width 0.25s ease;
        }
        .nav-link:hover        { color: #d4ead9; }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active        { color: #d4ead9; }
        .nav-link.active::after { width: 100%; }
        /* "Get Help" gets a subtle accent treatment */
        .nav-link.help-link { color: #c8a84a; }
        .nav-link.help-link::after { background: #c8a84a; }
        .nav-link.help-link:hover { color: #e8d080; }
        .nav-link.help-link.active { color: #e8d080; }
        .nav-cta {
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          text-decoration: none;
          background: #1e5c2e; color: #e8f0ea;
          padding: 11px 24px; border-radius: 2px;
          transition: background 0.2s;
          border: 1px solid #3d7a52;
        }
        .nav-cta:hover { background: #2d7a42; }
        .nav-mobile-toggle {
          display: none; flex-direction: column; gap: 5px;
          cursor: pointer; background: none; border: none; padding: 4px;
        }
        .nav-mobile-toggle span {
          display: block; width: 22px; height: 1.5px;
          background: #7aab8a; transition: all 0.2s;
        }
        @media (max-width: 768px) {
          .navbar { padding: 0 24px; }
          .nav-links, .nav-cta { display: none; }
          .nav-mobile-toggle { display: flex; }
        }
      `}</style>

      <header className="navbar">
        <Link href="/" className="nav-logo">Care<span>Bridge</span></Link>
        <nav>
          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link ${item.href === "/support" ? "help-link" : ""} ${pathname === item.href ? "active" : ""}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/prepurchase" className="nav-cta">Get Started</Link>
        <button className="nav-mobile-toggle" aria-label="Menu">
          <span /><span /><span />
        </button>
      </header>
    </>
  );
}