/** Device geometry helpers — shared by extension (Node) and webview (browser). */

export type DeviceLike = {
  width: number;
  height: number;
};

export type PhoneInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  radius: string;
};

export type PhoneGeometry = {
  device: DeviceLike;
  inset: PhoneInsets;
  screenW: number;
  screenH: number;
  shellW: number;
  shellH: number;
};

/** Compute device-specific screen insets (phone vs tablet). */
export function screenInsetsFor(device: DeviceLike): PhoneInsets {
  const isTablet = device.width / device.height > 0.65;
  return isTablet
    ? { top: 0.022, bottom: 0.02, left: 0.018, right: 0.018, radius: '4% / 3%' }
    : { top: 0.0105, bottom: 0.0115, left: 0.0145, right: 0.0145, radius: '10% / 5.2%' };
}

/**
 * Compute phone shell geometry:
 *   - screen = device CSS viewport
 *   - shell = outer frame derived from screen + insets
 * The shell is what the phone frame image covers; the screen is the iframe cutout.
 */
export function devicePhoneGeometry(device: DeviceLike): PhoneGeometry {
  const inset = screenInsetsFor(device);
  const screenW = device.width;
  const screenH = device.height;
  const shellW = Math.round(screenW / (1 - inset.left - inset.right));
  const shellH = Math.round(screenH / (1 - inset.top - inset.bottom));
  return { device, inset, screenW, screenH, shellW, shellH };
}

/** Convert inset fractions to CSS percentage values for absolute-positioned elements. */
export function insetPercentages(inset: PhoneInsets): {
  topPct: string;
  bottomPct: string;
  leftPct: string;
  rightPct: string;
} {
  return {
    topPct: (inset.top * 100).toFixed(4) + '%',
    bottomPct: (inset.bottom * 100).toFixed(4) + '%',
    leftPct: (inset.left * 100).toFixed(4) + '%',
    rightPct: (inset.right * 100).toFixed(4) + '%',
  };
}