/**
 * Seed four default collateral types when none exist.
 * Called from collateral-types layout or list on first load.
 */

import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { OutputTargetDef } from "@/types/collateralType";
import type { FieldDef } from "@/types/collateralType";

const NOW = Date.now();

function outputTargets(defs: OutputTargetDef[]): string {
  return JSON.stringify(defs);
}

function sectionFields(fields: FieldDef[]): string {
  return JSON.stringify(fields);
}

/** Only runs if collateralTypes.length === 0. Seeds four default types. */
export async function seedCollateralDefaults(): Promise<void> {
  const { data } = await db.queryOnce({ collateralType: {} });
  const list = data?.collateralType ?? [];
  const count = Array.isArray(list) ? list.length : Object.keys(list).length;
  if (count > 0) return;

  const ops: unknown[] = [];

  // —— TYPE 1: Multifamily Offering Memorandum ——
  const omId = id();
  ops.push(
    db.tx.collateralType[omId].update({
      name: "Multifamily Offering Memorandum",
      slug: "multifamily-offering-memorandum",
      description:
        "A comprehensive investment offering document for multifamily properties. Suitable for institutional and private equity buyers. Can be produced as a print PDF or web-based landing page.",
      category: "Multifamily",
      aiIntent:
        "When generating this collateral type, always lead with the investment thesis before property details. Present financial data with source citations. Use institutional tone throughout. Never describe projected returns as guaranteed.",
      outputTargets: outputTargets([
        { targetType: "print-pdf", briefOptionIds: [], layoutNotes: "" },
        { targetType: "web-html", briefOptionIds: [], layoutNotes: "" },
      ]),
      isDefault: true,
      isArchived: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
  );

  const omSections = [
    {
      name: "Executive Summary",
      description: "",
      contentGuidelines:
        "2–3 paragraphs. Open with the investment thesis — why this asset, why now. Summarize key metrics (units, NOI, cap rate, asking price). Close with the opportunity statement. Do not include agent contact info here.",
      fields: sectionFields([]),
      order: 0,
    },
    {
      name: "Property Overview",
      description: "",
      contentGuidelines:
        "Describe the physical asset. Include year built, unit mix, amenities, recent capital improvements, and location context. Write in present tense. Reference the hero image.",
      fields: sectionFields([
        { id: id(), label: "Year Built", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 0 },
        { id: id(), label: "Total Units", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 1 },
        { id: id(), label: "Unit Mix", fieldType: "textarea", helperText: "e.g. 24 x 1BR/1BA, 12 x 2BR/2BA", placeholder: "", options: [], required: true, order: 2 },
        { id: id(), label: "Recent Capital Improvements", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: false, order: 3 },
        { id: id(), label: "Amenities", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: false, order: 4 },
      ]),
      order: 1,
    },
    {
      name: "Market Overview",
      description: "",
      contentGuidelines:
        "Describe the submarket. Include vacancy rates, rent trends, population growth, and employment drivers. Cite data sources. Position the asset within the market opportunity.",
      fields: sectionFields([
        { id: id(), label: "Submarket Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 0 },
        { id: id(), label: "Key Market Stats", fieldType: "textarea", helperText: "Broker-provided data points", placeholder: "", options: [], required: false, order: 1 },
      ]),
      order: 2,
    },
    {
      name: "Financial Summary",
      description: "",
      contentGuidelines:
        "Present the financial profile of the asset. Include current NOI, cap rate, asking price, price per unit, and any debt assumptions. If projections are included, clearly label them as projections.",
      fields: sectionFields([
        { id: id(), label: "Asking Price", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 0 },
        { id: id(), label: "Current NOI", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 1 },
        { id: id(), label: "Cap Rate", fieldType: "text", helperText: "e.g. 5.25%", placeholder: "", options: [], required: true, order: 2 },
        { id: id(), label: "Price Per Unit", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 3 },
        { id: id(), label: "Debt Assumption Details", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: false, order: 4 },
        { id: id(), label: "Projection Notes", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: false, order: 5 },
      ]),
      order: 3,
    },
    {
      name: "Investment Highlights",
      description: "",
      contentGuidelines:
        "Bulleted or short-form highlights. 5–8 points. Each should be a distinct, compelling reason to invest. Avoid repeating content from the Executive Summary verbatim.",
      fields: sectionFields([]),
      order: 4,
    },
    {
      name: "Team & Contact",
      description: "",
      contentGuidelines:
        "Brief agent bio(s) and contact information. Professional tone. Include license numbers per Policy & Rules requirements.",
      fields: sectionFields([
        { id: id(), label: "Lead Agent Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 0 },
        { id: id(), label: "Lead Agent Title", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 1 },
        { id: id(), label: "Lead Agent License Number", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 2 },
        { id: id(), label: "Co-Agent Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 3 },
        { id: id(), label: "Co-Agent License Number", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 4 },
        { id: id(), label: "Brokerage Phone", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 5 },
        { id: id(), label: "Brokerage Email", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 6 },
      ]),
      order: 5,
    },
  ];

  omSections.forEach((s, i) => {
    const sid = id();
    ops.push(
      db.tx.collateralSection[sid].update({
        collateralTypeId: omId,
        name: s.name,
        description: s.description,
        contentGuidelines: s.contentGuidelines,
        fields: s.fields,
        order: s.order,
      })
    );
  });

  const omGlobalFields = [
    { label: "Property Name", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 0 },
    { label: "Property Address", fieldType: "textarea" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 1 },
    { label: "City, State, Zip", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 2 },
    { label: "Asset Class", fieldType: "text" as const, placeholder: "Multifamily", helperText: "", options: "[]", required: false, order: 3 },
    { label: "Deal Type", fieldType: "select" as const, placeholder: "", helperText: "", options: JSON.stringify(["Sale", "Joint Venture", "Recapitalization"]), required: true, order: 4 },
    { label: "Confidentiality Level", fieldType: "select" as const, placeholder: "", helperText: "", options: JSON.stringify(["Public", "Qualified Investors Only", "Accredited Investors Only"]), required: true, order: 5 },
  ];
  omGlobalFields.forEach((f, i) => {
    const fid = id();
    ops.push(
      db.tx.collateralGlobalField[fid].update({
        collateralTypeId: omId,
        label: f.label,
        fieldType: f.fieldType,
        helperText: f.helperText,
        placeholder: f.placeholder,
        options: f.options,
        required: f.required,
        order: f.order,
      })
    );
  });

  const omMediaFields = [
    { label: "Hero Property Photo", description: "Full-bleed cover image and property overview hero. Should be exterior, well-lit, and representative of the asset.", mediaType: "image" as const, required: true, maxCount: 1, order: 0 },
    { label: "Property Photo Gallery", description: "Interior and exterior photos used throughout the document.", mediaType: "image" as const, required: true, maxCount: 12, order: 1 },
    { label: "Aerial / Site Photo", description: "Aerial or drone shot showing site context and surroundings.", mediaType: "image" as const, required: false, maxCount: 2, order: 2 },
    { label: "Floor Plans", description: "Unit floor plans referenced in the Property Overview section.", mediaType: "image" as const, required: false, maxCount: 6, order: 3 },
    { label: "Agent Headshot(s)", description: "Used in the Team & Contact section.", mediaType: "image" as const, required: true, maxCount: 3, order: 4 },
  ];
  omMediaFields.forEach((m) => {
    const mid = id();
    ops.push(
      db.tx.collateralMediaField[mid].update({
        collateralTypeId: omId,
        label: m.label,
        description: m.description,
        mediaType: m.mediaType,
        required: m.required,
        maxCount: m.maxCount,
        order: m.order,
      })
    );
  });

  // —— TYPE 2: Multifamily BOV ——
  const bovId = id();
  ops.push(
    db.tx.collateralType[bovId].update({
      name: "Multifamily Broker Opinion of Value",
      slug: "multifamily-broker-opinion-of-value",
      description:
        "A concise valuation document presented to property owners. Typically 4–8 pages. Establishes the broker's recommended list price and supporting rationale. Print PDF only.",
      category: "Multifamily",
      aiIntent:
        "When generating this collateral type, always frame content from the perspective of advising the owner, not marketing to a buyer. The tone should be consultative and data-driven. Lead with the recommended value and support it with comps and market evidence.",
      outputTargets: outputTargets([
        { targetType: "print-pdf", briefOptionIds: [], layoutNotes: "" },
      ]),
      isDefault: true,
      isArchived: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
  );

  const bovSections = [
    {
      name: "Valuation Summary",
      description: "",
      contentGuidelines:
        "State the recommended value range clearly and immediately. Follow with a one-paragraph rationale. This is not a marketing section — it is a professional recommendation.",
      fields: sectionFields([
        { id: id(), label: "Recommended Value Low", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 0 },
        { id: id(), label: "Recommended Value High", fieldType: "number", helperText: "", placeholder: "", options: [], required: true, order: 1 },
        { id: id(), label: "Valuation Rationale", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: true, order: 2 },
      ]),
      order: 0,
    },
    {
      name: "Comparable Sales Analysis",
      description: "",
      contentGuidelines:
        "Present 3–5 comparable sales. For each, include address, sale date, price, price per unit, and cap rate if available. Draw a brief conclusion connecting the comps to the subject property.",
      fields: sectionFields([
        { id: id(), label: "Comparable Sales Data", fieldType: "textarea", helperText: "Broker-provided comp table data", placeholder: "", options: [], required: true, order: 0 },
      ]),
      order: 1,
    },
    {
      name: "Market Conditions",
      description: "",
      contentGuidelines:
        "Summarize current market conditions relevant to the valuation. Include absorption rates, investor demand, and interest rate environment. Keep to one page.",
      fields: sectionFields([
        { id: id(), label: "Market Conditions Notes", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: true, order: 0 },
      ]),
      order: 2,
    },
    {
      name: "Recommended Strategy",
      description: "",
      contentGuidelines:
        "Outline the recommended go-to-market strategy. Include suggested pricing approach, target buyer profile, and estimated timeline to close.",
      fields: sectionFields([
        { id: id(), label: "Recommended Strategy Notes", fieldType: "textarea", helperText: "", placeholder: "", options: [], required: true, order: 0 },
      ]),
      order: 3,
    },
    {
      name: "Team & Contact",
      description: "Same treatment as OM — brief, professional, license numbers included.",
      contentGuidelines: "Brief agent bio(s) and contact information. Professional tone. Include license numbers per Policy & Rules requirements.",
      fields: sectionFields([
        { id: id(), label: "Lead Agent Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 0 },
        { id: id(), label: "Lead Agent Title", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 1 },
        { id: id(), label: "Lead Agent License Number", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 2 },
        { id: id(), label: "Co-Agent Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 3 },
        { id: id(), label: "Co-Agent License Number", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 4 },
        { id: id(), label: "Brokerage Phone", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 5 },
        { id: id(), label: "Brokerage Email", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 6 },
      ]),
      order: 4,
    },
  ];
  bovSections.forEach((s) => {
    const sid = id();
    ops.push(
      db.tx.collateralSection[sid].update({
        collateralTypeId: bovId,
        name: s.name,
        description: s.description,
        contentGuidelines: s.contentGuidelines,
        fields: s.fields,
        order: s.order,
      })
    );
  });

  [
    { label: "Property Name", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 0 },
    { label: "Property Address", fieldType: "textarea" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 1 },
    { label: "Total Units", fieldType: "number" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 2 },
    { label: "Year Built", fieldType: "number" as const, placeholder: "", helperText: "", options: "[]", required: false, order: 3 },
    { label: "Current Occupancy", fieldType: "text" as const, placeholder: "e.g. 94%", helperText: "", options: "[]", required: false, order: 4 },
    { label: "Owner Name", fieldType: "text" as const, placeholder: "Used in salutation and framing", helperText: "", options: "[]", required: true, order: 5 },
  ].forEach((f) => {
    const fid = id();
    ops.push(
      db.tx.collateralGlobalField[fid].update({
        collateralTypeId: bovId,
        label: f.label,
        fieldType: f.fieldType,
        helperText: f.helperText,
        placeholder: f.placeholder,
        options: f.options,
        required: f.required,
        order: f.order,
      })
    );
  });

  [
    { label: "Property Exterior Photo", description: "Cover image. Exterior, professional quality.", mediaType: "image" as const, required: true, maxCount: 1, order: 0 },
    { label: "Agent Headshot(s)", description: "Team section.", mediaType: "image" as const, required: true, maxCount: 2, order: 1 },
  ].forEach((m) => {
    const mid = id();
    ops.push(
      db.tx.collateralMediaField[mid].update({
        collateralTypeId: bovId,
        label: m.label,
        description: m.description,
        mediaType: m.mediaType,
        required: m.required,
        maxCount: m.maxCount,
        order: m.order,
      })
    );
  });

  // —— TYPE 3: Multifamily Social Post ——
  const socialId = id();
  ops.push(
    db.tx.collateralType[socialId].update({
      name: "Multifamily Social Post",
      slug: "multifamily-social-post",
      description:
        "A single-image social media post announcing a new listing, a closed deal, or a market update. Optimized for LinkedIn and Instagram. Produces a composed image with text overlay.",
      category: "Multifamily",
      aiIntent:
        "When generating this collateral type, keep copy extremely concise. One headline, one supporting line, one call to action. The image carries the visual weight — copy supports it, does not compete with it. Never include more than 3 lines of text in the composition.",
      outputTargets: outputTargets([
        { targetType: "social-image", briefOptionIds: [], layoutNotes: "" },
      ]),
      isDefault: true,
      isArchived: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
  );

  [
    { name: "Headline", description: "", contentGuidelines: "Single line. Maximum 8 words. Punchy, specific, outcome-oriented. e.g. 'Just Listed: 48-Unit Value-Add in Phoenix' or '$18.5M Multifamily Portfolio — Now Closed.'", fields: sectionFields([{ id: id(), label: "Headline", fieldType: "text", helperText: "Max 80 chars", placeholder: "", options: [], required: true, order: 0 }]), order: 0 },
    { name: "Supporting Line", description: "", contentGuidelines: "One sentence. Adds context to the headline — key metric, location detail, or deal highlight. e.g. '5.8% Cap Rate | Tempe, AZ'", fields: sectionFields([{ id: id(), label: "Supporting Line", fieldType: "text", helperText: "Max 120 chars", placeholder: "", options: [], required: false, order: 0 }]), order: 1 },
    { name: "Call to Action", description: "", contentGuidelines: "Short directive. e.g. 'Contact us for the OM.' or 'Link in bio for details.' Maximum 10 words.", fields: sectionFields([{ id: id(), label: "Call to Action", fieldType: "text", helperText: "Max 80 chars", placeholder: "", options: [], required: false, order: 0 }]), order: 2 },
  ].forEach((s) => {
    const sid = id();
    ops.push(
      db.tx.collateralSection[sid].update({
        collateralTypeId: socialId,
        name: s.name,
        description: s.description,
        contentGuidelines: s.contentGuidelines,
        fields: s.fields,
        order: s.order,
      })
    );
  });

  [
    { label: "Post Type", fieldType: "select" as const, placeholder: "", helperText: "", options: JSON.stringify(["New Listing", "Just Closed", "Market Update", "Team News"]), required: true, order: 0 },
    { label: "Agent / Team Name", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: false, order: 1 },
  ].forEach((f) => {
    const fid = id();
    ops.push(
      db.tx.collateralGlobalField[fid].update({
        collateralTypeId: socialId,
        label: f.label,
        fieldType: f.fieldType,
        helperText: f.helperText,
        placeholder: f.placeholder,
        options: f.options,
        required: f.required,
        order: f.order,
      })
    );
  });

  const socialMedia = { label: "Background Image", description: "Full-bleed background of the composition. Property exterior or aerial preferred. Will be cropped to 1:1 for Instagram and 1.91:1 for LinkedIn — upload high resolution.", mediaType: "image" as const, required: true, maxCount: 1, order: 0 };
  ops.push(
    db.tx.collateralMediaField[id()].update({
      collateralTypeId: socialId,
      label: socialMedia.label,
      description: socialMedia.description,
      mediaType: socialMedia.mediaType,
      required: socialMedia.required,
      maxCount: socialMedia.maxCount,
      order: socialMedia.order,
    })
  );

  // —— TYPE 4: Multifamily Email Announcement ——
  const emailId = id();
  ops.push(
    db.tx.collateralType[emailId].update({
      name: "Multifamily Email Announcement",
      slug: "multifamily-email-announcement",
      description:
        "An HTML email announcing a new listing or investment opportunity to a broker's contact list. Inline HTML, deliverability-safe, single-column layout.",
      category: "Multifamily",
      aiIntent:
        "When generating this collateral type, write for a busy reader scanning on mobile. Subject line and preview text are critical — write these first. Body copy should be skimmable: short paragraphs, one idea per paragraph, clear CTA button. Never use background images in the email body — deliverability risk.",
      outputTargets: outputTargets([
        { targetType: "email-html", briefOptionIds: [], layoutNotes: "" },
      ]),
      isDefault: true,
      isArchived: false,
      createdAt: NOW,
      updatedAt: NOW,
    })
  );

  const emailSections = [
    { name: "Subject Line & Preview", description: "", contentGuidelines: "Subject line: 50 characters or fewer. Preview text: 90 characters or fewer. Both should work independently — assume the reader sees only the subject line.", fields: sectionFields([{ id: id(), label: "Subject Line", fieldType: "text", helperText: "Max 60 chars", placeholder: "", options: [], required: true, order: 0 }, { id: id(), label: "Preview Text", fieldType: "text", helperText: "Max 100 chars", placeholder: "", options: [], required: false, order: 1 }]), order: 0 },
    { name: "Header / Hero", description: "", contentGuidelines: "Property name as headline. Address and key stat (units, price, cap rate) as subhead. The hero image sits above this in the template — do not describe the image in copy.", fields: sectionFields([]), order: 1 },
    { name: "Body Copy", description: "", contentGuidelines: "2–3 short paragraphs. Open with the opportunity. Second paragraph: 2–3 key highlights as inline text (not bullets — some email clients strip list formatting). Close with the CTA.", fields: sectionFields([{ id: id(), label: "Key Highlights", fieldType: "textarea", helperText: "2–3 broker-provided bullet points converted to inline prose", placeholder: "", options: [], required: false, order: 0 }]), order: 2 },
    { name: "Call to Action", description: "", contentGuidelines: "Single CTA button. Label should be action-oriented. e.g. 'Request the OM' or 'View the Offering'. Do not use 'Click Here'.", fields: sectionFields([{ id: id(), label: "CTA Label", fieldType: "text", helperText: "e.g. Request the OM", placeholder: "", options: [], required: true, order: 0 }, { id: id(), label: "CTA URL", fieldType: "text", helperText: "", placeholder: "", options: [], required: true, order: 1 }]), order: 3 },
    { name: "Footer", description: "", contentGuidelines: "Agent name, license number, brokerage name, unsubscribe placeholder. Keep to 2–3 lines. License number required per Policy.", fields: sectionFields([{ id: id(), label: "Agent Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 0 }, { id: id(), label: "Agent License Number", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 1 }, { id: id(), label: "Brokerage Name", fieldType: "text", helperText: "", placeholder: "", options: [], required: false, order: 2 }]), order: 4 },
  ];
  emailSections.forEach((s) => {
    const sid = id();
    ops.push(
      db.tx.collateralSection[sid].update({
        collateralTypeId: emailId,
        name: s.name,
        description: s.description,
        contentGuidelines: s.contentGuidelines,
        fields: s.fields,
        order: s.order,
      })
    );
  });

  [
    { label: "Property Name", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 0 },
    { label: "Property Address", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: true, order: 1 },
    { label: "Asking Price", fieldType: "number" as const, placeholder: "", helperText: "", options: "[]", required: false, order: 2 },
    { label: "Cap Rate", fieldType: "text" as const, placeholder: "", helperText: "", options: "[]", required: false, order: 3 },
    { label: "Total Units", fieldType: "number" as const, placeholder: "", helperText: "", options: "[]", required: false, order: 4 },
  ].forEach((f) => {
    const fid = id();
    ops.push(
      db.tx.collateralGlobalField[fid].update({
        collateralTypeId: emailId,
        label: f.label,
        fieldType: f.fieldType,
        helperText: f.helperText,
        placeholder: f.placeholder,
        options: f.options,
        required: f.required,
        order: f.order,
      })
    );
  });

  [
    { label: "Hero Property Photo", description: "Displayed at the top of the email above the headline. Hosted externally — must be a public URL after upload. 600px wide minimum, 2:1 aspect ratio preferred.", mediaType: "image" as const, required: true, maxCount: 1, order: 0 },
    { label: "Agent Headshot", description: "Displayed in the email footer alongside agent info.", mediaType: "image" as const, required: false, maxCount: 1, order: 1 },
  ].forEach((m) => {
    const mid = id();
    ops.push(
      db.tx.collateralMediaField[mid].update({
        collateralTypeId: emailId,
        label: m.label,
        description: m.description,
        mediaType: m.mediaType,
        required: m.required,
        maxCount: m.maxCount,
        order: m.order,
      })
    );
  });

  await db.transact(ops as Parameters<typeof db.transact>[0]);
}
