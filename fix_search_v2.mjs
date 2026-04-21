import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// Use wood signature ONLY for pass 1
const pass1 = `
  // Pass 1: Strict resource signature
  for (const [c, v] of Object.entries(allChStats)) {
    if (isNewBuild) {
      if (v["1_b11"] === 242 && v["37_b11"] === 496) { 
        psCh = parseInt(c); 
        console.log('[Parser] Player channel found by resources (1/37):', psCh);
        break; 
      }
    }
  }
`;

code = code.replace(/\/\/ Pass 1: Exact resource signature[\s\S]*?console\.log\('\\[Parser\\] Player channel found by resources \(matches='\+woodCount\+'\):', psCh\);\\n\\s+break; \\n\\s+\\}\\n\\s+\\}/m, pass1);

fs.writeFileSync('api/core_parser.mjs', code);
