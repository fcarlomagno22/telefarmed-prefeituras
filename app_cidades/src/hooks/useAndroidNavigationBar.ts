/**
 * A navigation bar translúcida é aplicada no build via `app.json`:
 * - expo-navigation-bar plugin (position, backgroundColor, barStyle)
 * - androidNavigationBar
 *
 * Com edge-to-edge ativo, setPositionAsync/setBackgroundColorAsync em runtime
 * só geram warnings e não alteram o comportamento.
 */
export function applyAndroidNavigationBar() {}

export function applyAndroidNavigationBarForModal() {}

export function useAndroidNavigationBar() {}
