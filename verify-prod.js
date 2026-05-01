const fetch = require('node-fetch'); // wait, Node 18+ has native fetch
async function run() {
  const res = await fetch('https://uniformespro.vercel.app/');
  const html = await res.text();
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (match) {
    const jsUrl = 'https://uniformespro.vercel.app' + match[1];
    console.log("JS URL:", jsUrl);
    const jsRes = await fetch(jsUrl);
    const js = await jsRes.text();
    if (js.includes("text/csv;charset=utf-8;")) {
      console.log("FIX IS PRESENT IN PRODUCTION");
    } else {
      console.log("FIX IS MISSING IN PRODUCTION");
    }
  } else {
    console.log("Could not find JS bundle in HTML");
  }
}
run();
