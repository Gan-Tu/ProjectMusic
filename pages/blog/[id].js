import ArticleDetail from "../../components/content/ArticleDetail";
import { getBlogs, getBlogsById, getRelatedBlogs } from "../../utils/getFakeBlogs";

export default function BlogsDetail({ post, related }) {
  return <ArticleDetail post={post} related={related} section="blog" />;
}

export async function getStaticPaths() {
  return {
    paths: getBlogs().map((post) => ({ params: { id: String(post.id) } })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const post = getBlogsById(params.id);
  if (!post) return { notFound: true };
  return { props: { post, related: getRelatedBlogs(params.id) } };
}
