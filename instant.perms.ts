/**
 * Artemis Reframe — InstantDB permissions.
 * Storage requires $files allow.create and allow.view.
 */

const rules = {
  $files: {
    allow: {
      view: "true",
      create: "true",
      delete: "true",
    },
  },
  elementalAssets: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  brief: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  briefSection: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  briefScreenshot: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  briefMeta: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  project: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  projectOutput: {
    allow: {
      view: "true",
      update: "true",
    },
  },
  userProfile: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
};

export default rules;
