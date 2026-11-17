/** Read frozen notice text, including older notices with an internal reference.
 * Customer-facing surfaces already show the window title above its details. */
export function maintenanceNoticeDetails(body: string, reference: string, title: string) {
  const legacyHeading = `${reference}: ${title}`;
  const heading = body.startsWith(legacyHeading) ? legacyHeading : title;
  const content = body === heading ? "" : body.startsWith(`${heading}\n\n`) ? body.slice(heading.length).trimStart() : body;
  return content.split(/\n\s*\n/).filter(Boolean).map(paragraph => {
    const match = /^(Who is affected|Customer impact|Reason): ([\s\S]*)$/.exec(paragraph);
    return { label: match?.[1] ?? null, value: match?.[2] ?? paragraph };
  });
}
