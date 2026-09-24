import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import CrmLayout from "../../../components/crm/CrmLayout";
import EntityEditor from "../../../components/crm/EntityEditor";
import { ENTITIES, SECTIONS, crmPath } from "../../../components/crm/entityDefs";
import { crmPage } from "../../../lib/server/crm/guard";

export const getServerSideProps = crmPage(async ({ params }) =>
  Object.hasOwn(SECTIONS, params.section)
    ? { props: { section: params.section, id: params.id } }
    : { notFound: true }
);

export default function SectionEditor({ section, id }) {
  const router = useRouter();
  const entity = SECTIONS[section];
  const def = ENTITIES[entity];
  const isNew = id === "new";
  if (isNew && def.canCreate === false) {
    return (
      <CrmLayout title={def.plural}>
        <p className="text-sm">{def.plural} can&apos;t be created in the CRM.</p>
      </CrmLayout>
    );
  }
  const prefill = Object.fromEntries(
    Object.entries(router.query).filter(([key]) => key !== "section" && key !== "id")
  );
  return (
    <CrmLayout title={isNew ? `New ${def.label.toLowerCase()}` : def.label}>
      <Link
        href={crmPath(entity)}
        className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-neutral-500 transition hover:text-pmred"
      >
        <ArrowLeftIcon className="h-4 w-4" /> All {def.plural.toLowerCase()}
      </Link>
      <EntityEditor key={`${entity}:${id}`} entity={entity} id={id} prefill={prefill} />
    </CrmLayout>
  );
}
