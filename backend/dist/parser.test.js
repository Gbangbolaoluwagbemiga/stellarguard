"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const parser_1 = require("./parser");
function symbolScVal(sym) {
    return stellar_sdk_1.xdr.ScVal.scvSymbol(sym);
}
function i128ScVal(value) {
    const high = value >> 64n;
    const low = value & ((1n << 64n) - 1n);
    return stellar_sdk_1.xdr.ScVal.scvI128(new stellar_sdk_1.xdr.Int128Parts({
        hi: stellar_sdk_1.xdr.Int64.fromString(high.toString()),
        lo: stellar_sdk_1.xdr.Uint64.fromString(low.toString()),
    }));
}
describe("decodeScVal", () => {
    it("converts a symbol ScVal to its native string", () => {
        const result = (0, parser_1.decodeScVal)(symbolScVal("deposit"));
        expect(result).toBe("deposit");
    });
    it("converts an i128 ScVal to a bigint", () => {
        const result = (0, parser_1.decodeScVal)(i128ScVal(1000000n));
        expect(result).toBe(1000000n);
    });
    it("converts an address ScVal to a string strkey", () => {
        const account = stellar_sdk_1.Keypair.random().publicKey();
        const scVal = new stellar_sdk_1.Address(account).toScVal();
        const result = (0, parser_1.decodeScVal)(scVal);
        expect(typeof result).toBe("string");
        expect(result).toBe(account);
    });
});
describe("parseTopics", () => {
    it("returns null topics for empty input", () => {
        const result = (0, parser_1.parseTopics)([]);
        expect(result.topic1).toBeNull();
        expect(result.topic2).toBeNull();
        expect(result.allTopics).toEqual([]);
    });
    it("decodes the first two symbol topics", () => {
        const result = (0, parser_1.parseTopics)([
            symbolScVal("treasury"),
            symbolScVal("deposit"),
        ]);
        expect(result.topic1).toBe("treasury");
        expect(result.topic2).toBe("deposit");
        expect(result.allTopics).toEqual(["treasury", "deposit"]);
    });
    it("preserves additional topics in allTopics", () => {
        const result = (0, parser_1.parseTopics)([
            symbolScVal("treasury"),
            symbolScVal("deposit"),
            i128ScVal(42n),
        ]);
        expect(result.topic1).toBe("treasury");
        expect(result.topic2).toBe("deposit");
        expect(result.allTopics).toHaveLength(3);
        expect(result.allTopics[2]).toBe(42n);
    });
});
describe("parseEventData", () => {
    it("wraps a primitive value in { value }", () => {
        const result = (0, parser_1.parseEventData)(i128ScVal(7n));
        expect(result).toEqual({ value: 7n });
    });
    it("wraps a symbol value in { value }", () => {
        const result = (0, parser_1.parseEventData)(symbolScVal("hello"));
        expect(result).toEqual({ value: "hello" });
    });
    it("returns the object directly when the value decodes to an object", () => {
        const mapEntries = [
            new stellar_sdk_1.xdr.ScMapEntry({
                key: symbolScVal("amount"),
                val: i128ScVal(500n),
            }),
        ];
        const mapScVal = stellar_sdk_1.xdr.ScVal.scvMap(mapEntries);
        const result = (0, parser_1.parseEventData)(mapScVal);
        expect(result).toEqual({ amount: 500n });
    });
});
describe("getEventName", () => {
    it("returns the human-readable name for a known (topic1, topic2) pair", () => {
        expect((0, parser_1.getEventName)("treasury", "deposit")).toBe("Treasury Deposit");
        expect((0, parser_1.getEventName)("gov", "vote")).toBe("Governance Vote");
        expect((0, parser_1.getEventName)("vault", "lock")).toBe("Vault Lock");
    });
    it("returns null for an unknown topic1", () => {
        expect((0, parser_1.getEventName)("nope", "deposit")).toBeNull();
    });
    it("returns null for a known topic1 with unknown topic2", () => {
        expect((0, parser_1.getEventName)("treasury", "unknown")).toBeNull();
    });
    it("returns null when either topic is null", () => {
        expect((0, parser_1.getEventName)(null, "deposit")).toBeNull();
        expect((0, parser_1.getEventName)("treasury", null)).toBeNull();
        expect((0, parser_1.getEventName)(null, null)).toBeNull();
    });
});
describe("parseRawEvent", () => {
    it("produces a ParsedEvent with decoded topics, data, and metadata", () => {
        const result = (0, parser_1.parseRawEvent)({
            contractId: "CABCD",
            topic: [symbolScVal("treasury"), symbolScVal("deposit")],
            value: i128ScVal(1000n),
            ledger: 42,
            pagingToken: "cursor-1",
        });
        expect(result.contractId).toBe("CABCD");
        expect(result.topic1).toBe("treasury");
        expect(result.topic2).toBe("deposit");
        expect(result.ledger).toBe(42);
        expect(result.cursor).toBe("cursor-1");
        expect(result.timestamp).toBeNull();
        expect(result.data._eventName).toBe("Treasury Deposit");
        expect(result.data._topics).toEqual(["treasury", "deposit"]);
        expect(result.data.value).toBe(1000n);
    });
    it("omits _eventName when the (topic1, topic2) pair is unknown", () => {
        const result = (0, parser_1.parseRawEvent)({
            contractId: "CXYZ",
            topic: [symbolScVal("foo"), symbolScVal("bar")],
            value: i128ScVal(0n),
            ledger: 1,
            pagingToken: "c",
        });
        expect(result.data._eventName).toBeUndefined();
        expect(result.data._topics).toEqual(["foo", "bar"]);
    });
});
//# sourceMappingURL=parser.test.js.map