/**
 * Renders one or more JSON-LD structured-data blocks.
 *
 * Usage: <JsonLd data={organizationSchema()} /> or pass an array to emit
 * several <script> tags at once. `null`/`undefined` entries are skipped
 * so callers can do `<JsonLd data={faqSchema(faqs)} />` even when the
 * list is empty, without an extra conditional.
 */
type JsonLdValue = Record<string, unknown> | null | undefined;

export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter(
    (d): d is Record<string, unknown> => Boolean(d)
  );

  if (!items.length) return null;

  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
