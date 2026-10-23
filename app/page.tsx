// Server component: builds the roster list on the server, so no roster or Wikidata code reaches the browser.
import Image from "next/image";
import { ROSTER } from "@/lib/roster";
import SiteTitle from "./SiteTitle";
import TourGuide, { type TourName } from "./TourGuide";

export default function Home() {
  // Test-only entries (Elvira) are for guardrail tests, not the public tour
  const tour: TourName[] = ROSTER.filter((legend) => !legend.testOnly).map(({ id, name, group, tagline }) => ({
    id,
    name,
    group,
    tagline: tagline ?? "",
  }));
  // Living test names go to the search box only, so it can reject them before any API call
  const living = ROSTER.filter((legend) => legend.testOnly).map(({ id, name }) => ({ id, name }));

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Cemetery background, fixed behind everything, darkened so text stays readable */}
      <div className="fixed inset-0 -z-10">
        <Image src="/images/background.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-tar/75" />
      </div>

      {/* Header: the dripping red band with the flickering title on top */}
      <header className="bg-[url(/images/header-overlay.svg)] bg-cover bg-bottom pb-10 pt-4 md:pb-14">
        <SiteTitle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">
        <TourGuide tour={tour} living={living} />
      </main>
    </div>
  );
}
