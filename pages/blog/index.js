import ArticleList from "../../components/content/ArticleList";
import { getBlogs } from "../../utils/getFakeBlogs";

export default function BlogsPage({ posts }) {
  return <ArticleList posts={posts} section="blog" />;
}

export async function getStaticProps() {
  return { props: { posts: getBlogs() } };
}
