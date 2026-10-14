import { tr } from "./i18n";
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { VasselLogo } from "../components/brand/Logo";
export const MaisonPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => (
  <div className="editorial-page">
    <section className="editorial-intro">
      <p className="eyebrow">{tr("THE MAISON")}</p>
      <h1>
        {tr("A quieter kind")}
        <br />
        {tr("of")} <em>{tr("presence.")}</em>
      </h1>
      <p>
        {tr(
          "VASSEL is a study in balance. Strong forms, fluid lines, and the details that make a piece feel unmistakably yours.",
        )}
      </p>
    </section>
    <figure className="editorial-wide">
      <img
        src="/images/vassel-campaign.webp"
        alt={tr("Vassel campaign in ivory, cognac and espresso")}
      />
      <figcaption>
        {tr("THE SIGNATURE CAMPAIGN — A VASSEL CREATIVE CONCEPT")}
      </figcaption>
    </figure>
    <section className="brand-essay">
      <VasselLogo variant="monogram" size="lg" />
      <div>
        <p className="eyebrow">{tr("A DISTINCTIVE POINT OF VIEW")}</p>
        <h2>
          {tr("Strength in the silhouette.")}
          <br />
          <em>{tr("Softness in the detail.")}</em>
        </h2>
        <p>
          {tr(
            "Our monogram captures the conversation at the heart of Vassel: the architectural strength of a V, crossed by the fluid movement of a ribbon. Structure, with an unexpected softness.",
          )}
        </p>
        <p>
          {tr(
            "That same idea guides our world. Warm ivory against deep ink. Supple textures against clean lines. A considered wardrobe that leaves room for the person wearing it.",
          )}
        </p>
        <button className="text-link" onClick={() => onNavigate("/atelier")}>
          {tr("Explore our design language")}
          <ArrowUpRight size={15} />
        </button>
      </div>
    </section>
    <section className="brand-closing">
      <p className="eyebrow">{tr("THE VASSEL SIGNATURE")}</p>
      <h2>{tr("Made for your point of view.")}</h2>
      <button className="button-dark" onClick={() => onNavigate("/shop")}>
        {tr("Explore the collection")}
        <ArrowUpRight size={16} />
      </button>
    </section>
  </div>
);
