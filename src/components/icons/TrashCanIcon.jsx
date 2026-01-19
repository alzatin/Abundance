// TrashCanIcon.jsx
import React from "react";

const TrashCanIcon = ({ size = 16, color = "#e57373" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect
      x="5"
      y="7"
      width="10"
      height="8"
      rx="2"
      fill={color}
      fillOpacity="0.15"
    />
    <rect x="8" y="9" width="1.5" height="4" rx="0.75" fill={color} />
    <rect x="10.5" y="9" width="1.5" height="4" rx="0.75" fill={color} />
    <rect x="7" y="5" width="6" height="2" rx="1" fill={color} />
    <rect
      x="6"
      y="4"
      width="8"
      height="2"
      rx="1"
      fill={color}
      fillOpacity="0.5"
    />
    <rect x="9" y="2" width="2" height="2" rx="1" fill={color} />
  </svg>
);

export default TrashCanIcon;
