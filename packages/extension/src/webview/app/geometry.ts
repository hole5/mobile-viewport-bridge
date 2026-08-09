/** Device geometry helpers — webview-compatible version of @mvb/shared/geometry. */

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

/** 顶部刘海/打孔几何信息（相对于屏幕宽度的比例） */
export type NotchGeometry = {
  /** 类型 */
  type: 'dynamic-island' | 'notch' | 'pill' | 'hole-punch' | 'none';
  /** 宽度比例（相对于屏幕宽度） */
  widthRatio: number;
  /** 高度比例（相对于屏幕高度） */
  heightRatio: number;
  /** 顶部偏移比例（相对于屏幕高度） */
  topRatio: number;
  /** 圆角半径（px，按屏幕宽度缩放） */
  borderRadius: number;
};

/** 底部导航条几何信息 */
export type HomeIndicatorGeometry = {
  /** 类型 */
  type: 'home-indicator' | 'gesture-bar' | 'none';
  /** 宽度比例（相对于屏幕宽度） */
  widthRatio: number;
  /** 高度（px） */
  height: number;
  /** 底部偏移（px） */
  bottomOffset: number;
  /** 圆角半径（px） */
  borderRadius: number;
};

export type PhoneGeometry = {
  device: DeviceLike;
  inset: PhoneInsets;
  screenW: number;
  screenH: number;
  shellW: number;
  shellH: number;
  /** 顶部刘海/打孔几何 */
  notch: NotchGeometry;
  /** 底部导航条几何 */
  homeIndicator: HomeIndicatorGeometry;
};

/**
 * 根据设备类型计算刘海/打孔几何
 * 所有尺寸按屏幕宽度比例缩放，确保在不同设备上视觉一致
 */
export function notchGeometryFor(device: DeviceLike & { notchType?: string }): NotchGeometry {
  const type = (device.notchType || 'none') as NotchGeometry['type'];
  const w = device.width;

  switch (type) {
    case 'dynamic-island':
      // iPhone 灵动岛：宽度约 33% 屏幕宽，高度约 3.5% 屏幕高
      return {
        type,
        widthRatio: 0.33,
        heightRatio: 0.035,
        topRatio: 0.012,
        borderRadius: Math.round(w * 0.05), // 约 20px @ 393px
      };
    case 'notch':
      // iPhone 刘海：宽度约 45% 屏幕宽，高度约 4% 屏幕高
      return {
        type,
        widthRatio: 0.45,
        heightRatio: 0.04,
        topRatio: 0,
        borderRadius: Math.round(w * 0.04), // 底部圆角
      };
    case 'pill':
      // Pixel 药丸打孔：宽度约 12% 屏幕宽，高度约 2.5% 屏幕高
      return {
        type,
        widthRatio: 0.12,
        heightRatio: 0.025,
        topRatio: 0.015,
        borderRadius: Math.round(w * 0.06), // 全圆角
      };
    case 'hole-punch':
      // Galaxy 居中打孔：圆形，直径约 6% 屏幕宽
      return {
        type,
        widthRatio: 0.06,
        heightRatio: 0.06,
        topRatio: 0.018,
        borderRadius: Math.round(w * 0.03), // 正圆
      };
    case 'none':
    default:
      return {
        type: 'none',
        widthRatio: 0,
        heightRatio: 0,
        topRatio: 0,
        borderRadius: 0,
      };
  }
}

/**
 * 根据设备类型计算底部导航条几何
 */
export function homeIndicatorGeometryFor(device: DeviceLike & { homeIndicatorType?: string }): HomeIndicatorGeometry {
  const type = (device.homeIndicatorType || 'none') as HomeIndicatorGeometry['type'];
  const w = device.width;

  switch (type) {
    case 'home-indicator':
      // iOS Home Indicator：宽度约 36% 屏幕宽，高度 5px，底部偏移 8px
      return {
        type,
        widthRatio: 0.36,
        height: 5,
        bottomOffset: 8,
        borderRadius: 3,
      };
    case 'gesture-bar':
      // Android 手势条：宽度约 30% 屏幕宽，高度 3px，底部偏移 6px
      return {
        type,
        widthRatio: 0.30,
        height: 3,
        bottomOffset: 6,
        borderRadius: 2,
      };
    case 'none':
    default:
      return {
        type: 'none',
        widthRatio: 0,
        height: 0,
        bottomOffset: 0,
        borderRadius: 0,
      };
  }
}

export function screenInsetsFor(device: DeviceLike): PhoneInsets {
  const isTablet = device.width / device.height > 0.65;
  return isTablet
    ? { top: 0.022, bottom: 0.02, left: 0.018, right: 0.018, radius: '4% / 3%' }
    : { top: 0.0105, bottom: 0.0115, left: 0.0145, right: 0.0145, radius: '10% / 5.2%' };
}

export function devicePhoneGeometry(device: DeviceLike & { notchType?: string; homeIndicatorType?: string }): PhoneGeometry {
  const inset = screenInsetsFor(device);
  const screenW = device.width;
  const screenH = device.height;
  const shellW = Math.round(screenW / (1 - inset.left - inset.right));
  const shellH = Math.round(screenH / (1 - inset.top - inset.bottom));
  const notch = notchGeometryFor(device);
  const homeIndicator = homeIndicatorGeometryFor(device);
  return { device, inset, screenW, screenH, shellW, shellH, notch, homeIndicator };
}

export function insetPercentages(inset: PhoneInsets) {
  return {
    topPct: (inset.top * 100).toFixed(4) + '%',
    bottomPct: (inset.bottom * 100).toFixed(4) + '%',
    leftPct: (inset.left * 100).toFixed(4) + '%',
    rightPct: (inset.right * 100).toFixed(4) + '%',
  };
}