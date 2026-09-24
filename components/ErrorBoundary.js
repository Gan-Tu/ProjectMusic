import { Component } from "react";

// Clears everything the demo saved in this browser (store, player, session).
function clearSavedData() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("pm-"))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // storage unavailable: nothing saved to clear
  }
}

// Last-resort screen: if rendering crashes, offer a reload or a reset of the saved
// demo data instead of leaving a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main
        role="alert"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6 text-center"
      >
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-sm text-neutral-600">
          This page couldn&apos;t be displayed. Reloading usually fixes it. If it keeps happening,
          reset the demo data saved in this browser.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border-2 border-pmred px-6 py-2 text-xs font-semibold uppercase tracking-wider text-pmred hover:bg-pmred hover:text-white"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              clearSavedData();
              window.location.reload();
            }}
            className="rounded-full border-2 border-pmred bg-pmred px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:border-pmred-dark hover:bg-pmred-dark"
          >
            Reset demo data
          </button>
        </div>
      </main>
    );
  }
}
