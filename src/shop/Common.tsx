import { tr } from "./i18n";
import React, { useState } from "react";
import { ArrowUpRight, Heart, Minus, Plus, LoaderCircle } from "lucide-react";
import { useStore } from "./state";
import { money, api } from "./api";
import type { Product, Address } from "./types";
export const emptyAddress: Address = {
  id: "",
  label: "Home",
  name: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
};
export function Field({
  label,
  children,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="v-field">
      <span>{tr(label)}</span>
      {tr(children || <input aria-label={tr(label)} {...props} />)}
    </label>
  );
}
export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="v-field">
      <span>{tr(label)}</span>
      <textarea aria-label={tr(label)} {...props} />
    </label>
  );
}
export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="v-field">
      <span>{tr(label)}</span>
      <select aria-label={tr(label)} {...props}>
        {tr(children)}
      </select>
    </label>
  );
}
export function Message({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return message ? (
    <p
      className={`v-message ${error ? "is-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {tr(message)}
    </p>
  ) : null;
}
export function Busy({
  busy,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={props.className || "v-button"}
    >
      {tr(
        busy ? (
          <>
            <LoaderCircle className="v-spin" size={16} />
            {tr("Menyimpan…")}
          </>
        ) : (
          children
        ),
      )}
    </button>
  );
}
export function Empty({
  title,
  text,
  href = "/shop",
  action = "Jelajahi koleksi",
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="v-empty">
      <p className="v-kicker">{tr("VASSEL")}</p>
      <h2>{tr(title)}</h2>
      <p>{tr(text)}</p>
      <a className="v-button" href={href}>
        {tr(action)}
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
export function ProductCard({ p }: { p: Product }) {
  const { wishlist, toggleWish } = useStore();
  const total = p.variants.reduce((s, v) => s + v.stock, 0);
  return (
    <article className="v-product">
      <div className="v-product-image">
        <a href={"/products/" + p.slug} aria-label={tr(p.name)}>
          <img
            src={p.images[0]}
            alt={tr(p.name + " — visual referensi")}
            loading="lazy"
            width="600"
            height="750"
          />
        </a>
        <span className="v-product-label">
          {tr(!total ? "Habis" : p.labels[0] || p.collection)}
        </span>
        <button
          className="v-icon v-favorite"
          onClick={() => toggleWish(p.id)}
          aria-label={tr(
            (wishlist.includes(p.id) ? "Hapus dari" : "Tambahkan ke") +
              " favorit " +
              p.name,
          )}
          aria-pressed={wishlist.includes(p.id)}
        >
          <Heart
            size={18}
            fill={wishlist.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <p className="v-product-category">{tr(p.collection)}</p>
      <a className="v-product-name" href={"/products/" + p.slug}>
        {tr(p.name)}
      </a>
      <div className="v-price">
        {tr(money(p.price))}
        {tr(" ")}
        {tr(p.comparePrice > 0 && <del>{tr(money(p.comparePrice))}</del>)}
      </div>
      <div className="v-swatches" aria-label={tr("Pilihan warna")}>
        {tr(
          [...new Map(p.variants.map((v) => [v.color, v])).values()].map(
            (v) => (
              <span
                key={v.color}
                title={tr(v.color)}
                style={{ background: v.hex }}
              />
            ),
          ),
        )}
      </div>
    </article>
  );
}
export function AddressFields({
  value,
  onChange,
}: {
  value: Address;
  onChange: (a: Address) => void;
}) {
  const f = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });
  return (
    <div className="v-form-grid">
      <Field
        label={tr("Label alamat")}
        value={value.label}
        onChange={f("label")}
        required
        maxLength={40}
      />
      <Field
        label={tr("Nama penerima")}
        value={value.name}
        onChange={f("name")}
        autoComplete="shipping name"
        required
      />
      <Field
        label={tr("Nomor HP")}
        type="tel"
        value={value.phone}
        onChange={f("phone")}
        autoComplete="shipping tel"
        pattern="[+0-9 ()-]{9,18}"
        required
      />
      <Field
        label={tr("Kode pos")}
        value={value.postalCode}
        onChange={f("postalCode")}
        inputMode="numeric"
        autoComplete="shipping postal-code"
        pattern="[0-9]{5}"
        maxLength={5}
        required
      />
      <Field
        label={tr("Alamat lengkap")}
        value={value.street}
        onChange={f("street")}
        autoComplete="shipping street-address"
        minLength={8}
        required
      />
      <Field
        label={tr("Kota / kabupaten")}
        value={value.city}
        onChange={f("city")}
        autoComplete="shipping address-level2"
        required
      />
      <Field
        label={tr("Provinsi")}
        value={value.province}
        onChange={f("province")}
        autoComplete="shipping address-level1"
        required
      />
    </div>
  );
}
export function Upload({ onUpload }: { onUpload: (url: string) => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <label className="v-upload">
      {tr(busy ? "Mengunggah…" : "Unggah foto (maks. 5 MB)")}
      <input
        type="file"
        disabled={busy}
        accept="image/jpeg,image/png,image/webp"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError("");
          if (file.size > 5 * 1024 * 1024) {
            setError("File maksimal 5 MB.");
            return;
          }
          setBusy(true);
          try {
            const form = new FormData();
            form.append("file", file);
            const r = await api("/admin/upload", "POST", form);
            if (r.type !== "image") throw new Error("Pilih file gambar.");
            onUpload(r.url);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <Message message={tr(error)} error />
    </label>
  );
}
