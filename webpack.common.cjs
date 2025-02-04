const path = require("path");

module.exports = {
    entry: "./src/index.js",
    output: {
        filename: "calendar-tools.js",
        path: path.resolve(__dirname, "dist"),
        library: {
            type: "module"
        }
    },
    experiments: {
        outputModule: true
    },
    mode: "production"
};
