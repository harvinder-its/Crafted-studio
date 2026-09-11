import type { Metadata } from "next";
import HeroDefault from "@/components/heroes/HeroDefault";
import HomeBody from "@/components/sections/HomeBody";

export const metadata: Metadata = {
  // `absolute` so the layout's "%s | Crafted Studio" template doesn't double the name.
  title: { absolute: "Crafted Studio – Barbershop & Hair Salon" },
  description:
    "Men's and women's haircuts, fades, beard services, treatments and colour in Winnipeg. Book your appointment at Crafted Studio.",
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
