import { componentStateLabels } from "../../shared/component-state-label";
import type { PageTheme } from "../../shared/page-theme";
import { publicStyles } from "./public-styles";

/** Browser-only behavior and CSS belong to generated snapshot artifacts. */
export const publicPageScript = String.raw`(() => {
  const stateLabels = ${JSON.stringify(componentStateLabels)};
  const format = (iso, zone, name) => {
    const date = new Date(iso);
    const text = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
    return text + ' ' + name;
  };
  const label = document.querySelector('[data-timezone-label]');
  const zone = label?.getAttribute('data-timezone') || 'UTC';
  const zoneName = label?.getAttribute('data-zone-name') || 'Universal time';
  const relative = () => {
    const time = document.querySelector('[data-generated-at] time');
    if (!time) return;
    const minutes = Math.floor(Math.max(0, Date.now() - Date.parse(time.dateTime)) / 60000), hours = Math.floor(minutes / 60), days = Math.floor(hours / 24);
    time.title = format(time.dateTime, zone, zoneName);
    time.textContent = minutes < 1 ? 'just now' : minutes < 60 ? minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ago' : hours < 24 ? hours + ' hour' + (hours === 1 ? '' : 's') + ' ago' : days + ' day' + (days === 1 ? '' : 's') + ' ago';
  };
  relative();
  setInterval(relative, 30000);
  setInterval(async () => {
    try {
      const response = await fetch('/api/public/status', { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      const overall = document.querySelector('[data-overall]'), generated = document.querySelector('[data-generated-at]'), latest = document.querySelector('[data-newest-update]');
      const stateLabel = Object.hasOwn(stateLabels, data.overall) ? stateLabels[data.overall] : data.overall;
      if (overall && overall.textContent !== stateLabel) {
        overall.textContent = stateLabel;
        const banner = overall.closest('.status-banner');
        if (banner) banner.className = 'status-banner ' + data.overall.toLowerCase().replaceAll(' ', '-');
      }
      const summary = data.incident ? data.incident.summary : 'There are no open incidents.';
      if (latest && latest.textContent !== summary) latest.textContent = summary;
      if (generated) {
        const time = generated.querySelector('time');
        if (time && time.dateTime !== data.generatedAt) {
          time.dateTime = data.generatedAt;
          const detailTime = document.querySelector('[data-generation-details] time');
          if (detailTime) {
            const offset = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(new Date(data.generatedAt)).find(part => part.type === 'timeZoneName').value;
            detailTime.dateTime = data.generatedAt;
            detailTime.textContent = format(data.generatedAt, zone, offset === 'GMT' ? 'UTC+00:00' : offset.replace(/^GMT/, 'UTC'));
          }
        }
        relative();
      }
    } catch {
      // Keep the most recent status that loaded successfully.
    }
  }, 30000);
})();`;

export function publicPageStyles(accentColor: string, theme?: PageTheme, origin?: string) {
  return publicStyles(accentColor, theme, origin);
}
