"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const cleanup_cron_1 = require("./modules/cleanup/cleanup.cron");
const PORT = process.env.PORT || 5000;
app_1.default.listen(PORT, () => {
    (0, cleanup_cron_1.startCleanupCron)();
});
