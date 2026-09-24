import ArticleList from "../../components/content/ArticleList";
import { listPosts } from "../../lib/server/content";

export default function NewsPage({ posts }) {
  return <ArticleList posts={posts} section="news" />;
}

export async function getStaticProps() {
  return { props: { posts: await listPosts("news") }, revalidate: 60 };
}
