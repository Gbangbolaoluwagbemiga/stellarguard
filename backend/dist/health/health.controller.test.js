"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../db", () => ({
    pool: {
        connect: jest.fn(),
    },
}));
jest.mock("../config", () => ({
    config: {
        sorobanRpcUrl: "https://soroban-test.example.com",
    },
}));
const health_controller_1 = require("./health.controller");
const db_1 = require("../db");
const mockedConnect = db_1.pool.connect;
const mockedFetch = jest.fn();
global.fetch = mockedFetch;
function buildClient(query) {
    return {
        query,
        release: jest.fn(),
    };
}
describe("HealthController", () => {
    let controller;
    beforeEach(() => {
        controller = new health_controller_1.HealthController();
        jest.clearAllMocks();
    });
    it("reports overall status 'ok' when DB and RPC both respond", async () => {
        const query = jest.fn().mockResolvedValue({ rows: [{}] });
        mockedConnect.mockResolvedValue(buildClient(query));
        mockedFetch.mockResolvedValue({ ok: true, status: 200 });
        const result = await controller.getHealth();
        expect(result.status).toBe("ok");
        expect(result.checks.database.status).toBe("ok");
        expect(result.checks.sorobanRpc.status).toBe("ok");
        expect(result.service).toBe("stellarguard-api");
        expect(typeof result.checks.database.responseTime).toBe("number");
        expect(typeof result.checks.sorobanRpc.responseTime).toBe("number");
    });
    it("reports 'degraded' when only one downstream is healthy", async () => {
        const query = jest.fn().mockResolvedValue({ rows: [{}] });
        mockedConnect.mockResolvedValue(buildClient(query));
        mockedFetch.mockResolvedValue({ ok: false, status: 502 });
        const result = await controller.getHealth();
        expect(result.status).toBe("degraded");
        expect(result.checks.database.status).toBe("ok");
        expect(result.checks.sorobanRpc.status).toBe("error");
        expect(result.checks.sorobanRpc.message).toContain("502");
    });
    it("reports 'error' when both database and RPC fail", async () => {
        mockedConnect.mockRejectedValue(new Error("ECONNREFUSED"));
        mockedFetch.mockRejectedValue(new Error("network down"));
        const result = await controller.getHealth();
        expect(result.status).toBe("error");
        expect(result.checks.database.status).toBe("error");
        expect(result.checks.database.message).toBe("ECONNREFUSED");
        expect(result.checks.sorobanRpc.status).toBe("error");
        expect(result.checks.sorobanRpc.message).toBe("network down");
    });
    it("calls the configured Soroban RPC URL with a getHealth JSON-RPC request", async () => {
        const query = jest.fn().mockResolvedValue({ rows: [{}] });
        mockedConnect.mockResolvedValue(buildClient(query));
        mockedFetch.mockResolvedValue({ ok: true, status: 200 });
        await controller.getHealth();
        expect(mockedFetch).toHaveBeenCalledWith("https://soroban-test.example.com", expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining('"method":"getHealth"'),
        }));
    });
    it("releases the database client after a successful query", async () => {
        const query = jest.fn().mockResolvedValue({ rows: [{}] });
        const client = buildClient(query);
        mockedConnect.mockResolvedValue(client);
        mockedFetch.mockResolvedValue({ ok: true, status: 200 });
        await controller.getHealth();
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=health.controller.test.js.map