async function run() {
  const url = 'https://uniformespro.vercel.app/';
  const res = await fetch(url, { headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } });
  const html = await res.text();
  console.log(html);
}
run();
