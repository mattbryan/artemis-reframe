// SERVER ONLY — do not import in client components. Uses @react-pdf/renderer.

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type {
  GeneratedOutputContent,
  GeneratedSection,
  DesignSpec,
  DesignSpecPalette,
  DesignSpecTypography,
  DesignSpecLayout,
} from "@/types/generation";

/** Default palette when no designSpec or legacy content. */
const DEFAULT_PALETTE: DesignSpecPalette = {
  primary: "#0a0d1a",
  secondary: "#1a3a5c",
  accent: "#2d7dd2",
  background: "#ffffff",
  surface: "#ffffff",
  text: "#1a3a5c",
  textInverse: "#ffffff",
};

/** Default typography. */
const DEFAULT_TYPOGRAPHY: DesignSpecTypography = {
  fontFamilyHeading: "Helvetica-Bold",
  fontFamilyBody: "Helvetica",
  fontFamilyCaption: "Helvetica",
  headingFontSize: 14,
  bodyFontSize: 10,
  captionFontSize: 9,
};

/** Default layout. */
const DEFAULT_LAYOUT: DesignSpecLayout = {
  pagePadding: 40,
  sectionSpacing: 12,
  headerTreatment: "fullBleed",
  coverPage: false,
  sectionDensity: "balanced",
};

/** Spacing multiplier for section density (narrative marginTop, field spacing). */
const DENSITY_SPACING: Record<DesignSpecLayout["sectionDensity"], number> = {
  compact: 0.5,
  balanced: 1,
  airy: 1.5,
};

function isDesignSpecPalette(
  v: unknown
): v is DesignSpecPalette {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.primary === "string" &&
    typeof o.secondary === "string" &&
    typeof o.accent === "string" &&
    typeof o.background === "string" &&
    typeof o.surface === "string" &&
    typeof o.text === "string" &&
    typeof o.textInverse === "string"
  );
}

function isDesignSpecTypography(
  v: unknown
): v is DesignSpecTypography {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.fontFamilyHeading === "string" &&
    typeof o.fontFamilyBody === "string" &&
    typeof o.headingFontSize === "number" &&
    typeof o.bodyFontSize === "number" &&
    typeof o.captionFontSize === "number"
  );
}

function isDesignSpecLayout(v: unknown): v is DesignSpecLayout {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.pagePadding === "number" &&
    typeof o.sectionSpacing === "number" &&
    ["fullBleed", "inline", "minimal"].includes(String(o.headerTreatment)) &&
    typeof o.coverPage === "boolean" &&
    ["compact", "balanced", "airy"].includes(String(o.sectionDensity))
  );
}

/** Resolve a full DesignSpec from content (use defaults for missing or invalid). */
function resolveDesignSpec(content: GeneratedOutputContent): DesignSpec {
  const raw = content.designSpec;
  if (!raw || typeof raw !== "object") {
    return {
      palette: { ...DEFAULT_PALETTE },
      typography: { ...DEFAULT_TYPOGRAPHY },
      layout: { ...DEFAULT_LAYOUT },
    };
  }
  const r = raw as unknown as Record<string, unknown>;
  const palette = isDesignSpecPalette(r.palette)
    ? { ...r.palette }
    : { ...DEFAULT_PALETTE };
  const typography = isDesignSpecTypography(r.typography)
    ? {
        ...r.typography,
        fontFamilyCaption:
          r.typography.fontFamilyCaption ?? r.typography.fontFamilyBody,
      }
    : { ...DEFAULT_TYPOGRAPHY };
  const layout = isDesignSpecLayout(r.layout)
    ? { ...r.layout }
    : { ...DEFAULT_LAYOUT };
  const sectionOverrides =
    r.sectionOverrides &&
    typeof r.sectionOverrides === "object" &&
    !Array.isArray(r.sectionOverrides)
      ? (r.sectionOverrides as Record<string, { backgroundColor?: string }>)
      : undefined;
  return {
    palette,
    typography,
    layout,
    sectionOverrides,
  };
}

function isImageField(key: string): boolean {
  const lower = key.toLowerCase();
  return ["image", "photo", "aerial", "headshot", "logo"].some((k) =>
    lower.includes(k)
  );
}

