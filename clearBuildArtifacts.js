var fs = require("fs");

try {
	fs.rmdirSync("./dist", { recursive: true });
} catch (e) {
	console.warn("Error when removing folder: ./dist\n", e);
}

process.exit(0);
