import ArticleList from "../../components/content/ArticleList";
import { getNews } from "../../utils/getFakeNews";

export default function NewsPage({ posts }) {
  return <ArticleList posts={posts} section="news" />;
}

export async function getStaticProps() {
  return { props: { posts: getNews() } };
}
