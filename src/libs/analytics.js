// Mixpanel 초기화 및 간단 유틸
import mixpanel from "mixpanel-browser";

const token = import.meta.env.VITE_MIXPANEL_TOKEN;

export function initAnalytics() {
  if (!token) {
    console.warn("⚠️ Mixpanel token missing. Set VITE_MIXPANEL_TOKEN in .env");
    return;
  }
  mixpanel.init(token, { debug: import.meta.env.DEV, track_pageview: false });
}

export function track(event, props = {}) {
  try {
    mixpanel.track(event, props);
  } catch (e) {
    // 토큰 미설정 등으로 실패해도 앱 흐름은 막지 않음
    console.debug("Mixpanel track skipped:", event, props);
  }
}

export default { initAnalytics, track };
