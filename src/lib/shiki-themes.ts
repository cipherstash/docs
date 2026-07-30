interface CodePalette {
  bg: string;
  fg: string;
  com: string;
  kw: string;
  fn: string;
  typ: string;
  str: string;
  num: string;
  pun: string;
}

function cipherstashTheme(
  name: string,
  type: "light" | "dark",
  c: CodePalette,
) {
  return {
    name,
    type,
    colors: {
      "editor.background": c.bg,
      "editor.foreground": c.fg,
    },
    settings: [
      { settings: { background: c.bg, foreground: c.fg } },
      {
        scope: ["comment", "punctuation.definition.comment", "string.comment"],
        settings: { foreground: c.com, fontStyle: "italic" },
      },
      {
        scope: [
          "keyword",
          "keyword.control",
          "keyword.other",
          "keyword.operator.new",
          "keyword.operator.expression",
          "keyword.operator.logical",
          "storage",
          "storage.type",
          "storage.modifier",
          "variable.language",
          "entity.name.tag",
          "punctuation.definition.tag",
        ],
        settings: { foreground: c.kw },
      },
      {
        scope: [
          "entity.name.function",
          "support.function",
          "meta.function-call",
          "meta.function-call.generic",
          "variable.function",
        ],
        settings: { foreground: c.fn },
      },
      {
        scope: [
          "entity.name.type",
          "entity.name.class",
          "support.type",
          "support.class",
          "entity.other.inherited-class",
          "entity.name.namespace",
          "support.type.property-name",
          "meta.object-literal.key",
          "entity.other.attribute-name",
        ],
        settings: { foreground: c.typ },
      },
      {
        scope: [
          "string",
          "string.quoted",
          "string.template",
          "string.regexp",
          "punctuation.definition.string",
        ],
        settings: { foreground: c.str },
      },
      {
        scope: [
          "constant.numeric",
          "constant.language",
          "constant.character",
          "constant.other",
          "support.constant",
        ],
        settings: { foreground: c.num },
      },
      {
        scope: [
          "punctuation",
          "keyword.operator",
          "meta.brace",
          "punctuation.separator",
          "punctuation.terminator",
        ],
        settings: { foreground: c.pun },
      },
      {
        scope: ["variable", "variable.other", "variable.parameter"],
        settings: { foreground: c.fg },
      },
    ],
  };
}

export const cipherstashDark = cipherstashTheme("cipherstash-dark", "dark", {
  bg: "#0b0b0a",
  fg: "#eae8dd",
  com: "#8f8f8f",
  kw: "#d77595",
  fn: "#d2a8ff",
  typ: "#7fd0c4",
  str: "#c8f031",
  num: "#f4dd63",
  pun: "#9a9486",
});

export const cipherstashLight = cipherstashTheme("cipherstash-light", "light", {
  bg: "#faf9f4",
  fg: "#2b2822",
  com: "#7a7a7a",
  kw: "#a63057",
  fn: "#8250df",
  typ: "#1c8577",
  str: "#567d0d",
  num: "#977c11",
  pun: "#6b6559",
});
