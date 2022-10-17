import Head from "next/head";
import Header from "./Header";
import { Toaster } from "react-hot-toast";
import AudioPlayer from "./AudioPlayer";

export default function AppContainer({ title, curMenu, curMusic, children }) {
  return (
    <div class="flex flex-col h-screen">
      <Head>
        <title>{title || "Project Music"}</title>
      </Head>
      <Toaster position="top-center" reverseOrder={false} />
      <Header curMenu={curMenu} />
      <main className="flex-1">{children}</main>
      <AudioPlayer curMusic={curMusic} />
    </div>
  );
}
