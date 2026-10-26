import { BestsellersBookShowcase } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

// Preserve the user's configured usage. The import resolves to the
// hash-verified registered implementation vendored inside this app; the
// authored Field Manuals HTML is served unchanged from ./public.
export function Scene() {
  return (
    <div className="shader-frame">
      <BestsellersBookShowcase
        headingFont="iowan-old-style"
        bodyFont="iowan-old-style"
        headingWeight="500"
        bodyWeight="400"
        primaryColor="#c3a47b"
        headingSize={325}
        bodySize={17}
        headingLetterSpacing={-0.085}
      />
    </div>
  );
}
