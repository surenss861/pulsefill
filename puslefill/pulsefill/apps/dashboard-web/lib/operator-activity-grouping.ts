import type { OperatorActivityItem } from "@/types/operator-activity-feed";

export interface OperatorActivitySection {
  title: string;
  items: OperatorActivityItem[];
}

export function groupOperatorActivityItems(items: OperatorActivityItem[]): OperatorActivitySection[] {
  const now = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const todayItems = items.filter((item) => isSameDay(new Date(item.occurred_at), now));
  const yesterdayItems = items.filter((item) => isSameDay(new Date(item.occurred_at), yesterday));

  const todayIds = new Set(todayItems.map((i) => i.id));
  const yesterdayIds = new Set(yesterdayItems.map((i) => i.id));

  const earlierItems = items.filter((item) => !todayIds.has(item.id) && !yesterdayIds.has(item.id));

  const sections: OperatorActivitySection[] = [];
  if (todayItems.length) sections.push({ title: "Today", items: todayItems });
  if (yesterdayItems.length) sections.push({ title: "Yesterday", items: yesterdayItems });
  if (earlierItems.length) sections.push({ title: "Earlier", items: earlierItems });
  return sections;
}
