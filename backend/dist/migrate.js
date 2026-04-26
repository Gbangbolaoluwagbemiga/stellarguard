"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
(0, db_1.initializeSchema)()
    .then(() => {
    console.log("Migration complete.");
    process.exit(0);
})
    .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map