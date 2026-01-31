import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  options: {
    // remark and rehype plugins without serializable options cannot be used yet with Turbopack
    // because JavaScript functions can't be passed to Rust.
    // See: https://nextjs.org/docs/app/guides/mdx#remark-and-rehype-plugins
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      "rehype-slug",
      [
        "rehype-autolink-headings",
        {
          behavior: "wrap",
          properties: {
            className: ["heading-anchor"],
          },
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
