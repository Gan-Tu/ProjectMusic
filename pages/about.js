import AppContainer from "../components/AppContainer";
import Image from "next/image";

const links = [
  { name: "Open roles", href: "#" },
  { name: "Internship program", href: "#" },
  { name: "Our values", href: "#" },
  { name: "Meet our leadership", href: "#" }
];
const stats = [
  { name: "Offices worldwide", value: "12" },
  { name: "Full-time colleagues", value: "300+" },
  { name: "Hours per week", value: "40" },
  { name: "Paid time off", value: "Unlimited" }
];

export default function AboutHome() {
  return (
    <AppContainer curMenu={"About"}>
      <div className="bg-neutral-100">
        <div className="relative isolate overflow-hidden bg-gray-900 py-60">
          <div className="h-full w-full object-cover absolute inset-0 md:object-center blur-ms brightness-50 aspect-square -z-10">
            <Image
              src="https://images.unsplash.com/photo-1473691955023-da1c49c95c78?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
              layout="fill"
              objectFit="cover"
              objectPosition="left"
              alt="About Us Cover"
              className=""
            />
            <div className="h-full bg-gradient-to-b from-pmred to-pmred opacity-40"></div>
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="flex flex-col items-center max-w-xl mx-auto text-center">
              <h3 className="text-white font-light tracking-wide mb-4 uppercase">
                About Us
              </h3>
              <h2 className="text-4xl font-extrabold tracking-widest text-white uppercase">
                Respect is everything
              </h2>
              <p className="mt-6 text-lg font-light leading-7 text-neutral-200">
                With everything going so well right now I wanted to share how
                thankful and grateful we are to continue working on music with
                so many talented musicians
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black py-32 mx-auto grid grid-cols-8 items-center text-white">
        <div className="uppercase flex flex-col items-start col-start-2 col-end-6">
          <h1 className="font-bold tracking-wider mb-5 text-3xl">Songs</h1>
          <h2 className="text-pmred font-light tracking-wider text-9xl">
            23,652
          </h2>
        </div>
        <h1 className="col-start-6 col-end-8 font-extralight tracking-wider text-gray-300">
          Crazy how much he reminds me of Chance with them being brothers but
          everything from his look, his voice, his mannerisms all remind me of
          Chance.
        </h1>
      </div>

      <div className="bg-white mx-auto grid grid-cols-8 items-center">
        <div className="col-start-2 col-end-6 text-right space-y-8 px-20 py-32">
          <h1 className="uppercase flex flex-col font-extrabold text-4xl">
            <div className="text-pmred">The Best</div>
            <div className="text-black">American</div>
            <div className="text-pmred">Musician</div>
          </h1>
          <p className="text-neutral-500 leading-8">
            Filming Taylor Bennett at Truth Studios recording a new video for
            our channel. We want to wait to let you know what song he did but
            he&apos;s rapping for 3 straight minutes and it was really impressive.
            Crazy how much he reminds me of Chance (obviously) with them being
            brothers but everything from his look, his voice, his all remind me
            of Chance.
          </p>
        </div>
        <div className="col-start-6 col-end-8">
          <div className="object-cover md:object-center blur-ms brightness-95 aspect-square">
            <Image
              src="https://assets.audiomack.com/casey-veggies/861f9028024ad2fd375b8ee4e1ac9fd587464ca8769ecf163428c03089268e76.jpeg"
              layout="fill"
              objectFit="cover"
              objectPosition="left"
              alt="About Us Cover"
              className=""
            />
          </div>
        </div>
      </div>

      <div className="bg-black py-28 mx-auto items-center text-white grid grid-cols-8">
        <h1 className="font-extralight tracking-wider text-gray-300 col-start-3 col-end-7 text-2xl flex flex-col">
          Crazy how much he reminds me of Chance with them being brothers but
          everything from his look, his voice, his mannerisms all remind me of
          Chance.
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-pmred mx-auto mt-20 cursor-pointer click-animation"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </h1>
      </div>
    </AppContainer>
  );
}
