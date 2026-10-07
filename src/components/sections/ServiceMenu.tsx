import Reveal from "@/components/ui/Reveal";
import SectionHeading from "./SectionHeading";
import { getPublicMenu, type PublicCategory } from "@/lib/public-content";

/**
 * The full price list on /services, read from the database so it always matches
 * what the admin shows. Each row reuses the opening-hours markup from the
 * booking section (name left, value right, hairline between), so the list needs
 * no styles of its own.
 *
 * The longest category takes the left column on its own and the rest stack on
 * the right, which keeps the two columns roughly even whatever the salon adds.
 */
export default async function ServiceMenu() {
  const menu = await getPublicMenu();
  if (menu.length === 0) return null;

  const longest = menu.reduce(
    (best, category, index) => (category.items.length > menu[best].items.length ? index : best),
    0,
  );
  const rest = menu.filter((_, index) => index !== longest);

  return (
    <section id="section-pricing" className="pt-0 text-light" aria-label="Service menu">
      <div className="container">
        <div className="row g-4 justify-content-center text-center">
          <div className="col-lg-6">
            <SectionHeading
              eyebrow="Price List"
              title="Full Service Menu"
              body="Prices and approximate appointment times. Colour consultations are free."
            />
          </div>
        </div>

        <div className="spacer-20" />

        <div className="row g-4 gx-5">
          <div className="col-lg-6">
            <Category category={menu[longest]} />
          </div>
          <div className="col-lg-6">
            {rest.map((category, i) => (
              <Category key={category.title} category={category} spaced={i > 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Category({ category, spaced = false }: { category: PublicCategory; spaced?: boolean }) {
  return (
    <Reveal className={spaced ? "mt-5" : undefined}>
      <h3 className="mb-2">{category.title}</h3>
      {category.items.map((item, i) => {
        const last = i === category.items.length - 1;
        return (
          <div
            key={item.name}
            className={`d-flex justify-content-between align-items-center gap-3 ${
              last ? "pt-3" : "py-3 border-bottom border-secondary"
            }`}
          >
            <div>
              <span className="text-white d-block">{item.name}</span>
              {item.duration ? <small className="op-6">{item.duration}</small> : null}
            </div>
            <span className="fw-500 text-nowrap id-color">{item.price}</span>
          </div>
        );
      })}
    </Reveal>
  );
}
