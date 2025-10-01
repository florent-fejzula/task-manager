import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logout from "./Logout";

export default function SideMenu({ open, onClose }) {
  const location = useLocation();

  // close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navItem = (to, label) => (
    <Link
      to={to}
      onClick={onClose}
      className={`block rounded-xl px-4 py-3 text-base hover:bg-neutral-100
        ${location.pathname === to ? "bg-neutral-100 font-semibold" : ""}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-200
        ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Side menu"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] bg-white shadow-xl
        transition-transform duration-300 will-change-transform
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-neutral-100"
            aria-label="Close menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {navItem("/settings", "⚙️ Settings")}
          <div className="px-2 pt-1">
            <Logout />
          </div>
        </nav>
      </aside>
    </>
  );
}
