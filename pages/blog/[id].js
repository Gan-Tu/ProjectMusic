import AppContainer from "../../components/AppContainer";
import Image from "next/image";
import { getBlogsById, getRelatedBlogs } from "../../utils/getFakeBlogs";
import ArticleCard from "../../components/ArticleCard";
import Link from "next/link";

export default function BlogDetail({ blogData, relatedBlogs }) {
  return (
    <AppContainer curMenu={"Blog"}>
      <div className="bg-gray-100">
        <div className="relative isolate overflow-hidden bg-gray-900 py-72 sm:py-32">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
            layout="fill"
            objectFit="cover"
            objectPosition="left"
            alt={`News Article Cover`}
            className="absolute inset-0  -z-10 h-full w-full object-cover object-right md:object-center"
          />
          <div className="mx-auto pt-20 max-w-7xl px-6 lg:px-8 my-20">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-pmred uppercase">
                {blogData.title}
              </h2>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-8 py-10 bg-white">
          <div className="flex flex-col col-start-2 col-end-6 space-y-10 leading-loose text-neutral-700 pb-10 font-light">
            <h2 className="text-neutral-400 text-sm">
              <span>Posted on Aug 27th, 2014</span>
              <span className="text-pmred font-semibold pl-2">Nick Breton</span>
            </h2>
            <p>
              Today Tish released an acoustic version of the song &quot;All That
              I Can Do&quot; with producer and guitar player Dave Kunchio. This
              song developed from a writing session we had not too long ago.
              Dave and Tish have amazing creative chemistry together watching
              them work is a real treat. Dave played through a lot of chords and
              progressions before landing on an idea and Tish almost immediately
              started with the melody for the chorus. Once we laid down a melody
              guide track she write the lyrics to fill it in and we knocked out
              the hook. Dave wrote a change for the verse and we laid out the
              arrangement musically then Tish started to write her verses. I was
              shocked how fast she works, had the first verse in about 15
              minutes. We recorded it within a few takes and she came out to
              listen, wrote the second verse and recorded it in similar fashion
              and we had it done in a relatively short period of time. So much
              fun working like this with insanely talented musicians.
            </p>
            <p>
              We let the track sit for a few weeks not knowing what we were
              going to do next. I got a call saying they wanted to release it
              within 24 hours and knocked out the mix. Given that I had to fit
              this in urgently I didn&apos;t get to spend as much time as I
              wanted. When the video is released they will use the mix that
              treated the sibilance better. Hurts my heart when things go out
              that aren&apos;t 100% right because I know how much it means to
              have it done right. Can&apos;t stress the importance of detail in
              a mix.
            </p>
            <div className="border-t py-6 border-gray-200 uppercase transparent-selection">
              <span className="text-pmred cursor-pointer font-semibold px-4 border-r border-gray-300">
                Comment
              </span>
              <span className="text-pmred cursor-pointer font-semibold px-4">
                Share
              </span>
            </div>
          </div>
          <div className="col-start-6 col-end-9 space-x-2 space-y-2 px-10 flex flex-col">
            <div className="relative flex h-80 w-80 cursor-pointer aspect-square">
              <Image
                src={blogData.imgUrl}
                layout="fill"
                objectFit="cover"
                objectPosition="left"
                alt={`News Article Cover`}
                className="object-cover"
              />
            </div>
            <div className="w-80">
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-neutral-200 text-neutral-400">
                D12
              </button>
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-neutral-200 text-neutral-400">
                Denaun Porter
              </button>
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-neutral-200 text-neutral-400">
                Eminem
              </button>
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-pmred text-white">
                Mr Porter
              </button>
              <button
                className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold 
            max-w-fit bg-neutral-200 text-neutral-400"
              >
                Recording Studio
              </button>
              <button
                className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold 
              max-w-fit bg-neutral-200 text-neutral-400"
              >
                Los Angeles
              </button>
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-pmred text-white">
                Truth Studios
              </button>
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-neutral-200 text-neutral-400">
                Robert Glasper
              </button>
              <button className="uppercase rounded-full cursor-pointer px-4 py-1 items-center text-xs click-animation font-semibold max-w-fit bg-neutral-200 text-neutral-400">
                Rober Experiment
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white mb-10">
          <h1 className="uppercase font-bold text-neutral-800 px-10 py-10 my-2">
            Related Blogs
          </h1>
          <div className="grid grid-cols-2">
            {relatedBlogs.map((x) => (
              <Link href={`/blog/${x.id}`} key={`relatedBlog-${x.id}`}>
                <div className="col-span-1">
                  <ArticleCard
                    imgUrl={x.imgUrl}
                    imgAlt={`Related Blog Cover ${x.id}`}
                    title={x.title}
                    date={x.date}
                    author={x.author}
                    snippet={x.snippet}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppContainer>
  );
}

export async function getServerSideProps({ params: { id } }) {
  return {
    props: {
      blogData: getBlogsById(id),
      relatedBlogs: getRelatedBlogs(id)
    }
  };
}
