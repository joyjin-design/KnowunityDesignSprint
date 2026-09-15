import type { MetadataRoute } from "next";

// No background_color / theme_color: both need a literal colour, and the
// tokens only exist as CSS variables. Leaving them out rather than copying a
// hex out of tokens.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voice recall",
    short_name: "Voice recall",
    start_url: "/",
    display: "standalone",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
