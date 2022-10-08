import Head from "next/head";
import Header from "./Header";
import { Toaster } from "react-hot-toast";

export default function AppContainer({ title, curMenu, children }) {
  return (
    <div>
      <Head>
        <title>{title || "Project Music"}</title>
      </Head>
      <Toaster position="top-center" reverseOrder={false} />
      <Header curMenu={curMenu} />
      <main>{children}</main>
      {/* TODO: add player */}
    </div>
  );
}
