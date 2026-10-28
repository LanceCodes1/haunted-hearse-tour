// Server component: the frame around every share page (and its "tour vanished" page): background + title.
// A layout, not part of page.tsx, so the not-found page gets the same frame.
import Image from "next/image";
import SiteTitle from "../../SiteTitle";

export default function TourLayout({ children }: LayoutProps<"/tour/[id]">) {
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Same cemetery background and dripping header as the home page */}
      <div className="fixed inset-0 -z-10">
        <Image src="/images/background.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-tar/75" />
      </div>
      <header className="bg-[url(/images/header-overlay.svg)] bg-cover bg-bottom pb-10 pt-4 md:pb-14">
        <SiteTitle href="/" />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
