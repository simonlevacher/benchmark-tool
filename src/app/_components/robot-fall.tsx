export function RobotFall() {
  return (
    <div
      style={{
        animation: "robot-fall 0.9s cubic-bezier(0.4, 0, 1, 1) 0.4s both",
        transformOrigin: "bottom left",
        display: "inline-block",
      }}
    >
      <svg viewBox="0 0 44 62" width="44" height="62" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antenna */}
        <rect x="21" y="0" width="2" height="8" rx="1" fill="black" />
        <circle cx="22" cy="1.5" r="2.5" fill="black" />
        {/* Head */}
        <rect x="6" y="8" width="32" height="24" rx="4" fill="black" />
        {/* Normal eyes */}
        <g style={{ animation: "eyes-normal 0.9s 0.4s both" }}>
          <circle cx="16" cy="20" r="3" fill="white" />
          <circle cx="28" cy="20" r="3" fill="white" />
        </g>
        {/* Dead eyes (X) */}
        <g style={{ animation: "eyes-dead 0.9s 0.4s both" }}>
          <line x1="13" y1="17" x2="19" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="19" y1="17" x2="13" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="25" y1="17" x2="31" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="31" y1="17" x2="25" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Body */}
        <rect x="10" y="34" width="24" height="18" rx="3" fill="black" />
        {/* Chest indicator */}
        <circle cx="22" cy="43" r="2.5" fill="white" opacity="0.35" />
        {/* Arms */}
        <rect x="1" y="35" width="8" height="4" rx="2" fill="black" />
        <rect x="35" y="35" width="8" height="4" rx="2" fill="black" />
        {/* Legs */}
        <rect x="13" y="53" width="7" height="9" rx="2" fill="black" />
        <rect x="24" y="53" width="7" height="9" rx="2" fill="black" />
      </svg>
    </div>
  );
}