/** Build StyleSheet-compatible styles from a resolved DesignSpec. */
function buildStylesFromSpec(spec: DesignSpec) {
  const p = spec.palette;
  const t = spec.typography;
  const l = spec.layout;
  const densityMult = DENSITY_SPACING[l.sectionDensity];
  const baseSpacing = 12;
  const narrativeMargin = Math.round(baseSpacing * densityMult);
  const fieldMargin = Math.max(4, Math.round(6 * densityMult));

  return StyleSheet.create({
    page: {
      padding: l.pagePadding,
      fontSize: t.bodyFontSize,
      fontFamily: t.fontFamilyBody,
      backgroundColor: p.background,
    },
    sectionHeader: {
      backgroundColor: p.primary,
      color: p.textInverse,
      padding: 12,
      marginBottom: l.sectionSpacing,
      fontSize: t.headingFontSize,
      fontFamily: t.fontFamilyHeading,
    },
    fieldRow: {
      marginBottom: fieldMargin,
      flexDirection: "row",
    },
    fieldLabel: {
      width: "30%",
      color: p.text,
      fontFamily: t.fontFamilyHeading,
      fontSize: t.bodyFontSize,
    },
    fieldValue: {
      width: "70%",
      color: p.text,
      fontSize: t.bodyFontSize,
      fontFamily: t.fontFamilyBody,
    },
    narrative: {
      marginTop: narrativeMargin,
      paddingTop: narrativeMargin,
      borderTopWidth: 1,
      borderTopColor: p.secondary,
      color: p.text,
      lineHeight: 1.5,
      fontSize: t.bodyFontSize,
      fontFamily: t.fontFamilyBody,
    },
    imagePlaceholder: {
      borderWidth: 1,
      borderColor: p.accent,
      borderStyle: "dashed",
      padding: 16,
      marginBottom: 8,
      backgroundColor: p.surface,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 60,
    },
    imagePlaceholderText: {
      color: p.text,
      fontSize: t.captionFontSize,
      fontFamily: t.fontFamilyCaption ?? t.fontFamilyBody,
    },
    splitLeft: {
      flex: 1,
      padding: 24,
      backgroundColor: p.primary,
      color: p.textInverse,
      justifyContent: "space-between",
    },
    splitRight: {
      flex: 1,
      padding: 24,
      backgroundColor: p.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    keyValueBox: {
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.secondary,
      padding: 16,
      marginBottom: l.sectionSpacing,
    },
    keyValueRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    tocItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: p.secondary,
      paddingBottom: 4,
      marginBottom: 4,
    },
  });
}

type SectionPageProps = {
  section: GeneratedSection;
  styles: ReturnType<typeof buildStylesFromSpec>;
  sectionBackgroundColor?: string;
};

function SectionPage({
  section,
  styles,
  sectionBackgroundColor,
}: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const entries = Object.entries(fields).filter(
    ([k]) => k.toLowerCase() !== "narrative"
  );

  const pageStyle = sectionBackgroundColor
    ? { ...styles.page, backgroundColor: sectionBackgroundColor }
    : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <View style={styles.sectionHeader}>
        <Text>{section.sectionName}</Text>
      </View>
      {entries.map(([key, value]) =>
        isImageField(key) ? (
          <View key={key} style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {value || key || "Image placeholder"}
            </Text>
          </View>
        ) : (
          <View key={key} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{key}:</Text>
            <Text style={styles.fieldValue}>{value}</Text>
          </View>
        )
      )}
      {narrative ? (
        <Text style={styles.narrative}>{narrative}</Text>
      ) : null}
    </Page>
  );
}

