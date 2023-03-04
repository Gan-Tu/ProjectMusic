import AppContainer from "../../components/AppContainer";
import Image from "next/image";
import { getNews } from "../../utils/getFakeNews";

export default function NewsHome({ newsData }) {
  return (
    <AppContainer curMenu={"News"}>
      <div className="bg-neutral-100">
        <ul role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {newsData?.map((x, i) => (
            <li className="flex bg-white h-96" key={`news-${i}`}>
              <div className="relative flex-grow cursor-pointer">
                <Image
                  src={x.imgUrl}
                  layout="fill"
                  objectFit="cover"
                  objectPosition="left"
                  alt={`News Cover ${i}`}
                  className="hover:scale-105 transition-all duration-200 opacity-90 hover:opacity-100 object-cover"
                />
              </div>
              <div className="flex cursor-pointer flex-1 my-4">
                <div className="flex flex-col flex-1 p-10 space-y-6 transparent-selection">
                  <div>
                    <h1 className="font-extrabold text-lg uppercase">
                      {x.title}
                    </h1>
                    <h2 className="text-neutral-400 text-sm">
                      <span>Posted on {x.date}</span>
                      <span className="text-pmred font-semibold pl-2">
                        {x.author}
                      </span>
                    </h2>
                  </div>
                  <h2 className="text-neutral-400 font-light text-sm leading-relaxed border-y py-3 border-gray-200">
                    {x.snippet}
                  </h2>
                  <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation border-pmred border-2 text-pmred font-semibold max-w-fit">
                    Read More
                  </button>
                </div>
              </div>
            </li>
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
