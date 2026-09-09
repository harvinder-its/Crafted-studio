import type { Metadata } from "next";
import HeroDefault from "@/components/heroes/HeroDefault";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  // `absolute` so the layout's "%s | Barberon" template doesn't double the name.
  title: { absolute: "Barberon – Barbershop & Hair Salon" },
  description:
    "Precision haircuts, skin fades, beard grooming and hot towel shaves. Book your chair at Barberon in New York.",
  alternates: { canonical: "/" },
};

/** Port of index.html. */
export default function HomePage() {
  return (
    <>
      <HeroDefault />
      <HomeBody />
    </>
  );
}
