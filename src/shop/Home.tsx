import React, { useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { VasselLogo } from "../components/brand/Logo";
import { useStore } from "./state";
import { api } from "./api";
import { getLanguage, tr } from "./i18n";
import { ProductCard, Field, Busy, Message } from "./Common";
export function HomePage() {
  const { data, notify } = useStore();
  const base = data.home;
  const h =
    getLanguage() === "fr" ? { ...base, ...base.translations?.fr } : base;
  const [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false);
  const featured = (
    h.featuredIds.length
      ? h.featuredIds
          .map((id) => data.products.find((p) => p.id === id))
          .filter(Boolean)
      : data.products.filter((p) => p.featured)
  ).slice(0, 4);
  const newest = [...data.products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const defaultTitle =
    h.title === "Presence, without a word." ||
    h.title === "Une présence, sans un mot.";
  return (
    <>
      <section
        className="campaign-hero"
        aria-label={tr("Vassel signature campaign")}
      >
        <img
          className="campaign-media"
          src={h.poster}
          onError={(e) => {
            if (
              e.currentTarget.getAttribute("src") !==
              "/images/vassel-campaign.webp"
            )
              e.currentTarget.src = "/images/vassel-campaign.webp";
          }}
          alt={tr(
            "Vassel campaign: ivory silk, cognac leather and warm architectural light",
          )}
          fetchPriority="high"
        />
        <div className="campaign-shade" />
        <div className="campaign-topline">
          <span>{tr("THE VASSEL SIGNATURE")}</span>
          <span>{tr("COLLECTION / 01")}</span>
        </div>
        <div className="campaign-copy">
          <p className="eyebrow">{tr(h.subtitle)}</p>
          <h1>
            {tr(
              defaultTitle ? (
                <>
                  {tr(getLanguage() === "fr" ? "Une présence," : "Presence,")}
                  <br />
                  <em>
                    {tr(
                      getLanguage() === "fr"
                        ? "sans un mot."
                        : "without a word.",
                    )}
                  </em>
                </>
              ) : (
                h.title
              ),
            )}
          </h1>
          <p className="campaign-description">{tr(h.description)}</p>
          <a className="button-ivory" href={h.ctaLink}>
            {tr(h.cta)}
            <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="campaign-bottom">
          <a href="#signature-edit">
            <ArrowDown size={15} />
            {tr("Discover Vassel")}
          </a>
          <span className="hero-caption">
            {tr("FORM. TEXTURE. CHARACTER.")}
          </span>
          <span>{tr("THE SIGNATURE EDIT")}</span>
        </div>
      </section>
      <section className="maison-intro" id="signature-edit">
        <p className="eyebrow">{tr("THE ESSENCE OF VASSEL")}</p>
        <h2>
          {tr("Less, but")} <em>{tr("exceptional.")}</em>
        </h2>
        <p>
          {tr(
            "A dialogue between strength and softness. Pieces with a distinctive point of view,",
          )}
          <br className="hide-small" /> {tr("made to become part of yours.")}
        </p>
        <a className="text-link" href="/maison">
          {tr("Meet the maison")}
          <ArrowUpRight size={14} />
        </a>
      </section>
      {tr(
        h.sections
          .filter((s) => !h.hiddenSections.includes(s))
          .map((section) => {
            if (section === "bestseller" || section === "new")
              return (
                <section className="signature-section" key={section}>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">
                        {tr(
                          section === "bestseller"
                            ? "OBJECTS OF DESIRE"
                            : "NEW ARRIVALS",
                        )}
                      </p>
                      <h2>
                        {tr(
                          section === "bestseller"
                            ? "The signature edit"
                            : "A new perspective",
                        )}
                      </h2>
                    </div>
                    <a
                      className="text-link"
                      href={section === "new" ? "/shop?sort=new" : "/shop"}
                    >
                      {tr("View the collection")}
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                  <div className="signature-grid">
                    {tr(
                      (section === "bestseller" ? featured : newest).map(
                        (p) => <ProductCard key={p!.id} p={p!} />,
                      ),
                    )}
                  </div>
                </section>
              );
            if (section === "categories")
              return (
                <section className="signature-section" key={section}>
                  <div className="section-heading">
                    <h2>{tr("Explore the maison")}</h2>
                  </div>
                  <div className="v-categories">
                    {tr(
                      data.categories.map((c) => (
                        <a href={"/shop?category=" + c.id} key={c.id}>
                          <div>
                            <img
                              src={c.image}
                              alt={tr(c.name)}
                              loading="lazy"
                            />
                          </div>
                          <span>
                            {tr(c.name)}
                            <ArrowUpRight size={16} />
                          </span>
                        </a>
                      )),
                    )}
                  </div>
                </section>
              );
            if (section === "promo")
              return (
                <section className="editorial-offer" key={section}>
                  <img
                    src={h.promoImage}
                    alt={tr("Vassel editorial")}
                    loading="lazy"
                  />
                  <div>
                    <p className="eyebrow">{tr("AN INVITATION FROM VASSEL")}</p>
                    <h2>{tr(h.promoTitle)}</h2>
                    <p>{tr(h.promoText)}</p>
                    <a className="text-link" href="/shop">
                      {tr("Discover the collection")}
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                </section>
              );
            if (section === "testimonials")
              return (
                <section className="v-section v-testimonials" key={section}>
                  <p className="eyebrow">{tr("NOTES FROM OUR COMMUNITY")}</p>
                  <h2>{tr("A lasting impression.")}</h2>
                  <p className="v-note">
                    {tr(
                      "Sample testimonials. Verified purchase reviews appear on product pages after moderation.",
                    )}
                  </p>
                  <div>
                    {tr(
                      h.testimonials.map((t, i) => (
                        <blockquote key={i}>
                          <p>{tr(t.text)}</p>
                          <cite>{tr(t.name)}</cite>
                        </blockquote>
                      )),
                    )}
                  </div>
                </section>
              );
            return null;
          }),
      )}
      <section className="editorial-pair">
        <a className="editorial-card" href="/shop?category=tas">
          <img
            src="/images/vassel-signature.webp"
            alt={tr("Vassel cognac signature handbag on travertine")}
            loading="lazy"
          />
          <div>
            <span className="eyebrow">{tr("THE ART OF CARRYING")}</span>
            <h2>{tr("A signature in every detail.")}</h2>
            <span className="text-link">
              {tr("Discover handbags")}
              <ArrowUpRight size={15} />
            </span>
          </div>
        </a>
        <a
          className="editorial-card fashion-card"
          href="/collections/signature"
        >
          <img
            src="/images/vassel-lookbook.webp"
            alt={tr("Vassel ready-to-wear campaign")}
            loading="lazy"
          />
          <div>
            <span className="eyebrow">{tr("THE EVERYDAY, RECONSIDERED")}</span>
            <h2>{tr("Dress with intention.")}</h2>
            <span className="text-link">
              {tr("Discover the lookbook")}
              <ArrowUpRight size={15} />
            </span>
          </div>
        </a>
      </section>
      <section className="atelier-story">
        <img
          src="/images/vassel-atelier.webp"
          alt={tr("Hands stitching cognac leather: a Vassel creative concept")}
          loading="lazy"
        />
        <div>
          <VasselLogo variant="monogram" size="md" />
          <p className="eyebrow">{tr("THE BEAUTY IS IN THE MAKING")}</p>
          <h2>
            {tr("Considered.")}
            <br />
            {tr("Down to the")}
            <br />
            <em>{tr("last stitch.")}</em>
          </h2>
          <p>
            {tr(
              "From the curve of a handle to the rhythm of a seam, our design language finds its expression in the smallest details.",
            )}
          </p>
          <a className="text-link" href="/atelier">
            {tr("Inside the atelier")}
            <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <section className="brand-closing">
        <span className="eyebrow">{tr("YOUR WORLD, WITH VASSEL")}</span>
        <h2>{tr("Find your own signature.")}</h2>
        <a className="button-dark" href="/shop">
          {tr("Discover the collection")}
          <ArrowUpRight size={16} />
        </a>
      </section>
      {tr(
        !h.hiddenSections.includes("newsletter") && (
          <section className="maison-newsletter">
            <div>
              <p className="eyebrow">{tr("NOTES FROM THE MAISON")}</p>
              <h2>{tr("A closer look at Vassel.")}</h2>
              <p>
                {tr("Ideas, details, and the stories behind the signature.")}
              </p>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setMessage("");
                try {
                  const r = await api("/newsletter", "POST", {
                    email,
                    consent,
                  });
                  setMessage(r.message);
                  notify(r.message);
                  setError(false);
                  setEmail("");
                  setConsent(false);
                } catch (e: any) {
                  setMessage(e.message);
                  setError(true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field
                label={tr("Email address")}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="v-check">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {tr(
                  "I agree to receive Vassel news and accept the privacy policy.",
                )}
              </label>
              <Busy busy={busy}>
                {tr("Join the list")}
                <ArrowUpRight size={16} />
              </Busy>
              <Message message={tr(message)} error={error} />
            </form>
          </section>
        ),
      )}
    </>
  );
}
