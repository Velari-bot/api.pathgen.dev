import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// 1. More robust build detection (search for build string in first 2KB)
const buildDetect = \`
  let buildString = null;
  const headStr = buf.slice(0, 4000).toString('latin1');
  const match = headStr.match(/\\+\\+Fortnite\\+Release-([0-9\\.]+)/);
  if (match) buildString = match[0];
  
  const isNewBuild = buildString?.includes('40.20') || (buildString && parseInt(buildString.split('-')[1]) >= 40) || (!buildString && allRaw.length < 13000000);
  console.log('[Parser] Build detected:', buildString);
\`;

code = code.replace(/let buildString = null;[\\s\\S]*?console\.log\('\\[Parser\\] isNewBuild:', isNewBuild\);/m, buildDetect + "\\n  console.log('[Parser] isNewBuild:', isNewBuild);");

// 2. Fix PS Channel Pass 1 to be more strict
const psPass1 = \`
  let psCh = -1;
  const candidates = [];
  for (const [c, v] of Object.entries(allChStats)) {
    if (isNewBuild) {
      if ((v["44_b11"] === 242 || v[44] === 242) && (v["11_b11"] === 496 || v[11] === 496)) { 
        candidates.push(parseInt(c));
      }
    } else {
      if ((v[2] === 2996 || v[44] === 2996) && (v[4] === 1103 || v[11] === 1103)) {
        candidates.push(parseInt(c));
      }
    }
  }
  // Pick the one with the most likely kills or damage if multiple resources matches
  if (candidates.length > 0) {
      if (candidates.length === 1) psCh = candidates[0];
      else {
          for (let c of candidates) {
              const v = allChStats[c];
              if (isNewBuild && v[76] === 1) { psCh = c; break; }
              if (!isNewBuild && v[125] === 4) { psCh = c; break; }
          }
          if (psCh === -1) psCh = candidates[0];
      }
      console.log('[Parser] Player channel found by resources:', psCh);
  }
\`;

code = code.replace(/let psCh = -1;[\\s\\S]*?console\\.log\('\\[Parser\\] Player channel found by resources:', c\);\\n\\s+break;\\n\\s+\\}\\n\\s+\\}/m, psPass1);

fs.writeFileSync('api/core_parser.mjs', code);
