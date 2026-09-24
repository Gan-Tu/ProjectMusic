import Head from "next/head";
import Header from "./Header";
import { classNames } from "../lib/format";

// Page shell: document title + header + <main>. The audio player bar and the
// global pop-ups are rendered once in pages/_app.js so they survive navigation.
// Pages that need to fill the viewport height can use `flex-1` on their root.
export default function AppContainer({ title, description, curMenu, className, children }) {
  const pageTitle = title || curMenu;
  return (
    <>
      <Head>
        <title>{pageTitle ? `${pageTitle} | Projct Music` : "Projct Music"}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <Header curMenu={curMenu} />
      <main id="main" className={classNames("flex flex-1 flex-col", className)}>
        {children}
      </main>
    </>
  );
}