/** Cover section: split layout — primary block (title, stats) + image area. */
function PdfCoverSection({ section, styles }: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const get = (k: string) => (fields[k] ?? "").trim();
  const tenantName = get("tenantName") || get("propertyName") || "Property Name";
  const propertyAddress = get("propertyAddress") || get("address") || "";
  const listPrice = get("listPrice") || "";
  const capRate = get("capRate") || "";
  const leaseType = get("leaseType") || "";
  const buildingSize = get("buildingSize") || "";
  const imageEntry = Object.entries(fields).find(([k]) => isImageField(k));
  const imageLabel = imageEntry ? (imageEntry[1] || imageEntry[0]) : "Cover image";

  return (
    <Page size="A4" style={styles.page}>
      <View style={{ flexDirection: "row", flex: 1, minHeight: 400 }}>
        <View style={styles.splitLeft}>
          <View>
            <Text style={{ fontFamily: styles.sectionHeader.fontFamily, fontSize: (styles.sectionHeader.fontSize as number) + 4 }}>{tenantName}</Text>
            {propertyAddress ? <Text style={{ marginTop: 8, fontSize: styles.imagePlaceholderText.fontSize, opacity: 0.9 }}>{propertyAddress}</Text> : null}
          </View>
          <View style={{ marginTop: 16 }}>
            {(listPrice || capRate || leaseType) ? (
              <Text style={{ fontSize: styles.fieldValue.fontSize }}>{[listPrice, capRate, leaseType].filter(Boolean).join(" · ")}</Text>
            ) : null}
            {buildingSize ? <Text style={{ fontSize: styles.fieldValue.fontSize }}>{buildingSize}</Text> : null}
          </View>
        </View>
        <View style={styles.splitRight}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{imageLabel}</Text>
          </View>
        </View>
      </View>
      {narrative ? <Text style={styles.narrative}>{narrative}</Text> : null}
    </Page>
  );
}

/** Financial summary: header + key-value box + narrative. */
function PdfFinancialSummarySection({ section, styles, sectionBackgroundColor }: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const entries = Object.entries(fields).filter(([k, v]) => v != null && String(v).trim() !== "" && k.toLowerCase() !== "narrative");
  const pageStyle = sectionBackgroundColor ? { ...styles.page, backgroundColor: sectionBackgroundColor } : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <View style={styles.sectionHeader}>
        <Text>Financial Summary</Text>
      </View>
      <View style={styles.keyValueBox}>
        {entries.map(([key, value]) => (
          <View key={key} style={styles.keyValueRow}>
            <Text style={styles.fieldLabel}>{key}</Text>
            <Text style={styles.fieldValue}>{value}</Text>
          </View>
        ))}
      </View>
      {narrative ? <Text style={styles.narrative}>{narrative}</Text> : null}
    </Page>
  );
}

/** Property summary: header + image placeholders + key-value grid + narrative. */
function PdfPropertySummarySection({ section, styles, sectionBackgroundColor }: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const entries = Object.entries(fields).filter(([k]) => k.toLowerCase() !== "narrative");
  const imageEntries = entries.filter(([k]) => isImageField(k));
  const textEntries = entries.filter(([k]) => !isImageField(k));
  const pageStyle = sectionBackgroundColor ? { ...styles.page, backgroundColor: sectionBackgroundColor } : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <View style={styles.sectionHeader}>
        <Text>Property Summary</Text>
      </View>
      {imageEntries.length > 0 ? imageEntries.map(([key, value]) => (
        <View key={key} style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>{value || key}</Text>
        </View>
      )) : null}
      {textEntries.map(([key, value]) => (
        <View key={key} style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{key}:</Text>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      ))}
      {narrative ? <Text style={styles.narrative}>{narrative}</Text> : null}
    </Page>
  );
}

/** Table of contents: header + list of items from fields. */
function PdfTableOfContentsSection({ section, styles, sectionBackgroundColor }: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const entries = Object.entries(fields).filter(([_, v]) => v != null && String(v).trim() !== "");
  const pageStyle = sectionBackgroundColor ? { ...styles.page, backgroundColor: sectionBackgroundColor } : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <View style={styles.sectionHeader}>
        <Text>Table of Contents</Text>
      </View>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.tocItem}>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      ))}
      {narrative ? <Text style={styles.narrative}>{narrative}</Text> : null}
    </Page>
  );
}

