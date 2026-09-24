import ArticleList from "../../components/content/ArticleList";
import { listPosts } from "../../lib/server/content";

export default function BlogsPage({ posts }) {
  return <ArticleList posts={posts} section="blog" />;
}

export async function getStaticProps() {
  return { props: { posts: await listPosts("blog") }, revalidate: 60 };
}
