import fs from 'fs';
let code = fs.readFileSync('api/core_parser.mjs', 'utf8');
code = code.replace('return result;\\nfunction', 'return result;\\n}\\nfunction');
// Wait, my replacement above might have been different.
// Let's do a more robust one.
if (code.includes('return result;\\nfunction')) {
    code = code.replace('return result;\\nfunction', 'return result;\\n}\\nfunction');
} else if (code.includes('return result;\\n  function')) {
    code = code.replace('return result;\\n  function', 'return result;\\n}\\nfunction');
} else {
    // Just find the return result and insert brace after it
    code = code.replace(/return result;(\s+)function/g, 'return result;\\n$1}\\nfunction');
}
fs.writeFileSync('api/core_parser.mjs', code);
