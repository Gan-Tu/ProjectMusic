import AppContainer from "../../components/AppContainer";
import { getNews } from "../../utils/getFakeNews";
import Link from "next/link";
import ArticleCard from "../../components/ArticleCard";

export default function NewsHome({ newsData }) {
  return (
    <AppContainer curMenu={"News"}>
      <div className="bg-neutral-100">
        <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {newsData?.map((x, i) => (
            <Link href={`/news/${i}`} key={`news-${i}`}>
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
      newsData: getNews()
    }
  };
}
