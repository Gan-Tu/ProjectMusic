import ArticleDetail from "../../components/content/ArticleDetail";
import { getNews, getNewsById, getRelatedNews } from "../../utils/getFakeNews";

export default function NewsDetail({ post, related }) {
  return <ArticleDetail post={post} related={related} section="news" />;
}

export async function getStaticPaths() {
  return { paths: getNews().map((post) => ({ params: { id: String(post.id) } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const post = getNewsById(params.id);
  if (!post) return { notFound: true };
  return { props: { post, related: getRelatedNews(params.id) } };
}
