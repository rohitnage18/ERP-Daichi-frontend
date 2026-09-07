import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const appDir = path.join(process.cwd(), "src/app");
const srcDir = path.join(process.cwd(), "src");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function fileToRoute(file: string): string {
  const rel = file.slice(appDir.length).replaceAll("\\", "/").replace(/\/page\.tsx$/, "");
  return rel || "/";
}

function hrefMatchesRoute(href: string, route: string): boolean {
  const hrefParts = href.split("/").filter(Boolean);
  const routeParts = route.split("/").filter(Boolean);
  if (hrefParts.length !== routeParts.length) return false;
  return routeParts.every((part, i) => part.startsWith("[") || part === hrefParts[i]);
}

describe("app route integrity", () => {
  const pageFiles = walk(appDir).filter((file) => file.endsWith("/page.tsx") || file.endsWith("\\page.tsx"));
  const routes = pageFiles.map(fileToRoute);

  it("discovers every Next.js page", () => {
    assert.ok(pageFiles.length >= 50, `expected 50+ pages, found ${pageFiles.length}`);
    assert.ok(routes.includes("/login"));
    assert.ok(routes.includes("/dashboard"));
    assert.ok(routes.includes("/dashboard/billing"));
    assert.ok(routes.includes("/dashboard/unauthorized"));
  });

  it("every static Link/href in the app maps to a real page", () => {
    const sourceFiles = walk(srcDir).filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"));
    const hrefs = new Set<string>();
    const hrefRe = /(?:href|router\.push|router\.replace)\((?:`|"|')(\/[^"'`$?]*)/g;
    const jsxHrefRe = /href=["'](\/[^"'?]*)["']/g;

    for (const file of sourceFiles) {
      const text = fs.readFileSync(file, "utf8");
      for (const re of [hrefRe, jsxHrefRe]) {
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(text))) {
          let href = match[1].replace(/\$\{[^}]+\}/g, "abc");
          if (href.includes("${")) continue;
          if (href.startsWith("/api")) continue;
          // `/print/invoices/${id}` is captured as `/print/invoices/` before `$`
          if (href.endsWith("/") && href !== "/") href = `${href}abc`;
          hrefs.add(href);
        }
      }
    }

    const missing: string[] = [];
    for (const href of hrefs) {
      if (!routes.some((route) => hrefMatchesRoute(href, route))) {
        missing.push(href);
      }
    }
    assert.deepEqual(missing, [], `dead links: ${missing.join(", ")}`);
  });
});
