import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

// remove bnds from line 228
code = code.replace(
    /let accO = 0;\n\s*const bnds = decomp\.map\(c => \{ const b = \{ s: accO, e: accO\+c\.d\.length, sM: c\.sM, eM: c\.eM \}; accO \+= c\.d\.length; return b; \}\);\n/g,
    ''
);

// insert bnds above loop 125
code = code.replace(
    'const allChStats = {};',
    `let accO = 0;
const bnds = decomp.map(c => { const b = { s: accO, e: accO+c.d.length, sM: c.sM, eM: c.eM }; accO += c.d.length; return b; });
const allChStats = {};`
);

fs.writeFileSync('api/core_parser.mjs', code);
