/* BONPYE App Logo
 * Player silhouette + "PYE" stacked vertically on the right
 */

interface AppLogoProps {
  className?: string;
  size?: number;
  dark?: boolean;
}

export default function AppLogo({ className = "", size = 80, dark = false }: AppLogoProps) {
  const textColor = dark ? "#ffffff" : "#111111";
  const bgColor = dark ? "#111111" : "#ffffff";

  return (
    <svg
      viewBox="0 0 240 180"
      width={size}
      height={size * (180 / 240)}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      {/* Clip: show only top ~72% of image (hides BONPYE text at bottom) */}
      <defs>
        <clipPath id="playerClip">
          <rect x="0" y="0" width="195" height="175" rx="0" />
        </clipPath>
      </defs>

      {/* Player silhouette image */}
      <image
        href="/images/bonpye_player.jpg"
        x="0"
        y="-15"
        width="210"
        height="220"
        clipPath="url(#playerClip)"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* "PYE" vertical text — stacked letters on right side */}
      <text
        x="218"
        y="40"
        fontSize="40"
        fontWeight="900"
        fontFamily="'Arial Black', Arial, sans-serif"
        fill={textColor}
        textAnchor="middle"
        letterSpacing="2"
      >
        P
      </text>
      <text
        x="218"
        y="90"
        fontSize="40"
        fontWeight="900"
        fontFamily="'Arial Black', Arial, sans-serif"
        fill={textColor}
        textAnchor="middle"
        letterSpacing="2"
      >
        Y
      </text>
      <text
        x="218"
        y="140"
        fontSize="40"
        fontWeight="900"
        fontFamily="'Arial Black', Arial, sans-serif"
        fill={textColor}
        textAnchor="middle"
        letterSpacing="2"
      >
        E
      </text>
    </svg>
  );
}
