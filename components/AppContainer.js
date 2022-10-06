import Head from "next/head";
import Header from "./Header";
import { Toaster } from "react-hot-toast";

export default function AppContainer({ title, breadcrumb, children }) {
  return (
    <div>
      <Head>
        <title>{title || "Project Music"}</title>
        <link href="http://fonts.cdnfonts.com/css/gotham" rel="stylesheet" />
        <link href="http://fonts.cdnfonts.com/css/gotham-pro" rel="stylesheet" />
      </Head>
      <Toaster position="top-center" reverseOrder={false} />
      <Header breadcrumb={breadcrumb} />
      <main>{children}</main>
      {/* TODO: add player */}
    </div>
  );
}
