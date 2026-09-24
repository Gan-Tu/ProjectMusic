import Link from "next/link";
import CrmLayout from "../../../components/crm/CrmLayout";
import EntityListView from "../../../components/crm/EntityListView";
import { ENTITIES, SECTIONS, SECTION_GROUPS } from "../../../components/crm/entityDefs";
import { classNames } from "../../../lib/format";
import { crmPage } from "../../../lib/server/crm/guard";

export const getServerSideProps = crmPage(async ({ params }) =>
  Object.hasOwn(SECTIONS, params.section)
    ? { props: { section: params.section } }
    : { notFound: true }
);

export function SectionTabs({ section }) {
  const group = SECTION_GROUPS.find((sections) => sections.includes(section));
  if (!group) return null;
  return (
    <nav aria-label="Sections" className="mb-5 flex gap-2">
      {group.map((item) => {
        const active = item === section;
        return (
          <Link
            key={item}
            href={`/crm/${item}`}
            aria-current={active ? "page" : undefined}
            className={classNames(
              "inline-flex items-center rounded-full border px-4 py-2 text-2xs font-bold uppercase tracking-wider transition-colors max-sm:min-h-10",
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-pmred hover:text-pmred"
            )}
          >
            {ENTITIES[SECTIONS[item]].plural}
          </Link>
        );
      })}
    </nav>
  );
}

const VIEW = {
  albums: "/musics",
  videos: "/videos",
  events: "/events",
  products: "/shop",
  photos: "/pictures",
  posts: "/news",
  social_networks: "/socials",
  product_categories: "/shop",
  photo_categories: "/pictures",
  social_posts: "/socials"
};

export default function SectionList({ section }) {
  const entity = SECTIONS[section];
  const def = ENTITIES[entity];
  return (
    <CrmLayout title={def.plural} viewHref={VIEW[entity] || "/"}>
      <SectionTabs section={section} />
      <EntityListView key={entity} entity={entity} />
    </CrmLayout>
  );
}
