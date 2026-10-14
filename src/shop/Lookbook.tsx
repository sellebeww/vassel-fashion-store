import { tr } from "./i18n";
import React from "react";
import { ArrowUpRight } from "lucide-react";
export const LookbookPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => (
  <div className="lookbook-page">
    <div className="editorial-intro">
      <p className="eyebrow">{tr("COLLECTION / 01")}</p>
      <h1>
        {tr("The signature")} <em>{tr("in motion.")}</em>
      </h1>
      <p>
        {tr(
          "A palette of warm neutrals. A play of structure and softness. Three perspectives on the world of Vassel.",
        )}
      </p>
    </div>
    <section className="lookbook-spread">
      <figure>
        <img
          src="/images/vassel-lookbook.webp"
          alt={tr(
            "Vassel campaign concept: sand trench and espresso tailoring",
          )}
        />
        <figcaption>{tr("01 / THE ARCHITECTURAL SILHOUETTE")}</figcaption>
      </figure>
      <div>
        <p className="eyebrow">{tr("A SOFTER STRUCTURE")}</p>
        <h2>
          {tr("Ease,")}
          <br />
          <em>{tr("with intention.")}</em>
        </h2>
        <p>
          {tr(
            "Long lines, a softly defined waist, and a coat that moves with you. Sand and espresso find their balance in the afternoon light.",
          )}
        </p>
        <button
          className="text-link"
          onClick={() => onNavigate("/shop?category=jaket")}
        >
          {tr("Explore the trench")}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
    <section className="lookbook-landscape">
      <img
        src="/images/vassel-campaign.webp"
        alt={tr("Ivory silk blouse and cognac handbag in the Vassel campaign")}
        loading="lazy"
      />
      <div>
        <p className="eyebrow">{tr("02 / THE EVERYDAY SIGNATURE")}</p>
        <h2>
          {tr("Quietly")} <em>{tr("distinctive.")}</em>
        </h2>
        <button
          className="button-ivory"
          onClick={() => onNavigate("/shop?group=ready-to-wear")}
        >
          {tr("Explore ready-to-wear")}
          <ArrowUpRight size={15} />
        </button>
      </div>
    </section>
    <section className="lookbook-spread reverse">
      <figure>
        <img
          src="/images/vassel-signature.webp"
          alt={tr("Cognac signature handbag, Vassel design visualization")}
          loading="lazy"
        />
        <figcaption>{tr("03 / THE SCULPTURAL ACCENT")}</figcaption>
      </figure>
      <div>
        <p className="eyebrow">{tr("THE FINAL DETAIL")}</p>
        <h2>
          {tr("A form to")}
          <br />
          <em>{tr("remember.")}</em>
        </h2>
        <p>
          {tr(
            "A sculptural silhouette in cognac, finished with a warm metallic signature. A considered accent for an individual wardrobe.",
          )}
        </p>
        <button
          className="text-link"
          onClick={() => onNavigate("/shop?category=tas")}
        >
          {tr("Explore handbags")}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
    <p className="lookbook-credit">
      {tr(
        "Vassel campaign imagery. Final product photography and specifications will be updated before launch.",
      )}
    </p>
  </div>
);
