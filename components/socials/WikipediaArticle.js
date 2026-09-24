import Image from "next/image";
import Link from "next/link";

export default function WikipediaArticle({ article }) {
  const contents = [
    ...article.sections.map(({ id, title }) => ({ id, title })),
    { id: "discography", title: "Selected discography" },
    { id: "references", title: "References" }
  ];
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-10 lg:grid-cols-[180px_1fr] lg:py-14">
      <nav aria-label="Article contents" className="self-start lg:sticky lg:top-24">
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
        <h1 className="border-b border-neutral-200 pb-4 font-serif text-4xl">{article.title}</h1>
        <p className="mt-3 text-xs text-neutral-500">{article.subtitle}</p>
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
              priority
              className="object-cover"
            />
          </div>
          <p className="my-3 text-center text-[10px] text-neutral-500">
            From the studio photo archive
          </p>
          <dl className="space-y-3">
            {article.facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[75px_1fr] gap-2 text-xs leading-5">
                <dt className="font-semibold">{label}</dt>
                <dd className="text-neutral-600">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
        <p className="font-serif text-lg leading-8 text-neutral-700">{article.intro}</p>
        {article.sections.map((section) => (
          <section id={section.id} key={section.id} className="mt-9 scroll-mt-24">
            <h2 className="mb-4 border-b border-neutral-200 pb-2 font-serif text-2xl">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-4 text-sm leading-7 text-neutral-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
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
                {article.discography.map((release) => (
                  <tr key={release[1]} className="border-b border-neutral-200">
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
        <section id="references" className="mt-9 scroll-mt-24">
          <h2 className="mb-4 border-b border-neutral-200 pb-2 font-serif text-2xl">References</h2>
          <ol className="list-inside list-decimal space-y-3 text-xs text-neutral-500">
            {article.references.map((reference) => (
              <li key={reference.href}>
                <Link href={reference.href} className="cursor-pointer text-pmred hover:underline">
                  {reference.title}
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[10px] text-neutral-400">
            Last edited 22 September 2026 · Projct Music studio archive
          </p>
        </section>
      </article>
    </div>
  );
}
