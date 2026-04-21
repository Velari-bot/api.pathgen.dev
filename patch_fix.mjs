import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');

code = code.replace(
    /result\.resources\.wood = lastV\[44\] \|\| 0;/g,
    `result.resources = {}; result.resources.wood = lastV[44] || 0;`
);

fs.writeFileSync('api/core_parser.mjs', code);
