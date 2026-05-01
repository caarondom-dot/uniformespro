async function run() {
  const url = 'https://raw.githubusercontent.com/caarondom-dot/uniformespro/main/src/App.jsx';
  const res = await fetch(url);
  const code = await res.text();
  if (code.includes("text/csv;charset=utf-8;")) {
    console.log("FIX IS ON GITHUB");
  } else {
    console.log("FIX IS MISSING ON GITHUB");
  }
}
run();
