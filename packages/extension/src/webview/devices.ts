/** Keep aligned with @mvb/shared DEVICE_PRESETS (slim series list). */

export type DevicePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  userAgent: string;
  hasTouch: boolean;
  isMobile: boolean;
};

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'iphone-17', name: 'iPhone 17', width: 402, height: 874, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
  { id: 'iphone-16', name: 'iPhone 16', width: 393, height: 852, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
  { id: 'iphone-15', name: 'iPhone 15', width: 393, height: 852, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
  { id: 'pixel-9', name: 'Pixel 9', width: 412, height: 915, deviceScaleFactor: 2.625, userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36', hasTouch: true, isMobile: true },
  { id: 'galaxy-s25', name: 'Galaxy S25', width: 360, height: 780, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36', hasTouch: true, isMobile: true },
  { id: 'galaxy-s24', name: 'Galaxy S24', width: 360, height: 780, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', hasTouch: true, isMobile: true },
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', hasTouch: true, isMobile: true },
];
