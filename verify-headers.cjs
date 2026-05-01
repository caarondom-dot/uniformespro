async function run() {
  const res = await fetch('https://uniformespro.vercel.app/');
  console.log(res.headers);
}
run();
