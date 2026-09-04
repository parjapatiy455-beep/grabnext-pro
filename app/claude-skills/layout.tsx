import { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/claude-skills`

  return {
    title: "Claude AI Skills & Prompt Engineering Pack | Grabnext",
    description: "Unlock 50+ pro Claude AI skills and prompt engineering templates to automate content writing, coding, marketing, and business workflows.",
    keywords: [
      "claude ai skills pack",
      "prompt engineering templates india",
      "claude prompts bundle download",
      "ai prompts for marketing coding",
      "grabnext claude skills"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Claude AI Skills & Prompt Engineering Pack | Grabnext",
      description: "Unlock 50+ pro Claude AI skills and prompt engineering templates with instant digital download.",
      url: pageUrl,
      type: "website",
      siteName: "Grabnext",
    },
    twitter: {
      card: "summary_large_image",
      title: "Claude AI Skills & Prompt Engineering Pack | Grabnext",
      description: "Unlock 50+ pro Claude AI skills and prompt engineering templates with instant digital download.",
    }
  }
}

export default function ClaudeSkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
