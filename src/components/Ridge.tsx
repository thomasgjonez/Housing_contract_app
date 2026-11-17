// Mountain linework (the Wasatch front over Provo) painted behind the top of a page.
export function Ridge({ className = "ridge" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMin slice">
        <path d="M0 170 L160 95 L270 135 L430 40 L560 120 L690 80 L820 25 L960 110 L1080 70 L1230 130 L1340 90 L1440 120 L1440 0 L0 0 Z" fill="#dce8e1" />
        <path d="M0 195 L170 130 L290 165 L450 85 L580 155 L700 120 L830 70 L970 145 L1090 110 L1240 165 L1350 130 L1440 155" fill="none" stroke="#b9d0c4" strokeWidth="1.5" />
        <path d="M0 220 L180 165 L300 195 L470 130 L600 185 L720 160 L840 115 L980 180 L1100 150 L1250 195 L1360 170 L1440 190" fill="none" stroke="#c9dacf" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
