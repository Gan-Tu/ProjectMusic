import Image from "next/image";

export default function ArticleCard({
  imgUrl,
  imageAlt,
  title,
  date,
  author,
  snippet
}) {
  return (
    <div className="flex h-96">
      <div className="relative flex-grow cursor-pointer">
        <Image
          src={imgUrl}
          layout="fill"
          objectFit="cover"
          objectPosition="left"
          alt={imageAlt}
          className="hover:scale-105 transition-all duration-200 opacity-90 hover:opacity-100 object-cover"
        />
      </div>
      <div className="flex cursor-pointer flex-1 my-4">
        <div className="flex flex-col flex-1 p-10 space-y-6 transparent-selection">
          <div>
            <h1 className="font-extrabold text-lg uppercase">{title}</h1>
            <h2 className="text-neutral-400 text-sm">
              <span>Posted on {date}</span>
              <span className="text-pmred font-semibold pl-2">{author}</span>
            </h2>
          </div>
          <h2 className="text-neutral-400 font-light text-sm leading-relaxed border-y py-3 border-gray-200">
            {snippet}
          </h2>
          <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation border-pmred border-2 text-pmred font-semibold max-w-fit">
            Read More
          </button>
        </div>
      </div>
    </div>
  );
}
