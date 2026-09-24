import Link from "next/link";
import AppContainer from "../../components/AppContainer";
import PhotoGallery from "../../components/pictures/PhotoGallery";
import { getPhotoCategoryPage } from "../../lib/server/content";

export default function PictureCategory({ category, photos }) {
  return (
    <AppContainer title={category.name} curMenu="Pictures" description={category.description}>
      <header className="flex flex-wrap items-center justify-between gap-6 px-5 py-8 sm:px-10">
        <div>
          <Link
            href="/pictures"
            className="cursor-pointer text-2xs font-bold uppercase tracking-wider text-pmred"
          >
            ← All pictures
          </Link>
          <h1 className="mt-4 text-xl font-extrabold uppercase tracking-wider wrap-anywhere">
            {category.name}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">{category.description}</p>
        </div>
        <p className="text-sm text-neutral-500">
          {photos.length} {photos.length === 1 ? "photograph" : "photographs"}
        </p>
      </header>
      {photos.length ? (
        <PhotoGallery key={category.id} photos={photos} polaroids={category.id === "polaroids"} />
      ) : (
        <p className="px-6 py-24 text-center text-sm text-neutral-500">
          New photographs are on the way.
        </p>
      )}
    </AppContainer>
  );
}

// Rendered on first request, so categories created in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const page = await getPhotoCategoryPage(params.category);
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: page, revalidate: 60 };
}
