"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ListenerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenerService = void 0;
const common_1 = require("@nestjs/common");
const listener_1 = require("./listener");
let ListenerService = ListenerService_1 = class ListenerService {
    constructor() {
        this.logger = new common_1.Logger(ListenerService_1.name);
    }
    async onModuleInit() {
        (0, listener_1.setupSignalHandlers)();
        this.logger.log("Starting event listener...");
        (0, listener_1.startListener)().catch((err) => {
            this.logger.error("Event listener failed:", err);
        });
    }
    async onModuleDestroy() {
        this.logger.log("Stopping event listener...");
        (0, listener_1.stopListener)();
    }
};
exports.ListenerService = ListenerService;
exports.ListenerService = ListenerService = ListenerService_1 = __decorate([
    (0, common_1.Injectable)()
], ListenerService);
//# sourceMappingURL=listener.service.js.map