var fs = require("fs");

fs.rmdirSync("./dist", { recursive: true });

process.exit(0);
