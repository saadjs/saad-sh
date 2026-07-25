import { createFileRoute } from "@tanstack/react-router";

const profile = {
  status: "building",
  dayJob: "enterprise engineering",
  nightMode: "tools + ideas",
  interests: ["AI Stuff", "CLIs", "automation"],
  programmingLanguages: ["TypeScript", "Python", "Go", "Swift"],
  livesBy: "Always building, always learning",
  links: {
    website: "https://saad.sh",
    linkedin: "https://linkedin.com/in/saadbash",
  },
};

function getProfile(): Response {
  return new Response(JSON.stringify(profile, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

export const Route = createFileRoute("/me")({
  server: {
    handlers: {
      GET: getProfile,
    },
  },
});
