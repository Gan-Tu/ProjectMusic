import { HttpError } from "../http";

// Structure checks for site_settings values the public site renders directly.
// Errors name the exact field, e.g. "wikipedia_article.sections[1].paragraphs".

const isText = (value) => typeof value === "string";
const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function fail(path, message) {
  throw new HttpError(400, `Wikipedia article: ${path} ${message}`, {
    field: `wikipedia_article${path.startsWith("[") ? "" : "."}${path}`
  });
}

// Shape used by components/socials/WikipediaArticle.js.
export function validateWikipediaArticle(article) {
  if (!isObject(article)) {
    throw new HttpError(400, "Wikipedia article: must be a JSON object.", {
      field: "wikipedia_article"
    });
  }
  for (const key of ["title", "subtitle", "intro"]) {
    if (!isText(article[key])) fail(key, "must be text.");
  }
  if (!Array.isArray(article.facts)) fail("facts", "must be a list of [label, value] pairs.");
  article.facts.forEach((fact, index) => {
    if (!Array.isArray(fact) || fact.length !== 2 || !fact.every(isText)) {
      fail(`facts[${index}]`, "must be a [label, value] pair of text.");
    }
  });
  if (!Array.isArray(article.sections)) fail("sections", "must be a list of sections.");
  article.sections.forEach((section, index) => {
    const at = `sections[${index}]`;
    if (!isObject(section)) fail(at, "must be an object with id, title and paragraphs.");
    if (!isText(section.id) || !section.id.trim()) fail(`${at}.id`, "must be non-empty text.");
    if (!isText(section.title)) fail(`${at}.title`, "must be text.");
    if (!Array.isArray(section.paragraphs) || !section.paragraphs.every(isText)) {
      fail(`${at}.paragraphs`, "must be a list of text paragraphs.");
    }
  });
  if (!Array.isArray(article.discography)) {
    fail("discography", "must be a list of [year, title, type, role] rows.");
  }
  article.discography.forEach((row, index) => {
    const cells = Array.isArray(row) && row.length === 4;
    if (!cells || !row.every((cell) => isText(cell) || Number.isFinite(cell))) {
      fail(`discography[${index}]`, "must be [year, title, type, role].");
    }
  });
  if (!Array.isArray(article.references)) fail("references", "must be a list of { title, href }.");
  article.references.forEach((reference, index) => {
    const at = `references[${index}]`;
    if (!isObject(reference)) fail(at, "must be an object with title and href.");
    if (!isText(reference.title)) fail(`${at}.title`, "must be text.");
    if (!isText(reference.href) || !reference.href.trim()) fail(`${at}.href`, "must be a link.");
  });
  return article;
}
