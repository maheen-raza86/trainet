/**
 * BrandLogo — reusable TRAINET logo + wordmark component.
 *
 * Layout: always stacked — icon above text, centred.
 * The icon is the dominant element; TRAINET text is secondary.
 *
 * Sizes:
 *   sm  — icon 42px,  text text-xs   — footer / sidebar collapsed
 *   md  — icon 56px,  text text-sm   — navbar / sidebar expanded
 *   lg  — icon 88px,  text text-xl   — auth pages
 *   xl  — icon 104px, text text-2xl  — large splash / hero
 *
 * Black-padding crop:
 *   overflow-hidden + scale(1.35) zooms the symbol to fill the box,
 *   hiding the dark border baked into the PNG.
 */

import Image from 'next/image';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  size?: LogoSize;
  /** Override text colour. Defaults to white for dark backgrounds. */
  textClassName?: string;
  /** Show icon only — hides the TRAINET wordmark (collapsed sidebar). */
  iconOnly?: boolean;
  className?: string;
}

const SIZE_MAP: Record<LogoSize, { icon: number; text: string }> = {
  sm: { icon: 42,  text: 'text-xs  font-black tracking-tight' },
  md: { icon: 56,  text: 'text-sm  font-black tracking-tight' },
  lg: { icon: 88,  text: 'text-xl  font-black tracking-tight' },
  xl: { icon: 104, text: 'text-2xl font-black tracking-tight' },
};

export default function BrandLogo({
  size = 'md',
  textClassName,
  iconOnly = false,
  className = '',
}: BrandLogoProps) {
  const { icon, text } = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex flex-col items-center ${className}`}
      style={{ gap: 2 }}
    >
      {/* Icon — overflow-hidden clips dark border; scale(1.35) fills the box */}
      <span
        style={{
          display: 'inline-block',
          width: icon,
          height: icon,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: 6,
        }}
      >
        <Image
          src="/logo.png"
          alt="TRAINET logo"
          width={icon}
          height={icon}
          priority
          style={{
            width: icon,
            height: icon,
            objectFit: 'contain',
            objectPosition: 'center',
            transform: 'scale(1.35)',
            transformOrigin: 'center',
            display: 'block',
          }}
        />
      </span>

      {/* Wordmark */}
      {!iconOnly && (
        <span className={text + ' ' + (textClassName ?? 'text-white')}>
          TRAIN<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ET</span>
        </span>
      )}
    </span>
  );
}
