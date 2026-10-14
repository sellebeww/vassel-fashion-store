import { useEffect, useRef } from "react";

const targets = [
  ".maison-intro",
  ".section-heading",
  ".v-product",
  ".editorial-card",
  ".atelier-story > *",
  ".brand-closing",
  ".maison-newsletter > div",
  ".editorial-intro",
  ".editorial-wide",
  ".brand-essay > *",
  ".atelier-principles article",
  ".lookbook-spread > *",
].join(",");

/** Content stays visible by default; each piece animates once as it enters view. */
export function useEditorialMotion(route: string, ready: boolean) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = root.current;
    if (
      !ready ||
      !container ||
      !window.IntersectionObserver ||
      !Element.prototype.animate
    )
      return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const animations = new Map<Element, Animation>();
    const cancel = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          observer.unobserve(target);
          if (preference.matches || target.contains(document.activeElement))
            continue;
          const siblings = Array.from(target.parentElement?.children || []);
          const delay = target.matches(".v-product, .editorial-card")
            ? (siblings.indexOf(target) % 4) * 65
            : 0;
          const animation = target.animate(
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 620,
              delay,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "backwards",
            },
          );
          animations.set(target, animation);
          animation.onfinish = () => animations.delete(target);
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" },
    );
    const observe = (node: Element) => {
      const candidates = [
        ...(node.matches(targets) ? [node] : []),
        ...node.querySelectorAll(targets),
      ];
      for (const element of candidates) {
        if (seen.has(element)) continue;
        seen.add(element);
        observer.observe(element);
      }
    };
    observe(container);
    // Include products added by load-more without replaying existing cards.
    const mutations = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) observe(node);
        }),
      );
    });
    mutations.observe(container, { childList: true, subtree: true });
    const onPreference = () => {
      if (preference.matches) cancel();
    };
    const onFocus = (event: FocusEvent) => {
      for (const [element, animation] of animations) {
        if (element.contains(event.target as Node)) {
          animation.cancel();
          animations.delete(element);
        }
      }
    };
    preference.addEventListener("change", onPreference);
    container.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", onPreference);
      container.removeEventListener("focusin", onFocus);
      cancel();
    };
  }, [route, ready]);
  return root;
}
