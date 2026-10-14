import { tr } from "./i18n";
import React from "react";
import { ArrowUpRight } from "lucide-react";
export const AtelierPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => (
  <div className="editorial-page">
    <section className="editorial-intro">
      <p className="eyebrow">{tr("INSIDE THE ATELIER")}</p>
      <h1>
        {tr("The details")}
        <br />
        {tr("make the")} <em>{tr("difference.")}</em>
      </h1>
      <p>
        {tr(
          "A closer look at the forms, textures, and considered finishes that inspire the Vassel collection.",
        )}
      </p>
    </section>
    <figure className="editorial-wide">
      <img
        src="/images/vassel-atelier.webp"
        alt={tr("Craftsmanship concept: hand stitching a cognac leather bag")}
      />
      <figcaption>
        {tr("AN EXPLORATION OF CRAFT — VASSEL CAMPAIGN VISUAL")}
      </figcaption>
    </figure>
    <section className="atelier-principles">
      {tr(
        [
          [
            "01",
            "Form",
            "A sculptural handle. An uninterrupted curve. Proportions that feel balanced from every angle.",
          ],
          [
            "02",
            "Texture",
            "The grain of leather, the movement of silk, the contrast between a soft surface and polished hardware.",
          ],
          [
            "03",
            "Finish",
            "A measured line of stitching and the quiet gleam of a clasp. Details that reward a closer look.",
          ],
        ].map(([number, title, body]) => (
          <article key={number}>
            <span className="eyebrow">
              {tr(number)} {tr("/ THE DESIGN LANGUAGE")}
            </span>
            <h2>{tr(title)}</h2>
            <p>{tr(body)}</p>
          </article>
        )),
      )}
    </section>
    <section className="atelier-story">
      <img
        src="/images/vassel-signature.webp"
        alt={tr("Vassel signature handbag design concept")}
        loading="lazy"
      />
      <div>
        <p className="eyebrow">{tr("THE SIGNATURE STUDY")}</p>
        <h2>
          {tr("A curve.")}
          <br />
          {tr("A clasp.")}
          <br />
          <em>{tr("A character.")}</em>
        </h2>
        <p>
          {tr(
            "Our campaign explores how the Vassel monogram can become part of an object: a small, intentional signature that belongs to its silhouette.",
          )}
        </p>
        <button
          className="text-link"
          onClick={() => onNavigate("/shop?category=tas")}
        >
          {tr("Explore leather goods")}
          <ArrowUpRight size={15} />
        </button>
      </div>
    </section>
  </div>
);
