import Parallax from "@/components/ui/Parallax";
import HeroIntro from "./HeroIntro";

/**
 * index-dark-video-background.html's hero. The template fed `video/1.mp4` to
 * Jarallax via `data-video-src="mp4:…"`; here the Parallax wrapper plays it
 * directly as a muted, looping backdrop.
 */
export default function HeroVideo() {
  return (
    <Parallax id="section-intro" className="p-0" video="/video/1.mp4" speed={0.2}>
      <div className="v-center">
        <HeroIntro headlineCols="col-lg-10" ctaCols="col-lg-2" ctaLabel="Book Now" />
      </div>

      <div className="gradient-edge-bottom" />
    </Parallax>
  );
}
