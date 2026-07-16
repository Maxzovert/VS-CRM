/** No service worker — silence browser/extension probes that hit /sw.js */
export function GET() {
  return new Response(null, { status: 204 });
}
