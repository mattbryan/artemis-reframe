import type { SchemaDefinition } from "@/types/schema-definition";

export const schemaDefinitionsFixture: SchemaDefinition[] = [
  {
    id: "schema-1",
    name: "Photo Asset",
    fields: [
      { id: "f1", name: "title", type: "string", required: true },
      { id: "f2", name: "alt", type: "string", required: false },
      { id: "f3", name: "resolution", type: "string", required: false },
    ],
    createdAt: "2024-01-06T10:00:00Z",
  },
];
