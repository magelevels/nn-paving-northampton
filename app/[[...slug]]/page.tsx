import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function bodyOnly(document: string): string {
  const match = document.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match?.[1] ?? document;
}

function safeRelativePath(slug: string[]): string | null {
  if (slug.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"))) return null;
  return slug.length ? path.join(...slug, "index.html") : "index.html";
}

async function sourceFor(slug: string[]): Promise<string> {
  const relative = safeRelativePath(slug);
  if (!relative) return readFile(path.join(process.cwd(), "public", "404.html"), "utf8");
  try {
    return await readFile(path.join(process.cwd(), "public", relative), "utf8");
  } catch {
    return readFile(path.join(process.cwd(), "public", "404.html"), "utf8");
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug = [] } = await params;
  const source = await sourceFor(slug);
  const title = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = source.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1];
  return {
    title: title || "NN Paving Northampton",
    description: description || "Paving, driveways, patios and landscaping in Northampton.",
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const source = await sourceFor(slug);

  return <div dangerouslySetInnerHTML={{ __html: bodyOnly(source) }} />;
}
