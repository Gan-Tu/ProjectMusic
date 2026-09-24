import ArticleDetail from "../../components/content/ArticleDetail";
import { getPostPage } from "../../lib/server/content";

export default function BlogsDetail({ post, related }) {
  return <ArticleDetail post={post} related={related} section="blog" />;
}

// Rendered on first request, so posts created in the CRM work without a rebuild.
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const page = await getPostPage("blog", params.id);
  if (!page) return { notFound: true, revalidate: 60 };
  return { props: page, revalidate: 60 };
}
