import { tr } from "../../shop/i18n";
import React from "react";
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Vassel could not render this page:", error);
  }
  render() {
    return this.state.failed ? (
      <main className="brand-closing">
        <p className="eyebrow">{tr("VASSEL")}</p>
        <h1 className="font-serif text-4xl my-8">
          {tr("Mari mulai kembali.")}
        </h1>
        <p className="form-note">
          {tr(
            "Halaman belum dapat ditampilkan. Muat ulang untuk mencoba kembali.",
          )}
        </p>
        <button
          className="button-dark"
          onClick={() => window.location.assign("/")}
        >
          {tr("Kembali ke VASSEL")}
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
