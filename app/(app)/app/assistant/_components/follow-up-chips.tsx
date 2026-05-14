"use client";

import * as React from "react";

// Generic follow-ups shown when backend doesn't provide specific ones
const GENERIC_FOLLOW_UPS = [
  "Daha fazla detay ver",
  "3 aylık plan yap",
  "Tabloyla göster",
  "Bütçeye uygula",
];

interface FollowUpChipsProps {
  followUps?: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function FollowUpChips({ followUps, onSelect, disabled }: FollowUpChipsProps) {
  const chips = followUps && followUps.length > 0 ? followUps.slice(0, 3) : GENERIC_FOLLOW_UPS.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(chip)}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#10B981]/40 text-[11px] font-medium text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
