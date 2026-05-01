async function run() {
  const url = 'https://uniformespro.vercel.app/';
  const res = await fetch(url, { headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } });
  const html = await res.text();
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (match) {
    const jsUrl = url + match[1].substring(1);
    console.log("JS URL:", jsUrl);
    const jsRes = await fetch(jsUrl, { headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } });
    const js = await jsRes.text();
    // Use proper check without trailing semicolon
    if (js.includes("text/csv;charset=utf-8")) {
      console.log("FIX IS PRESENT IN PRODUCTION DEPLOYMENT URL");
    } else {
      console.log("FIX IS MISSING IN PRODUCTION DEPLOYMENT URL");
    }
  } else {
    console.log("Could not find JS bundle in HTML");
  }
}
run();
