import AppContainer from "../../components/AppContainer";
import { getBlogs } from "../../utils/getFakeBlogs";
import Link from "next/link";
import ArticleCard from "../../components/ArticleCard";

export default function NewsHome({ blogData }) {
  return (
    <AppContainer curMenu={"Blog"}>
      <div className="bg-neutral-100">
        <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {blogData?.map((x, i) => (
            <Link href={`/blog/${i}`} key={`blog-${i}`}>
              <li className="flex bg-white h-96">
                <ArticleCard
                  imgUrl={x.imgUrl}
                  imgAlt={`Cover ${i}`}
                  title={x.title}
                  date={x.date}
                  author={x.author}
                  snippet={x.snippet}
                />
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </AppContainer>
  );
}

export async function getStaticProps() {
  return {
    props: {
      blogData: getBlogs()
    }
  };
}