/** Narrative-heavy sections: header + narrative + optional field rows. */
function PdfNarrativeSection({ section, styles, sectionBackgroundColor }: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const entries = Object.entries(fields).filter(([k]) => k.toLowerCase() !== "narrative");
  const pageStyle = sectionBackgroundColor ? { ...styles.page, backgroundColor: sectionBackgroundColor } : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <View style={styles.sectionHeader}>
        <Text>{section.sectionName}</Text>
      </View>
      {entries.map(([key, value]) =>
        isImageField(key) ? (
          <View key={key} style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{value || key}</Text>
          </View>
        ) : (
          <View key={key} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{key}:</Text>
            <Text style={styles.fieldValue}>{value}</Text>
          </View>
        )
      )}
      {narrative ? <Text style={styles.narrative}>{narrative}</Text> : null}
    </Page>
  );
}

/** Section with header + image placeholder(s) + narrative (aerial-maps, site-plan). */
function PdfImageSection({ section, styles, sectionBackgroundColor }: SectionPageProps): ReactElement {
  const fields = section.fields ?? {};
  const narrative = section.narrative ?? "";
  const entries = Object.entries(fields).filter(([k]) => k.toLowerCase() !== "narrative");
  const pageStyle = sectionBackgroundColor ? { ...styles.page, backgroundColor: sectionBackgroundColor } : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <View style={styles.sectionHeader}>
        <Text>{section.sectionName}</Text>
      </View>
      {entries.map(([key, value]) =>
        isImageField(key) ? (
          <View key={key} style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{value || key}</Text>
          </View>
        ) : (
          <View key={key} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{key}:</Text>
            <Text style={styles.fieldValue}>{value}</Text>
          </View>
        )
      )}
      {narrative ? <Text style={styles.narrative}>{narrative}</Text> : null}
    </Page>
  );
}

const SECTION_LAYOUT_MAP: Record<string, (props: SectionPageProps) => ReactElement> = {
  cover: PdfCoverSection,
  "exclusively-listed-by": PdfNarrativeSection,
  "table-of-contents": PdfTableOfContentsSection,
  "investment-highlights": PdfNarrativeSection,
  "aerial-maps": PdfImageSection,
  "site-plan": PdfImageSection,
  "property-summary": PdfPropertySummarySection,
  "financial-summary": PdfFinancialSummarySection,
  "tenant-overview": PdfNarrativeSection,
  "market-overview": PdfNarrativeSection,
};

function CoverPage({
  headline,
  subheadline,
  styles,
}: {
  headline: string;
  subheadline: string;
  styles: ReturnType<typeof buildStylesFromSpec>;
}): ReactElement {
  return (
    <Page size="A4" style={styles.page}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 40,
        }}
      >
        {headline ? (
          <Text
            style={{
              ...styles.sectionHeader,
              marginBottom: 16,
              padding: 0,
              backgroundColor: "transparent",
              color: styles.fieldLabel.color,
              fontSize: styles.sectionHeader.fontSize + 4,
            }}
          >
            {headline}
          </Text>
        ) : null}
        {subheadline ? (
          <Text
            style={{
              fontSize: styles.fieldValue.fontSize,
              fontFamily: styles.fieldValue.fontFamily,
              color: styles.fieldValue.color,
            }}
          >
            {subheadline}
          </Text>
        ) : null}
      </View>
    </Page>
  );
}

export async function renderOutputToPdfBuffer(
  content: GeneratedOutputContent
): Promise<Buffer> {
  const sections = content.sections ?? [];
  const spec = resolveDesignSpec(content);
  const styles = buildStylesFromSpec(spec);

  const sectionPages = sections.map((section) => {
    const SectionComponent =
      SECTION_LAYOUT_MAP[section.sectionId] ?? SectionPage;
    return (
      <SectionComponent
        key={section.sectionId}
        section={section}
        styles={styles}
        sectionBackgroundColor={
          spec.sectionOverrides?.[section.sectionId]?.backgroundColor
        }
      />
    );
  });

  const doc = (
    <Document>
      {spec.layout.coverPage &&
      (content.headline ?? content.subheadline) ? (
        <CoverPage
          headline={content.headline ?? ""}
          subheadline={content.subheadline ?? ""}
          styles={styles}
        />
      ) : null}
      {sectionPages}
    </Document>
  );
  return await renderToBuffer(doc);
}
