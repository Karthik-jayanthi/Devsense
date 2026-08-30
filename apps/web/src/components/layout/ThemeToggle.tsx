"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("devsense-theme");
    if (saved === "light") {
      setLight(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("devsense-theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      aria-label="Toggle theme"
    >
      {light ? <Moon size={17} strokeWidth={1.75} /> : <Sun size={17} strokeWidth={1.75} />}
    </button>
  );
}
