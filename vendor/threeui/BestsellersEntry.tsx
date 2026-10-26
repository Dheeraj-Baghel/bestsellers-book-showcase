// The Bestsellers export below is extracted verbatim from the registered
// LandingPages.tsx. Its unrelated catalog imports (other pages' raw HTML and
// document builders) need not be pulled into this standalone app.
// Full original files remain unchanged alongside this entry for hash verification.
import { splitTypographyProps, usePageTypography, type PageTypographyProps } from "./src/shaders/landing-pages/pageTypography";
import { LandingPageFrame, type LandingPageProps } from "./src/shaders/landing-pages/LandingPageFrame";
import { BESTSELLERS_TYPOGRAPHY } from "./src/shaders/landing-pages/pageRecipes";

export function BestsellersBookShowcase(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(BESTSELLERS_TYPOGRAPHY, type);
  return <LandingPageFrame {...frame} customization={customization} title="Field Manuals — Tools for Thought" sourceUrl="/landing-pages/bestsellers-book-showcase.html" />;
}
