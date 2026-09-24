import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "../lib/SessionProvider";
import { StoreProvider } from "../lib/store";
import { PlayerProvider } from "../lib/player";
import { UIProvider } from "../lib/ui";
import AudioPlayer from "../components/AudioPlayer";
import ModalHost from "../components/modals/ModalHost";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import MessagePopups from "../components/MessagePopups";
import ErrorBoundary from "../components/ErrorBoundary";

// Font Awesome's CSS is imported above; don't let it inject a <style> at runtime.
fontAwesomeConfig.autoAddCss = false;

// Free stand-in for the mock's Gotham (used when Gotham isn't installed locally).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap"
});

const TOAST_OPTIONS = {
  className: "!rounded-none !text-sm !font-medium",
  success: { iconTheme: { primary: "var(--color-pmred)", secondary: "#fff" } }
};

function MyApp({ Component, pageProps, router }) {
  // The CRM (/crm) is its own app: no member session, store, player or site chrome.
  if (router.pathname.startsWith("/crm")) {
    return (
      <>
        <style jsx global>{`
          :root {
            --font-montserrat: ${montserrat.style.fontFamily};
          }
        `}</style>
        <Toaster position="top-center" containerStyle={{ top: 72 }} toastOptions={TOAST_OPTIONS} />
        <Component {...pageProps} />
      </>
    );
  }
  return (
    <ErrorBoundary>
      <SessionProvider>
        <StoreProvider>
          <PlayerProvider>
            <UIProvider>
              <style jsx global>{`
                :root {
                  --font-montserrat: ${montserrat.style.fontFamily};
                }
              `}</style>
              <Toaster
                position="top-center"
                containerStyle={{ top: 80 }}
                toastOptions={TOAST_OPTIONS}
              />
              <div className="flex min-h-dvh flex-col">
                <Component {...pageProps} />
                <AudioPlayer />
              </div>
              <ModalHost />
              <KeyboardShortcuts />
              <MessagePopups />
            </UIProvider>
          </PlayerProvider>
        </StoreProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
