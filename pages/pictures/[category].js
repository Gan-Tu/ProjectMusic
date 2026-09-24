import Link from "next/link";
import AppContainer from "../../components/AppContainer";
import PhotoGallery from "../../components/pictures/PhotoGallery";
import { PHOTO_CATEGORIES, getPhotos } from "../../utils/getFakePhotos";

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
          <h1 className="mt-4 text-xl font-extrabold uppercase tracking-wider">{category.name}</h1>
          <p className="mt-2 text-sm text-neutral-500">{category.description}</p>
        </div>
        <p className="text-sm text-neutral-400">{photos.length} photographs</p>
      </header>
      <PhotoGallery key={category.id} photos={photos} polaroids={category.id === "polaroids"} />
    </AppContainer>
  );
}

export function getStaticPaths() {
  return {
    paths: PHOTO_CATEGORIES.map((category) => ({ params: { category: category.id } })),
    fallback: "blocking"
  };
}

export function getStaticProps({ params }) {
  const category = PHOTO_CATEGORIES.find((item) => item.id === params.category);
  if (!category) return { notFound: true };
  return { props: { category, photos: getPhotos(category.id) } };
}
