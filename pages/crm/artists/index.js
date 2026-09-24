import CrmLayout from "../../../components/crm/CrmLayout";
import EntityListView from "../../../components/crm/EntityListView";
import { crmPage } from "../../../lib/server/crm/guard";

export const getServerSideProps = crmPage();

export default function ArtistsPage() {
  return (
    <CrmLayout title="Artists" viewHref="/artists">
      <p className="mb-5 max-w-3xl text-sm leading-6 text-neutral-600">
        Every artist is a hub: open one to manage the profile and all linked music, videos, photos,
        events, merch, posts and comments — and choose where each item shows on the site.
      </p>
      <EntityListView entity="artists" createHref="/crm/artists/new" defaultView="grid" />
    </CrmLayout>
  );
}
