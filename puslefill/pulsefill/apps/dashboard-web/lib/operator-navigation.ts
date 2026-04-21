import { openSlotDetailPath } from "@/lib/open-slot-routes";

type RouterLike = {
  push: (href: string) => void;
};

export function navigateToOpenSlotDetail(router: RouterLike, openSlotId: string | null | undefined): void {
  if (!openSlotId) return;
  router.push(openSlotDetailPath(openSlotId));
}
