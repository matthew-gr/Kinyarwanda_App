// Port of the design system's Icon. SVG bodies are copied from its bundle, drawn in currentColor.

import type { CSSProperties } from 'react';

const ICONS = {
  home: [
    24,
    24,
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></g>',
  ],
  search: [
    24,
    24,
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-4.34-4.34"/><circle cx="11" cy="11" r="8"/></g>',
  ],
  clock: [
    24,
    24,
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></g>',
  ],
  user: [
    24,
    24,
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g>',
  ],
  notification: [
    24,
    24,
    '<path fill="currentColor" d="M14.826 19A3 3 0 0 1 12 21a3 3 0 0 1-2.825-2zM12 2a7 7 0 0 1 7 7v3.528a1 1 0 0 0 .106.447l1.717 3.433A1.1 1.1 0 0 1 19.838 18H4.162a1.1 1.1 0 0 1-.984-1.592l1.717-3.433A1 1 0 0 0 5 12.528V9a7 7 0 0 1 7-7"/>',
  ],
  fire: [
    24,
    24,
    '<path fill="currentColor" d="M17.66 11.2c-.23-.3-.51-.56-.77-.82c-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32c-2.59 2.08-3.61 5.75-2.39 8.9c.04.1.08.2.08.33c0 .22-.15.42-.35.5c-.23.1-.47.04-.66-.12a.6.6 0 0 1-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5c.14.6.41 1.2.71 1.73c1.08 1.73 2.95 2.97 4.96 3.22c2.14.27 4.43-.12 6.07-1.6c1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.74.5-1.1.6c-1.12.4-2.24-.16-2.9-.82c1.19-.28 1.9-1.16 2.11-2.05c.17-.8-.15-1.46-.28-2.23c-.12-.74-.1-1.37.17-2.06c.19.38.39.76.63 1.06c.77 1 1.98 1.44 2.24 2.8c.04.14.06.28.06.43c.03.82-.33 1.72-.93 2.27"/>',
  ],
  star: [
    24,
    24,
    '<path fill="currentColor" d="m8.85 16.825l3.15-1.9l3.15 1.925l-.825-3.6l2.775-2.4l-3.65-.325l-1.45-3.4l-1.45 3.375l-3.65.325l2.775 2.425zm3.15.45l-4.15 2.5q-.275.175-.575.15t-.525-.2t-.35-.437t-.05-.588l1.1-4.725L3.775 10.8q-.25-.225-.312-.513t.037-.562t.3-.45t.55-.225l4.85-.425l1.875-4.45q.125-.3.388-.45t.537-.15t.537.15t.388.45l1.875 4.45l4.85.425q.35.05.55.225t.3.45t.038.563t-.313.512l-3.675 3.175l1.1 4.725q.075.325-.05.588t-.35.437t-.525.2t-.575-.15zm0-5.025"/>',
  ],
  speaker: [
    20,
    20,
    '<path fill="currentColor" d="M11.996 3.006c0-.873-1.04-1.327-1.68-.733L6.444 5.866a.5.5 0 0 1-.34.134H3.496a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h2.608a.5.5 0 0 1 .34.133l3.872 3.594c.64.593 1.68.14 1.68-.733zM7.124 6.599l3.872-3.593v13.988L7.124 13.4a1.5 1.5 0 0 0-1.02-.4H3.496a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5h2.608a1.5 1.5 0 0 0 1.02-.4m8.132-1.972a.5.5 0 0 1 .706.04a8 8 0 0 1 0 10.666a.5.5 0 0 1-.745-.667a7 7 0 0 0 0-9.333a.5.5 0 0 1 .039-.706m-1.176 8.306a.5.5 0 0 1-.183-.683a4.5 4.5 0 0 0 0-4.5a.5.5 0 1 1 .865-.5a5.5 5.5 0 0 1 .001 5.5a.5.5 0 0 1-.683.183"/>',
  ],
  bulb: [
    24,
    24,
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21h6M12 3a6 6 0 0 0-5.019 9.29c.954 1.452 1.43 2.178 1.493 2.286c.55.965.449.625.518 1.734c.008.124.008.313.008.69a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1c0-.377 0-.566.008-.69c.07-1.11-.033-.769.518-1.734c.062-.108.54-.834 1.493-2.287A6 6 0 0 0 12 3"/>',
  ],
  chevron: [
    24,
    24,
    '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6.343 14.657L12 9l5.657 5.657"/>',
  ],
} as const satisfies Record<string, readonly [number, number, string]>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  rotate?: number;
  /** Set only when the icon stands alone and carries meaning. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 24, rotate, label, className, style }: IconProps) {
  const [w, h, body] = ICONS[name];
  return (
    <svg
      className={['kn-icon', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox={`0 0 ${w} ${h}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={rotate ? { ...style, transform: `rotate(${rotate}deg)` } : style}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
