import Image from "next/image";
import Parallax from "@/components/ui/Parallax";
import PinnedOverlay from "@/components/ui/PinnedOverlay";
import { getContact } from "@/lib/public-content";

/** The tall parallax band whose location card holds in the middle of the screen. */
export default async function LocationSection() {
  const contact = await getContact();
  return (
    <Parallax
      className="mh-1000 p-0 relative overflow-hidden section-dark text-light"
      image="/images/background/2.webp"
      speed={-0.2}
    >
      <div className="sw-overlay op-4" />
      <div className="gradient-edge-top" />
      <div className="gradient-edge-bottom" />

      <PinnedOverlay>
        <div className="container">
          <div className="row g-4 justify-content-center">
            <div className="col-lg-4 col-md-6">
              <div className="text-center">
                <div className="fs-20">
                  <Image
                    src="/images/misc/pin.webp"
                    className="w-200px mb-4"
                    alt=""
                    width={512}
                    height={512}
                  />

                  <h2 className="mb-3">Our Location</h2>

                  <address className="mb-1 fst-normal">
                    {contact.line1}
                    <br />
                    {contact.line2}
                  </address>

                  <p className="mb-0">
                    <a href={`mailto:${contact.email}`} className="text-light text-decoration-none">
                      <span className="id-color">{contact.email}</span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PinnedOverlay>
    </Parallax>
  );
}
