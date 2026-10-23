// Front end: the welcome panel shown before a legend is picked.
import Image from "next/image";

const STEPS = [
  "Pick a legend or search a name",
  "Get the real facts from Wikidata",
  "Hear Mortimer's tale and see the grave on the map",
];

export default function IntroPanel() {
  return (
    <article className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-rust/60 bg-tar/90 shadow-[0_0_40px_rgba(168,18,31,0.25)]">
      <Image
        src="/images/billboard.png"
        alt="Haunted Hearse Tour billboard"
        width={1774}
        height={887}
        sizes="(min-width: 768px) 576px, 100vw"
        className="h-auto w-full"
        priority
      />
      <Image
        src="/images/hearse.png"
        alt="The Haunted Hearse"
        width={2172}
        height={724}
        sizes="(min-width: 768px) 576px, 100vw"
        className="-mt-6 h-auto w-full px-4"
      />

      <div className="flex flex-col gap-4 p-6 pt-2 text-center">
        <h2 className="font-display text-3xl tracking-wide text-blood md:text-4xl">All Aboard the Haunted Hearse</h2>
        <p className="text-lg leading-relaxed text-bone">
          Before Freddy, Jason, and Chucky, these are the people who invented the monsters. Hop in.
        </p>

        {/* How it works, in three stops */}
        <ol className="flex flex-col gap-2 text-left font-sign text-sm text-bone/90 md:flex-row md:gap-3 md:text-center">
          {STEPS.map((step, index) => (
            <li key={step} className="flex-1 rounded-lg border border-rust/50 bg-rust/10 px-3 py-2">
              <span className="mr-1 text-amber">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>

        <p className="border-t border-rust/40 pt-3 text-xs text-bone/60">Facts from Wikidata · Narration by AI</p>
      </div>
    </article>
  );
}
