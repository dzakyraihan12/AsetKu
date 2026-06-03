/**
 * Trigger haptic feedback if available (mobile browsers)
 */
export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const durations = { light: 5, medium: 10, heavy: 20 };
  try {
    navigator.vibrate(durations[style]);
  } catch {
    // Silently fail if vibration not supported
  }
}
