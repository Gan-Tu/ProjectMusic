import "../styles/globals.css";
import { SessionProvider } from "../lib/SessionProvider";
function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
