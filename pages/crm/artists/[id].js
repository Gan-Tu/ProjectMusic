import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import CrmLayout from "../../../components/crm/CrmLayout";
import ArtistHub from "../../../components/crm/ArtistHub";
import EntityEditor from "../../../components/crm/EntityEditor";
import { crmPage } from "../../../lib/server/crm/guard";
import { sql } from "../../../lib/server/db";

export const getServerSideProps = crmPage(async ({ params }) => {
  if (params.id === "new") return { props: { id: "new", name: "New artist" } };
  const [row] = await sql.query("select id, name from artists where id = $1", [params.id]);
  return row ? { props: { id: row.id, name: row.name } } : { notFound: true };
});

export default function ArtistPage({ id, name }) {
  return (
    <CrmLayout title={name} viewHref={id === "new" ? "/artists" : `/artists/${id}`}>
      <Link
        href="/crm/artists"
        className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-neutral-500 transition hover:text-pmred"
      >
        <ArrowLeftIcon className="h-4 w-4" /> All artists
      </Link>
      {id === "new" ? (
        <EntityEditor key="new" entity="artists" id="new" prefill={{ placements: "directory" }} />
      ) : (
        <ArtistHub key={id} id={id} />
      )}
    </CrmLayout>
  );
}
