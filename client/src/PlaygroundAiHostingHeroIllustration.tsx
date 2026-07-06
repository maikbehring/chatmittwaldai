import { assetUrl } from "./appPaths";

const HERO_IMAGE_SRC = assetUrl("brand/ai-hosting-hero-de-dsgvo.jpg");

/** Hero-Grafik rechts: Deutschland-Karte, Server, DSGVO (statisches Brand-Bild). */
export function PlaygroundAiHostingHeroIllustration() {
  return (
    <div
      className="relative mx-auto hidden w-full max-w-[14rem] lg:mx-0 lg:block"
      aria-hidden
    >
      <img
        src={HERO_IMAGE_SRC}
        alt=""
        width={1024}
        height={682}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-2xl object-contain drop-shadow-md"
      />
    </div>
  );
}
