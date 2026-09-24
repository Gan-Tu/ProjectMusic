import Image from "../ui/SmartImage";
import Link from "next/link";

const list = (value) => (Array.isArray(value) ? value : []);
const anchor = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// The article comes from the CRM (site settings), so every part is optional.
function normalize(article) {
  const sections = list(article?.sections)
    .filter((section) => section && typeof section === "object")
    .map((section, index) => ({
      id: `${anchor(section.id || section.title) || "section"}-${index + 1}`,
      title: String(section.title || ""),
      paragraphs: list(section.paragraphs).filter((p) => typeof p === "string" && p.trim())
    }))
    .filter((section) => section.title || section.paragraphs.length);
  return {
    title: String(article?.title || "Truth Studios"),
    subtitle: String(article?.subtitle || ""),
    intro: String(article?.intro || ""),
    sections,
    facts: list(article?.facts).filter((fact) => Array.isArray(fact) && fact[0]),
    discography: list(article?.discography).filter((row) => Array.isArray(row) && row.length),
    references: list(article?.references).filter((ref) => ref?.href && ref?.title)
  };
}

export default function WikipediaArticle({ article: raw }) {
  const article = normalize(raw);
  const contents = [
    ...article.sections.filter((section) => section.title),
    ...(article.discography.length ? [{ id: "discography", title: "Selected discography" }] : []),
    ...(article.references.length ? [{ id: "references", title: "References" }] : [])
  ];
  return (
    <div
      className={`mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-10 lg:py-14 ${contents.length ? "lg:grid-cols-[180px_1fr]" : ""}`}
    >
      <nav
        aria-label="Article contents"
        hidden={!contents.length}
        className="self-start lg:sticky lg:top-24"
      >
        <h2 className="border-b border-neutral-200 pb-3 text-xs font-bold uppercase tracking-wider">
          Contents
        </h2>
        <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-3 lg:block lg:space-y-4">
          {contents.map((section, index) => (
            <li key={section.id} className="text-xs">
              <a
                href={`#${section.id}`}
                className="cursor-pointer leading-5 text-neutral-500 hover:text-pmred"
              >
                <span className="mr-2 text-pmred">{index + 1}</span>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="min-w-0">
        <h1 className="border-b border-neutral-200 pb-4 font-serif text-4xl wrap-anywhere">
          {article.title}
        </h1>
        {article.subtitle && <p className="mt-3 text-xs text-neutral-500">{article.subtitle}</p>}
        <p className="my-6 border-l-2 border-pmred pl-4 text-xs leading-5 text-neutral-500">
          From the Projct Music archive. This is a demo article, not an official Wikipedia page. The
          release chronology below is fictional.
        </p>
        <aside
          aria-label="Truth Studios facts"
          className="mb-8 border border-neutral-200 bg-neutral-50 p-4 sm:float-right sm:ml-8 sm:w-64"
        >
          <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wider">
            Truth Studios
          </h2>
          <div className="relative aspect-square">
            <Image
              src="/socials/studio-01.webp"
              alt="Electric guitar in the recording studio"
              fill
              sizes="(max-width: 639px) 90vw, 224px"
              preload
              className="object-cover"
            />
          </div>
          <p className="my-3 text-center text-2xs text-neutral-500">
            From the studio photo archive
          </p>
          {article.facts.length > 0 && (
            <dl className="space-y-3">
              {article.facts.map(([label, value], index) => (
                <div key={index} className="grid grid-cols-[75px_1fr] gap-2 text-xs leading-5">
                  <dt className="font-semibold">{label}</dt>
                  <dd className="text-neutral-600">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </aside>
        {article.intro && (
          <p className="font-serif text-lg leading-8 text-neutral-700">{article.intro}</p>
        )}
        {article.sections.map((section) => (
          <section id={section.id} key={section.id} className="mt-9 scroll-mt-24">
            {section.title && (
              <h2 className="mb-4 border-b border-neutral-200 pb-2 font-serif text-2xl">
                {section.title}
              </h2>
            )}
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 text-sm leading-7 text-neutral-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        {article.discography.length > 0 && (
          <section id="discography" className="clear-both scroll-mt-24 pt-8">
            <h2 className="mb-5 border-b border-neutral-200 pb-2 font-serif text-2xl">
              Selected discography
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <caption className="sr-only">
                  Fictional releases from the Projct Music studio archive
                </caption>
                <thead className="bg-neutral-100">
                  <tr>
                    {["Year", "Title", "Format", "Credit"].map((heading) => (
                      <th scope="col" key={heading} className="px-4 py-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {article.discography.map((release, row) => (
                    <tr key={row} className="border-b border-neutral-200">
                      {release.map((value, index) => (
                        <td
                          key={index}
                          className={`px-4 py-4 ${index === 1 ? "font-semibold" : "text-neutral-500"}`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <section id="references" className="clear-both mt-9 scroll-mt-24">
          {article.references.length > 0 && (
            <>
              <h2 className="mb-4 border-b border-neutral-200 pb-2 font-serif text-2xl">
                References
              </h2>
              <ol className="list-inside list-decimal space-y-3 text-xs text-neutral-500">
                {article.references.map((reference, index) => (
                  <li key={index}>
                    <Link
                      href={reference.href}
                      className="cursor-pointer text-pmred hover:underline"
                    >
                      {reference.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )}
          <p className="mt-8 text-2xs text-neutral-500">
            Last edited 22 September 2026 · Projct Music studio archive
          </p>
        </section>
      </article>
    </div>
  );
}
