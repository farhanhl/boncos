export type DefaultCategorySlug =
  | "food"
  | "transport"
  | "shopping"
  | "bills"
  | "entertainment"
  | "health"
  | "education"
  | "transfer"
  | "other";

export interface CategoryInfo {
  id: DefaultCategorySlug;
  name: string;
  color: string;
  iconName: string;
}

export const DEFAULT_CATEGORIES: Record<DefaultCategorySlug, CategoryInfo> = {
  food: {
    id: "food",
    name: "Makanan & Minuman",
    color: "#FF9F45",
    iconName: "PiForkKnifeBold",
  },
  transport: {
    id: "transport",
    name: "Transportasi",
    color: "#6EC6FF",
    iconName: "PiCarBold",
  },
  shopping: {
    id: "shopping",
    name: "Belanja",
    color: "#FF7EB6",
    iconName: "PiShoppingBagBold",
  },
  bills: {
    id: "bills",
    name: "Tagihan",
    color: "#B9C0FF",
    iconName: "PiReceiptBold",
  },
  entertainment: {
    id: "entertainment",
    name: "Hiburan",
    color: "#FFD23F",
    iconName: "PiGameControllerBold",
  },
  health: {
    id: "health",
    name: "Kesehatan",
    color: "#2BD67B",
    iconName: "PiHeartbeatBold",
  },
  education: {
    id: "education",
    name: "Pendidikan",
    color: "#C8E36B",
    iconName: "PiGraduationCapBold",
  },
  transfer: {
    id: "transfer",
    name: "Transfer",
    color: "#818CF8",
    iconName: "PiArrowsLeftRightBold",
  },
  other: {
    id: "other",
    name: "Lainnya",
    color: "#D9DBF0",
    iconName: "PiDotsThreeOutlineBold",
  },
};

export const DEFAULT_CATEGORY_LIST = Object.values(DEFAULT_CATEGORIES);

export function getCategoryById(id: string | null | undefined): CategoryInfo {
  if (id && id in DEFAULT_CATEGORIES) {
    return DEFAULT_CATEGORIES[id as DefaultCategorySlug];
  }
  return DEFAULT_CATEGORIES.other;
}
