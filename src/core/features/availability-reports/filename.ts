/** Short ASCII filenames use names, with numeric suffixes for colliding slugs.
 * Reserve all base names so a duplicate Checkout cannot take Checkout 2's name.
 * ID ordering keeps the first component's name stable when another is added;
 * IDs never enter the download name or the report's contents. */
export function componentDownloadName(componentId: string, components: Array<{ id: string; name: string }>): string {
  const rows = components.map(component => ({
    id: component.id,
    slug: component.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").slice(0, 60).replace(/^-+|-+$/g, "") || "component",
  })).sort((a, b) => a.id.localeCompare(b.id));
  const reserved = new Set(rows.map(row => row.slug)), used = new Set<string>();
  for (const row of rows) {
    let name = row.slug, suffix = 2;
    if (used.has(name)) {
      do { name = `${row.slug}-${suffix++}`; } while (reserved.has(name) || used.has(name));
    }
    used.add(name);
    if (row.id === componentId) return name;
  }
  throw new Error("Component not found.");
}
