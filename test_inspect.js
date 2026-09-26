async function test() {
  const r = await fetch("https://player.abyssplayer.com/klVLunPu8");
  const html = await r.text();
  console.log("HTML length:", html.length);
  // Find script tags
  const scripts = html.match(/<script[\s\S]*?<\/script>/g);
  console.log("Script count:", scripts ? scripts.length : 0);
  for (const s of (scripts || [])) {
    if (s.includes("datas =")) {
      console.log("Datas script found, length:", s.length);
      console.log(s.slice(0, 300));
    }
  }
}
test();
