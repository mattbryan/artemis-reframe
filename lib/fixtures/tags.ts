import type { Tag } from "@/types/tag";

export const tagsFixture: Tag[] = [
  { id: "tag-1", category: "Uncategorized", value: "CRE Listing", key: "uncategorized|cre listing" },
  { id: "tag-2", category: "Uncategorized", value: "Brand Voice", key: "uncategorized|brand voice" },
  { id: "tag-3", category: "Uncategorized", value: "Hero Image", key: "uncategorized|hero image" },
  { id: "tag-4", category: "Uncategorized", value: "Testimonial", key: "uncategorized|testimonial" },
  { id: "tag-5", parent: "Apparel", category: "Color", value: "Blue", key: "apparel|color|blue" },
  { id: "tag-6", category: "Color", value: "Red", key: "color|red" },
];
