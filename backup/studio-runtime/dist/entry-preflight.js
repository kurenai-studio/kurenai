import { createRequire as __wanakaCreateRequire } from "node:module";
import { fileURLToPath as __wanakaFileURLToPath } from "node:url";
import { dirname as __wanakaDirname } from "node:path";
const require = __wanakaCreateRequire(import.meta.url);
const __filename = __wanakaFileURLToPath(import.meta.url);
const __dirname = __wanakaDirname(__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../packages/platform/src/typed-id-runtime.cjs
var require_typed_id_runtime = __commonJS({
  "../../packages/platform/src/typed-id-runtime.cjs"(exports, module) {
    "use strict";
    var TYPED_ID_SUFFIX_LENGTH2 = 15;
    var TYPED_ID_SEPARATOR2 = "_";
    var TYPED_ID_MAX_LENGTH2 = 64;
    function typedIdPattern2(prefix) {
      return new RegExp(`^${prefix}_[0-9A-Za-z]{${TYPED_ID_SUFFIX_LENGTH2}}$`);
    }
    function isTypedId2(value, prefix) {
      return typeof value === "string" && typedIdPattern2(prefix).test(value);
    }
    module.exports = {
      TYPED_ID_MAX_LENGTH: TYPED_ID_MAX_LENGTH2,
      TYPED_ID_SEPARATOR: TYPED_ID_SEPARATOR2,
      TYPED_ID_SUFFIX_LENGTH: TYPED_ID_SUFFIX_LENGTH2,
      isTypedId: isTypedId2,
      typedIdPattern: typedIdPattern2
    };
  }
});

// ../../packages/billing-contracts/src/money.ts
import * as v from "valibot";
var SUPPORTED_CURRENCY_CODES = ["USD", "CNY", "EUR"];
var MoneySnapshotSchema = v.object({
  amount: v.pipe(v.number(), v.integer()),
  currency: v.object({
    code: v.picklist(SUPPORTED_CURRENCY_CODES),
    base: v.number(),
    exponent: v.number()
  }),
  scale: v.pipe(v.number(), v.integer(), v.minValue(0))
});

// ../../packages/billing-contracts/src/fx.ts
import * as v2 from "valibot";

// ../../packages/billing-contracts/src/payment-provider.ts
var PAYMENT_PROVIDERS = ["stripe", "paddle", "mock", "internal"];
var CAPABILITIES = {
  stripe: {
    userSelectable: true,
    ownsSubscription: true,
    remoteSubscription: true,
    refundable: true,
    sandboxCompressedPeriod: true,
    programmableTestClock: true,
    testOnly: false
  },
  paddle: {
    userSelectable: true,
    ownsSubscription: true,
    remoteSubscription: true,
    refundable: true,
    // Paddle sandbox has no programmable clock, so its webhook period stays
    // authoritative and must not be locally compressed.
    sandboxCompressedPeriod: false,
    programmableTestClock: false,
    testOnly: false
  },
  mock: {
    userSelectable: false,
    ownsSubscription: false,
    remoteSubscription: false,
    // Refundable: the mock key is wired to the Stripe adapter, so a settled
    // mock topup is a stand-in for a real refundable charge and the admin
    // refund path must accept it in local/CI.
    refundable: true,
    sandboxCompressedPeriod: false,
    programmableTestClock: false,
    testOnly: true
  },
  internal: {
    userSelectable: false,
    ownsSubscription: true,
    remoteSubscription: false,
    refundable: false,
    // Platform-managed grants share Stripe's compressed sandbox lifecycle, but
    // have no remote clock of their own for the advance loop to step.
    sandboxCompressedPeriod: true,
    programmableTestClock: false,
    testOnly: false
  }
};
function providersWith(capability) {
  const values = PAYMENT_PROVIDERS.filter((p) => CAPABILITIES[p][capability]);
  return values;
}
var CHECKOUT_PROVIDERS = providersWith("userSelectable");
var SUBSCRIPTION_GATEWAYS = providersWith("ownsSubscription");
var KNOWN = new Set(PAYMENT_PROVIDERS);

// ../../packages/billing-contracts/src/fx.ts
var PspReportedFxSchema = v2.object({
  source: MoneySnapshotSchema,
  settled: MoneySnapshotSchema,
  pspId: v2.picklist(CHECKOUT_PROVIDERS),
  pspAppliedAt: v2.pipe(v2.string(), v2.isoTimestamp())
});

// ../../packages/platform/src/typed-id.ts
var import_typed_id_runtime = __toESM(require_typed_id_runtime(), 1);
var { TYPED_ID_MAX_LENGTH, TYPED_ID_SEPARATOR, TYPED_ID_SUFFIX_LENGTH } = import_typed_id_runtime.default;
var { isTypedId: isRuntimeTypedId, typedIdPattern: runtimeTypedIdPattern } = import_typed_id_runtime.default;
var TYPED_ID_EPOCH_MS = Date.UTC(2026, 0, 1);
function typedIdPattern(prefix) {
  return runtimeTypedIdPattern(prefix);
}

// ../../packages/agent-contracts/src/ids.ts
import * as v3 from "valibot";
var AgentChatSessionIdSchema = v3.pipe(
  v3.string(),
  v3.regex(typedIdPattern("ags"), "expected ags_ typed id")
);
var ProjectIdSchema = v3.pipe(v3.string(), v3.regex(typedIdPattern("prj")));
var CheckpointIdSchema = v3.pipe(v3.string(), v3.regex(typedIdPattern("chk")));
var ProjectPublicationIdSchema = v3.pipe(v3.string(), v3.regex(typedIdPattern("pbl")));
var BuildLoopIdSchema = v3.pipe(
  v3.string(),
  v3.regex(typedIdPattern("blp"), "expected blp_ typed id")
);
var ClaudeSessionIdSchema = v3.pipe(v3.string(), v3.uuid());
var InvocationIdSchema = v3.pipe(v3.string(), v3.uuid());

// ../../packages/billing-contracts/src/checkout.ts
var CHECKOUT_PURPOSES = ["subscription", "topup"];
var PURPOSES = new Set(CHECKOUT_PURPOSES);
var CHECKOUT_STATUSES = ["created", "completed", "abandoned", "expired"];
var STATUSES = new Set(CHECKOUT_STATUSES);
var SUPPORTED_CURRENCIES = new Set(SUPPORTED_CURRENCY_CODES);

// ../../packages/billing-contracts/src/payment.ts
var PAYMENT_KINDS = [
  "topup",
  "subscription_initial",
  "subscription_renewal",
  "subscription_proration",
  "refund"
];
var KINDS = new Set(PAYMENT_KINDS);
var PAYMENT_STATUSES = ["pending", "succeeded", "abandoned", "expired"];
var STATUSES2 = new Set(PAYMENT_STATUSES);
var PAYMENT_DIRECTIONS = ["in", "out"];
var DIRECTIONS = new Set(PAYMENT_DIRECTIONS);

// ../../packages/billing-contracts/src/typed-id-schema.ts
import * as v4 from "valibot";
function typedIdSchema(prefix) {
  return v4.pipe(v4.string(), v4.regex(typedIdPattern(prefix), `expected ${prefix}_ typed id`));
}

// ../../packages/billing-contracts/src/credit-lot.ts
import * as v6 from "valibot";

// ../../packages/billing-contracts/src/ledger-kind-registry.ts
import * as v5 from "valibot";

// ../../packages/billing-contracts/src/sink-verb.ts
var EARMARKED_VERB_VALUES = [
  "image",
  "model_3d",
  "animate",
  "rig",
  "retarget",
  "audio",
  "articulated_asset",
  "export",
  "game_export"
];
var EARMARKED_VERBS = new Set(EARMARKED_VERB_VALUES);

// ../../packages/billing-contracts/src/ledger-kind-registry.ts
var SourceKinds = [
  "topup_paid",
  "subscription_grant",
  "promo",
  "daily_base",
  "system_grant"
];
var ConsumptionVerbs = [
  "chat",
  "image",
  "model_3d",
  "animate",
  "rig",
  "retarget",
  "audio",
  "articulated_asset",
  "export",
  "game_export",
  "embedding"
];
var defineKind = (spec) => spec;
var LedgerKindRegistry = {
  topup: defineKind({
    flow: "grant",
    // Passthrough: the payment webhook mints `psp-topup:<provider>:<providerChargeId>`
    // (the PSP charge id is not in TopupRequest — the ledger cannot reconstruct it).
    idempotency: {
      scheme: "psp-topup",
      source: "passthrough",
      mint: (a) => a.idempotencyKey
    },
    ref: { type: "payment", required: true },
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: "topup_paid",
    lotSourceKind: "topup_paid",
    history: { direction: "in" },
    meta: null
  }),
  subscription_grant: defineKind({
    flow: "grant",
    // Minted: reproduces the existing inline format `sub:<subId>:<effectiveAt.toISOString()>`.
    idempotency: {
      scheme: "sub",
      source: "minted",
      mint: (a) => `sub:${a.subscriptionId}:${a.effectiveAtISO}`
    },
    ref: { type: "subscription", required: true },
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: "subscription_grant",
    lotSourceKind: "subscription_grant",
    history: { direction: "in" },
    meta: null
  }),
  promo_grant: defineKind({
    flow: "grant",
    // Minted: reproduces the existing inline format `free-period-grant:<userId>:<effectiveAt.toISOString()>`.
    // In production promo_grant is produced only by the period paths
    // (ensureCurrentPeriodGrant / grantFreePeriod); the generic promoGrant OHS
    // method has no external caller.
    idempotency: {
      scheme: "free-period-grant",
      source: "minted",
      mint: (a) => `free-period-grant:${a.userId}:${a.effectiveAtISO}`
    },
    ref: null,
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: "promo",
    lotSourceKind: "promo",
    history: { direction: "in" },
    meta: v5.object({ idempotencyFingerprint: v5.string() })
  }),
  // The shared daily allowance every tier receives as a rolling 24h window lot,
  // granted lazily on the first reserve of a window. Kept distinct from
  // promo_grant (one-off promos and the per-verb earmarked media windows) so the
  // daily base stamps its own `daily_base` lot source kind: both the "already
  // granted this window?" gate and the monthly-cap aggregation must tell the
  // daily base apart from the paid monthly pool, which is also a windowed
  // general lot but carries source kind `subscription_grant`.
  daily_base_grant: defineKind({
    flow: "grant",
    // Minted: one daily-base window per (user, window start).
    idempotency: {
      scheme: "daily-base-grant",
      source: "minted",
      mint: (a) => `daily-base-grant:${a.userId}:${a.effectiveAtISO}`
    },
    ref: null,
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: "daily_base",
    lotSourceKind: "daily_base",
    // Not surfaced: the daily allowance would add one row per active day and
    // drown the two event families the history view is scoped to.
    history: null,
    meta: null
  }),
  system_grant: defineKind({
    flow: "grant",
    // Passthrough: onboarding mints `system-grant:initial:<userId>`.
    idempotency: {
      scheme: "system-grant",
      source: "passthrough",
      mint: (a) => a.idempotencyKey
    },
    ref: null,
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: "system_grant",
    lotSourceKind: "system_grant",
    history: { direction: "in" },
    meta: null
  }),
  reserve: defineKind({
    flow: "hold",
    // Default: one reserve per invocation, keyed `inv:reserve:<invocationId>`. A
    // caller-supplied idempotencyKey acts as a standalone dedup key
    // (invocation-independent), but is NAMESPACED under the reserve scheme
    // (`inv:reserve:<callerKey>`) so it can never collide with another kind's
    // key under the global uk_idempotency (game-agent passes bare invocationId /
    // `<invocationId>#chunkN` keys). Multi-chunk slice keys stay closed.
    idempotency: {
      scheme: "inv:reserve",
      source: "minted",
      mint: (a) => `inv:reserve:${a.idempotencyKey ?? a.invocationId}`
    },
    ref: { type: "invocation", required: true },
    resolves: null,
    verb: null,
    ttl: true,
    sourceDimension: null,
    lotSourceKind: null,
    history: null,
    meta: v5.object({
      featureKey: v5.optional(v5.string()),
      providerModelKey: v5.optional(v5.string())
    })
  }),
  settle: defineKind({
    flow: "resolve",
    idempotency: {
      scheme: "resolve:settle",
      source: "minted",
      mint: (a) => `resolve:settle:${a.reserveTxId}`
    },
    ref: null,
    resolves: { targets: ["reserve"], required: true },
    verb: { values: ConsumptionVerbs },
    ttl: false,
    sourceDimension: null,
    lotSourceKind: null,
    history: { direction: "out" },
    meta: v5.object({
      stopReason: v5.optional(v5.string()),
      providerModelKey: v5.optional(v5.string())
    })
  }),
  refund: defineKind({
    flow: "adjust",
    // Passthrough: the checkout orchestrator mints `admin-refund:<paymentId>`.
    idempotency: {
      scheme: "admin-refund",
      source: "passthrough",
      mint: (a) => a.idempotencyKey
    },
    ref: { type: "payment", required: true },
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: "topup_paid",
    lotSourceKind: null,
    history: null,
    meta: null
  }),
  // lot expiry (was one of the two "fake verbs" of the old single `expire` kind)
  expire: defineKind({
    flow: "resolve",
    // Minted: reproduces the existing inline format `lot-expire:<lotId>:<at.toISOString()>`.
    idempotency: {
      scheme: "lot-expire",
      source: "minted",
      mint: (a) => `lot-expire:${a.lotId}:${a.atISO}`
    },
    ref: { type: "credit_lot", required: true },
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: null,
    lotSourceKind: null,
    // Not surfaced: expiry events stay internal — the credit-history view is
    // scoped to monthly plan grants and consumption charges only.
    history: null,
    meta: null
  }),
  // reaper release of a timed-out reserve (the other half of old `expire`)
  reserve_expire: defineKind({
    flow: "resolve",
    // Minted: brand-new key (reserve_expire had no idempotency key pre-redesign;
    // dedup rode on the terminus check). Backfilled from the reserve it resolves.
    idempotency: {
      scheme: "expire:reaper",
      source: "minted",
      mint: (a) => `expire:reaper:${a.reserveTxId}`
    },
    ref: null,
    resolves: { targets: ["reserve"], required: true },
    verb: null,
    ttl: false,
    sourceDimension: null,
    lotSourceKind: null,
    history: null,
    meta: null
  }),
  // agent-initiated release of an unconsumed reserve (mid-turn renewal + zero-charge
  // turn close). Distinct from reserve_expire (reaper-only) so that kind's rate stays
  // a "dead reservation" signal. Non-charging inverse of reserve; invisible to history.
  reserve_release: defineKind({
    flow: "resolve",
    idempotency: {
      scheme: "release:agent",
      source: "minted",
      mint: (a) => `release:agent:${a.reserveTxId}`
    },
    ref: null,
    resolves: { targets: ["reserve"], required: true },
    verb: null,
    ttl: false,
    sourceDimension: null,
    lotSourceKind: null,
    history: null,
    meta: null
  }),
  subscription_change_expire: defineKind({
    flow: "adjust",
    // Minted: reproduces the existing inline format `period-expire:<userId>:<at.toISOString()>`.
    idempotency: {
      scheme: "period-expire",
      source: "minted",
      mint: (a) => `period-expire:${a.userId}:${a.atISO}`
    },
    // Optional (required: false) and forward-looking: the expirePeriodLots operation
    // does not yet thread a subscriptionId, so today this ref is always absent. When
    // traceability to the triggering subscription is added, the operation supplies it
    // without a registry change (required: false already permits both shapes).
    ref: { type: "subscription", required: false },
    resolves: null,
    verb: null,
    ttl: false,
    sourceDimension: null,
    lotSourceKind: null,
    // Not surfaced: this batch burn is how a plan period's unused credits
    // expire on renewal / plan change / cancellation, but expiry events stay
    // internal — the credit-history view is scoped to monthly plan grants and
    // consumption charges only.
    history: null,
    meta: null
  })
};
var TransactionKinds = Object.keys(LedgerKindRegistry);
var LedgerKind = Object.fromEntries(TransactionKinds.map((k) => [k, k]));
var HoldKinds = TransactionKinds.filter((k) => LedgerKindRegistry[k].flow === "hold");
var HistoryVisibleSinkVerbs = [
  "chat",
  ...EARMARKED_VERB_VALUES
];

// ../../packages/billing-contracts/src/credit-lot.ts
var Iso8601 = v6.pipe(v6.string(), v6.isoTimestamp());
var NonNegativeBigintString = v6.pipe(
  v6.string(),
  v6.regex(/^[0-9]+$/, "expected non-negative integer string")
);
var CreditLotSchema = v6.pipe(
  v6.object({
    id: typedIdSchema("clt"),
    userId: typedIdSchema("usr"),
    sourceKind: v6.picklist(SourceKinds),
    sourceTransactionId: typedIdSchema("ltx"),
    paymentId: v6.nullable(typedIdSchema("pay")),
    subscriptionId: v6.nullable(typedIdSchema("sub")),
    planPeriodStart: v6.nullable(Iso8601),
    planPeriodEnd: v6.nullable(Iso8601),
    grantedCredits: NonNegativeBigintString,
    availableCredits: NonNegativeBigintString,
    reservedCredits: NonNegativeBigintString,
    consumedCredits: NonNegativeBigintString,
    refundedCredits: NonNegativeBigintString,
    expiredCredits: NonNegativeBigintString,
    expiresAt: v6.nullable(Iso8601),
    refundable: v6.boolean(),
    createdAt: Iso8601,
    updatedAt: Iso8601
  }),
  v6.check((lot) => {
    const granted = BigInt(lot.grantedCredits);
    const sum = BigInt(lot.availableCredits) + BigInt(lot.reservedCredits) + BigInt(lot.consumedCredits) + BigInt(lot.refundedCredits) + BigInt(lot.expiredCredits);
    return granted === sum;
  }, "granted must equal available + reserved + consumed + refunded + expired")
);
var AllocationKinds = [
  "reserve",
  "settle_consumed",
  "settle_released",
  "settle_overshoot",
  "expire_reserved",
  "refund",
  "expire"
];
var CreditLotAllocationSchema = v6.object({
  id: typedIdSchema("cla"),
  transactionId: typedIdSchema("ltx"),
  lotId: typedIdSchema("clt"),
  kind: v6.picklist(AllocationKinds),
  credits: NonNegativeBigintString,
  createdAt: Iso8601
});

// ../../packages/billing-contracts/src/model-catalog.ts
import * as v7 from "valibot";
var ProviderModelKeySchema = v7.pipe(
  v7.string(),
  v7.regex(/^[^/]+\/.+$/, "expected provider/model key"),
  v7.transform((s) => s)
);
function splitProviderModelKey(key) {
  const idx = key.indexOf("/");
  return { providerId: key.slice(0, idx), modelId: key.slice(idx + 1) };
}
var OPENROUTER_DEEPSEEK_FLASH_ENTRY = {
  supportsCache: true,
  cost: {
    inputPerMillion: 30,
    outputPerMillion: 120,
    cacheReadPerMillion: 1,
    cacheCreationPerMillion: 30
  },
  limit: { context: 1048576, output: 943718 },
  capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
  pricingSource: "openrouter.ai/api/v1/models/deepseek/deepseek-v4.1-flash-20261017/endpoints checked 2026-10-22 \u2014 standard tier ($0.30/$1.20 per MTok, cache read $0.006 ceiled; cache writes charged input rate per openrouter.ai/docs/guides/best-practices/prompt-caching)"
};
var VERIFIED_CNY_PER_USD = 6.7138;
var VERIFIED_CNY_FX_SOURCE = `Bank of China boc.cn/sourcedb/whpj/ checked 2026-10-31; CNY/USD ${VERIFIED_CNY_PER_USD}, ceiled to whole cents`;
function cnyPerMillionToUsdCents(cny) {
  return Math.ceil(cny * 100 / VERIFIED_CNY_PER_USD);
}
var MODEL_CATALOG = {
  // ── Gemini direct ───────────────────────────────────────────────────────────
  "gemini/gemini-2.5-flash": {
    agentRoutable: false,
    supportsCache: false,
    cost: {
      inputPerMillion: 30,
      outputPerMillion: 250
    },
    limit: { context: 1048576, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "ai.google.dev/gemini-api/docs/pricing checked 2026-07-29 \u2014 Gemini 2.5 Flash standard text input $0.30/MTok, output including thinking $2.50/MTok"
  },
  "gemini/gemini-4-argon": {
    supportsCache: true,
    cost: {
      inputPerMillion: 200,
      outputPerMillion: 1e3,
      cacheReadPerMillion: 10,
      cacheCreationPerMillion: 0
    },
    limit: { context: 1048576, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "ai.google.dev/gemini-api/docs/pricing checked 2026-10-14 \u2014 Gemini 4 Argon introductory pricing through 2026-11-30: $2/$10 per MTok, implicit cache read $0.10/MTok, no cache creation fee"
  },
  // ── Anthropic Claude Sonnet 5.5 ─────────────────────────────────────────────
  // Claude API id `claude-sonnet-5-5` (dateless pinned snapshot, no dated alias),
  // context 1M, max output 128k, adaptive thinking. Verified via
  // platform.claude.com/docs/en/about-claude/models/overview 2026-09-30.
  // NeoRouter serving claude-sonnet-5-5 is unverified, so there is no neorouter row.
  "anthropic/claude-sonnet-5-5": {
    supportsCache: true,
    cost: {
      inputPerMillion: 200,
      outputPerMillion: 1e3,
      cacheReadPerMillion: 10,
      cacheCreationPerMillion: 250
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/build-with-claude/prompt-caching checked 2026-10-31 \u2014 $2/$10 per MTok (5m cache write $2.50, cache read $0.10; reduced 2026-10-07)"
  },
  // ── Anthropic Claude Sonnet 5 (released 2026-06-30) ─────────────────────────
  // Pricing verified via platform.claude.com/docs/en/about-claude/pricing 2026-09-01.
  // Current standard rate is $2/$10 per MTok (5m cache 1.25x, cache-read 0.1x).
  // Model card:
  //   platform.claude.com/docs/en/about-claude/models/whats-new-sonnet-5
  //   context 1M (default and max), max output 128k, adaptive thinking on by default.
  // Bedrock Sonnet 5 is available through the Claude API on Bedrock and its
  // global cross-region inference profile (`global.anthropic.claude-sonnet-5`).
  // It always runs with the model's native 1M context; there is no `[1m]`
  // model suffix. NeoRouter serves claude-sonnet-5 (confirmed via
  // api.neorouter.ai/v1/models 2026-07-06); see the neorouter row below.
  "anthropic/claude-sonnet-5": {
    supportsCache: true,
    cost: {
      inputPerMillion: 200,
      outputPerMillion: 1e3,
      cacheReadPerMillion: 20,
      cacheCreationPerMillion: 250
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-09-01 \u2014 current standard rate $2/$10 per MTok (5m cache write $2.50, cache read $0.20)"
  },
  // ── Anthropic Claude Opus 5.5 ───────────────────────────────────────────────
  // Claude API id `claude-opus-5-5` (dateless pinned snapshot, no dated alias),
  // context 1M, max output 128k, adaptive thinking always on. Verified via
  // platform.claude.com/docs/en/about-claude/models/overview 2026-09-24.
  // Cache reads are 0.05x base input, not the usual 0.1x. NeoRouter does not
  // serve claude-opus-5-5 (absent from api.neorouter.ai/v1/models 2026-09-24),
  // so there is no neorouter row.
  "anthropic/claude-opus-5-5": {
    supportsCache: true,
    cost: {
      inputPerMillion: 400,
      outputPerMillion: 2e3,
      cacheReadPerMillion: 20,
      cacheCreationPerMillion: 500
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-09-24 \u2014 $4/$20 per MTok (5m cache write $5, cache read $0.20)"
  },
  // ── Anthropic Claude Opus 5 ─────────────────────────────────────────────────
  // Claude API id `claude-opus-5` (dateless pinned snapshot, no dated alias),
  // context 1M, max output 128k, adaptive thinking. Verified via
  // platform.claude.com/docs/en/about-claude/models/all-models 2026-09-04.
  "anthropic/claude-opus-5": {
    supportsCache: true,
    cost: {
      inputPerMillion: 500,
      outputPerMillion: 2500,
      cacheReadPerMillion: 50,
      cacheCreationPerMillion: 625
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-09-04 \u2014 $5/$25 per MTok (5m cache write $6.25, cache read $0.50)"
  },
  // ── Anthropic Claude 4.6 family (Phase 5 expansion) ─────────────────────────
  "anthropic/claude-opus-4-6": {
    supportsCache: true,
    cost: {
      inputPerMillion: 500,
      outputPerMillion: 2500,
      cacheReadPerMillion: 50,
      cacheCreationPerMillion: 625
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-06-12"
  },
  "anthropic/claude-sonnet-4-6": {
    supportsCache: true,
    cost: {
      inputPerMillion: 300,
      outputPerMillion: 1500,
      cacheReadPerMillion: 30,
      cacheCreationPerMillion: 375
    },
    limit: { context: 1e6, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-06-12"
  },
  "anthropic/claude-sonnet-4-5": {
    // Priced for historical invocations; not in MODEL_ROUTING / the picker.
    agentRoutable: false,
    // dated alias: claude-sonnet-4-5-20250929
    // verified via platform.claude.com/docs/en/about-claude/models/all-models 2026-06-17
    providerSku: "claude-sonnet-4-5-20250929",
    supportsCache: true,
    cost: {
      inputPerMillion: 300,
      outputPerMillion: 1500,
      cacheReadPerMillion: 30,
      cacheCreationPerMillion: 375
    },
    limit: { context: 2e5, output: 65536 },
    // Extended thinking supported per model card (reasoning: true)
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-06-17"
  },
  "anthropic/claude-haiku-4-5": {
    // dated alias verified via platform.claude.com/docs/en/about-claude/models/all-models 2026-06-12
    providerSku: "claude-haiku-4-5-20251001",
    supportsCache: true,
    cost: {
      inputPerMillion: 100,
      outputPerMillion: 500,
      cacheReadPerMillion: 10,
      cacheCreationPerMillion: 125
    },
    limit: { context: 2e5, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: false, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing checked 2026-06-12"
  },
  // ── Bedrock Claude family (global cross-region inference profiles) ──────────
  // All bedrock/* rows route through `global.*` cross-region inference profiles,
  // which AWS bills at the same per-token rate as Anthropic direct. The +10%
  // regional premium these rows used to carry applies only to `us.*` regional
  // profiles; those are no longer reachable since the default-model pins landed
  // in PROVIDER_REGISTRY.bedrock. Measured against gross (RECORD_TYPE=Usage)
  // Cost Explorer data over 7 consecutive days: derived-vs-billed matched to
  // 100.0% for `global.*` and 90.9% (= 1/1.1) while the +10% was applied.
  // providerSku values are the inference profile IDs sent to InvokeModel.
  "bedrock/claude-fable-5-1": {
    // Global cross-region inference profile ID from the AWS Bedrock model card
    // (docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-fable-5-1.html,
    // checked 2026-09-03). Wanaka routes this modelId through Bedrock only;
    // Anthropic Direct and NeoRouter are omitted until those catalog rows exist.
    providerSku: "global.anthropic.claude-fable-5-1",
    supportsCache: true,
    cost: {
      inputPerMillion: 1e3,
      outputPerMillion: 5e3,
      cacheReadPerMillion: 25,
      cacheCreationPerMillion: 1250
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global Bedrock profile, same rate as Anthropic direct) checked 2026-09-03 \u2014 $10/$50 per MTok, 5m cache write $12.50, cache read $0.25 (0.025x)"
  },
  "bedrock/claude-opus-5-5": {
    // Global cross-region inference profile ID, verified ACTIVE in the Wanaka
    // mgmt/dev/staging/prod accounts via `bedrock get-inference-profile`
    // 2026-09-24, with the model agreement AVAILABLE and AUTHORIZED in each
    // (`bedrock get-foundation-model-availability`). Bedrock only
    // accepts Opus 5.5 through an inference profile
    // (`inferenceTypesSupported: [INFERENCE_PROFILE]`), not the bare model id.
    providerSku: "global.anthropic.claude-opus-5-5",
    supportsCache: true,
    cost: {
      inputPerMillion: 400,
      outputPerMillion: 2e3,
      cacheReadPerMillion: 20,
      cacheCreationPerMillion: 500
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "AWS Marketplace agreement offer for anthropic.claude-opus-5-5 checked 2026-09-24 \u2014 global standard $4/$20 per MTok, cache write $5, cache read $0.20 (same rate as Anthropic direct)"
  },
  "bedrock/claude-opus-5": {
    // Global cross-region inference profile ID, verified ACTIVE in the Wanaka
    // dev/staging/prod accounts via `bedrock list-inference-profiles` 2026-09-04.
    // Bedrock only accepts Opus 5 through an inference profile
    // (`inferenceTypesSupported: [INFERENCE_PROFILE]`), not the bare model id.
    providerSku: "global.anthropic.claude-opus-5",
    supportsCache: true,
    cost: {
      inputPerMillion: 500,
      outputPerMillion: 2500,
      cacheReadPerMillion: 50,
      cacheCreationPerMillion: 625
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global Bedrock profile, same rate as Anthropic direct) checked 2026-09-04 \u2014 $5/$25 per MTok, 5m cache write $6.25, cache read $0.50"
  },
  "bedrock/claude-sonnet-5-5": {
    // Global cross-region inference profile ID, verified ACTIVE in the Wanaka
    // mgmt/dev/staging/prod accounts via `bedrock get-inference-profile`
    // 2026-09-30, with the model agreement AVAILABLE and AUTHORIZED in each
    // (`bedrock get-foundation-model-availability`).
    providerSku: "global.anthropic.claude-sonnet-5-5",
    supportsCache: true,
    cost: {
      inputPerMillion: 200,
      outputPerMillion: 1e3,
      cacheReadPerMillion: 10,
      cacheCreationPerMillion: 250
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "AWS Marketplace offer-5fu2rhus3byrs and aws.amazon.com/bedrock/pricing checked 2026-10-31 \u2014 global standard $2/$10 per MTok, 5m cache write $2.50, cache read $0.10 (reduced 2026-10-07)"
  },
  "bedrock/claude-sonnet-5": {
    // Global cross-region inference profile ID from the AWS Bedrock model card
    // (docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html,
    // checked 2026-09-01).
    providerSku: "global.anthropic.claude-sonnet-5",
    supportsCache: true,
    cost: {
      inputPerMillion: 200,
      outputPerMillion: 1e3,
      cacheReadPerMillion: 20,
      cacheCreationPerMillion: 250
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global Bedrock profile, same rate as Anthropic direct) checked 2026-09-01 \u2014 current standard rate $2/$10 per MTok"
  },
  "bedrock/claude-opus-4-6": {
    // Global cross-region inference profile ID (from CLAUDE_MODEL_MAP, confirmed pattern)
    providerSku: "global.anthropic.claude-opus-4-6-v1",
    supportsCache: true,
    cost: {
      inputPerMillion: 500,
      outputPerMillion: 2500,
      cacheReadPerMillion: 50,
      cacheCreationPerMillion: 625
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global cross-region profile, same rate as Anthropic direct) verified against AWS Cost Explorer gross usage 2026-08-11"
  },
  "bedrock/claude-sonnet-4-6": {
    // Global cross-region inference profile ID (from CLAUDE_MODEL_MAP, confirmed pattern)
    providerSku: "global.anthropic.claude-sonnet-4-6",
    supportsCache: true,
    cost: {
      inputPerMillion: 300,
      outputPerMillion: 1500,
      cacheReadPerMillion: 30,
      cacheCreationPerMillion: 375
    },
    limit: { context: 1e6, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global cross-region profile, same rate as Anthropic direct) verified against AWS Cost Explorer gross usage 2026-08-11"
  },
  "bedrock/claude-sonnet-4-5": {
    // Priced for historical invocations; not in MODEL_ROUTING / the picker.
    agentRoutable: false,
    // Global cross-region inference profile ID verified via
    // docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-4-5.html 2026-06-17
    providerSku: "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    supportsCache: true,
    cost: {
      inputPerMillion: 300,
      outputPerMillion: 1500,
      cacheReadPerMillion: 30,
      cacheCreationPerMillion: 375
    },
    limit: { context: 2e5, output: 65536 },
    // Extended thinking supported per model card
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global cross-region profile, same rate as Anthropic direct) verified against AWS Cost Explorer gross usage 2026-08-11"
  },
  "bedrock/claude-haiku-4-5": {
    // Global cross-region inference profile ID (from CLAUDE_MODEL_MAP, confirmed pattern)
    providerSku: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
    supportsCache: true,
    cost: {
      inputPerMillion: 100,
      outputPerMillion: 500,
      cacheReadPerMillion: 10,
      cacheCreationPerMillion: 125
    },
    limit: { context: 2e5, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: false, structuredOutput: true },
    pricingSource: "platform.claude.com/docs/en/about-claude/pricing (global cross-region profile, same rate as Anthropic direct) verified against AWS Cost Explorer gross usage 2026-08-11"
  },
  // ── NeoRouter Claude models (Anthropic-compatible proxy, dev-only) ───────────
  // NeoRouter (https://api.neorouter.ai) is an Anthropic-protocol proxy used in
  // local dev to save tokens. Pricing mirrors the Anthropic direct rates (same
  // wire protocol, same model identifiers); re-verify if neorouter publishes its
  // own rate card. pricingSource: "mirrors anthropic direct — neorouter.ai has no
  // separate published rate card as of 2026-06-16".
  // NeoRouter does NOT offer claude-sonnet-4-5 — no neorouter/claude-sonnet-4-5 row.
  // NeoRouter serves claude-opus-5 (confirmed via api.neorouter.ai/v1/models
  // and POST /v1/messages 2026-09-07); it accepts the plain alias and mirrors
  // anthropic/claude-opus-5 pricing.
  "neorouter/claude-opus-5": {
    providerSku: "claude-opus-5",
    supportsCache: true,
    cost: {
      inputPerMillion: 500,
      outputPerMillion: 2500,
      cacheReadPerMillion: 50,
      cacheCreationPerMillion: 625
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "mirrors anthropic/claude-opus-5 \u2014 neorouter.ai has no separate published rate card; availability confirmed via api.neorouter.ai/v1/models 2026-09-07"
  },
  "neorouter/claude-opus-4-6": {
    // NeoRouter accepts the plain alias form (no dated suffix required)
    providerSku: "claude-opus-4-6",
    supportsCache: true,
    cost: {
      inputPerMillion: 500,
      outputPerMillion: 2500,
      cacheReadPerMillion: 50,
      cacheCreationPerMillion: 625
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "mirrors anthropic/claude-opus-4-6 \u2014 neorouter.ai has no separate published rate card as of 2026-06-16"
  },
  "neorouter/claude-sonnet-4-6": {
    providerSku: "claude-sonnet-4-6",
    supportsCache: true,
    cost: {
      inputPerMillion: 300,
      outputPerMillion: 1500,
      cacheReadPerMillion: 30,
      cacheCreationPerMillion: 375
    },
    limit: { context: 1e6, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "mirrors anthropic/claude-sonnet-4-6 \u2014 neorouter.ai has no separate published rate card as of 2026-06-16"
  },
  // NeoRouter serves claude-sonnet-5 (confirmed via api.neorouter.ai/v1/models 2026-07-06);
  // it accepts the plain alias form and mirrors anthropic/claude-sonnet-5 pricing.
  "neorouter/claude-sonnet-5": {
    providerSku: "claude-sonnet-5",
    supportsCache: true,
    cost: {
      inputPerMillion: 200,
      outputPerMillion: 1e3,
      cacheReadPerMillion: 20,
      cacheCreationPerMillion: 250
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "mirrors anthropic/claude-sonnet-5 \u2014 neorouter.ai has no separate published rate card; availability confirmed via api.neorouter.ai/v1/models 2026-07-06"
  },
  "neorouter/claude-haiku-4-5": {
    // NeoRouter requires the dated alias form (confirmed from CLAUDE_MODEL_MAP)
    providerSku: "claude-haiku-4-5-20251001",
    supportsCache: true,
    cost: {
      inputPerMillion: 100,
      outputPerMillion: 500,
      cacheReadPerMillion: 10,
      cacheCreationPerMillion: 125
    },
    limit: { context: 2e5, output: 65536 },
    capabilities: { toolCall: true, vision: true, reasoning: false, structuredOutput: true },
    pricingSource: "mirrors anthropic/claude-haiku-4-5 \u2014 neorouter.ai has no separate published rate card as of 2026-06-16"
  },
  // ── Azure OpenAI gpt-5 ───────────────────────────────────────────────────────
  // Disabled pending verified Azure pricing. Azure pricing page was inaccessible
  // on 2026-06-12. Re-enable once azure.microsoft.com/pricing/details/cognitive-services/
  // openai-service/ confirms the actual Azure price for gpt-5.
  // Model availability on Azure Foundry confirmed via learn.microsoft.com/en-us/azure/
  // foundry/foundry-models/concepts/models-sold-directly-by-azure (gpt-5 2025-08-07,
  // context 400k, output 128k).
  "azure/gpt-5": {
    disabled: true,
    supportsCache: false,
    cost: {
      inputPerMillion: 0,
      outputPerMillion: 0
    },
    limit: { context: 4e5, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "azure.microsoft.com/pricing/details/cognitive-services/openai-service/ \u2014 disabled pending verified Azure pricing"
  },
  // ── Kimi (Moonshot AI) ───────────────────────────────────────────────────────
  // K3 uses the verified FX reference; historical K2.x rows retain their old estimates.
  "moonshot/kimi-k3": {
    // Wire the OpenPlatform Messages API id. The Claude Code `[1m]` suffix
    // (platform.kimi.com/docs/guide/claude-code-kimi) is unrecognized by the
    // bundled CLI in @anthropic-ai/claude-agent-sdk 0.3.259 and yields
    // thinking-only turns with no assistant text. Compaction still uses limit.context.
    // Messages usage separates new input, cache reads, and default 5m cache writes.
    supportsCache: true,
    cost: {
      inputPerMillion: cnyPerMillionToUsdCents(20),
      outputPerMillion: cnyPerMillionToUsdCents(100),
      cacheReadPerMillion: cnyPerMillionToUsdCents(2),
      cacheCreationPerMillion: cnyPerMillionToUsdCents(20)
    },
    limit: { context: 1e6, output: 131072 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: `platform.kimi.com/docs/guide/context-caching and platform.kimi.com/ checked 2026-10-31 \u2014 CNY 20/100/2/20 per MTok input/output/read/5m-write; optional 1h writes are not represented; ${VERIFIED_CNY_FX_SOURCE}`
  },
  "moonshot/kimi-k2-5": {
    // Retired from the OpenPlatform model list (2026-08-31). Keep pricing for
    // historical invocations; not in MODEL_ROUTING / the picker.
    agentRoutable: false,
    // Kimi K2.x pricing docs list cache-read but not cache-write/creation pricing.
    // Treating as cache-unsupported; if Kimi adds cache-write pricing, set supportsCache=true
    // and add cacheCreationPerMillion.
    supportsCache: false,
    cost: {
      inputPerMillion: 56,
      // ¥4.00 → ceil(55.17) = 56 (ceil-for-safety)
      outputPerMillion: 290,
      // ¥21 → ceil(289.66) = 290
      cacheReadPerMillion: 10
      // ¥0.70 → ceil(9.66) = 10 (informational; not charged when supportsCache=false)
    },
    limit: { context: 262144, output: 8192 },
    // reasoning: not verified from vendor docs as of 2026-06-12; defaulting false (fail-safe)
    capabilities: { toolCall: true, vision: true, reasoning: false, structuredOutput: true },
    pricingSource: "platform.kimi.com/docs/pricing/chat-k25 (historical CNY\u2192USD at 7.25) last checked 2026-06-12; current quote not independently reverified 2026-10-31"
  },
  "moonshot/kimi-k2-6": {
    // Kept for historical invocation pricing; not in MODEL_ROUTING / the picker.
    agentRoutable: false,
    // OpenPlatform Messages API id is `kimi-k2.6` (platform.kimi.com/docs/models).
    providerSku: "kimi-k2.6",
    // Kimi K2.x pricing docs list cache-read but not cache-write/creation pricing.
    supportsCache: false,
    cost: {
      inputPerMillion: 90,
      // ¥6.50 → ceil(89.66) = 90
      outputPerMillion: 373,
      // ¥27 → ceil(372.41) = 373 (ceil-for-safety)
      cacheReadPerMillion: 16
      // ¥1.10 → ceil(15.17) = 16 (ceil-for-safety; informational)
    },
    limit: { context: 262144, output: 8192 },
    // reasoning: not verified from vendor docs as of 2026-06-12; defaulting false (fail-safe)
    capabilities: { toolCall: true, vision: true, reasoning: false, structuredOutput: true },
    pricingSource: "platform.kimi.com/docs/pricing/chat-k26 (historical CNY\u2192USD at 7.25) last checked 2026-06-12; current quote not independently reverified 2026-10-31"
  },
  // ── MiniMax M-series ─────────────────────────────────────────────────────────
  // M3 uses the verified FX reference; M2.x retain historical, unreverified quotes.
  // MiniMax-M3 pricing is at the standard (≤512k input tokens) tier;
  // The doubled >512k tier is not represented by the flat cost below.
  "minimax/MiniMax-M3": {
    // Implicit-cache misses are new input; cache creation has no separate charge.
    supportsCache: true,
    cost: {
      inputPerMillion: cnyPerMillionToUsdCents(2.1),
      outputPerMillion: cnyPerMillionToUsdCents(8.4),
      cacheReadPerMillion: cnyPerMillionToUsdCents(0.42),
      cacheCreationPerMillion: 0
    },
    limit: { context: 1e6, output: 8192 },
    capabilities: { toolCall: true, vision: true, reasoning: false, structuredOutput: true },
    pricingSource: `platform.minimax.cn/docs/pricing/overview and /docs/api-reference/text-prompt-caching checked 2026-10-31 \u2014 CNY 2.10/8.40/0.42 per MTok input/output/read, no separate implicit write; standard <=512k only, >512k doubled tier not represented; ${VERIFIED_CNY_FX_SOURCE}`
  },
  "minimax/MiniMax-M2.7": {
    supportsCache: true,
    cost: {
      inputPerMillion: 29,
      // ¥2.10 → ceil(28.97) = 29
      outputPerMillion: 116,
      // ¥8.40 → ceil(115.86) = 116
      cacheReadPerMillion: 6,
      // ¥0.42 → ceil(5.79) = 6
      cacheCreationPerMillion: 37
      // ¥2.625 → ceil(36.21) = 37 (ceil-for-safety)
    },
    limit: { context: 2e5, output: 8192 },
    capabilities: { toolCall: true, vision: false, reasoning: false, structuredOutput: true },
    pricingSource: "platform.minimaxi.com/docs/guides/pricing-paygo.md (historical CNY\u2192USD at 7.25) last checked 2026-06-12; current China quote not independently reverified 2026-10-31"
  },
  "minimax/MiniMax-M2.5": {
    supportsCache: true,
    cost: {
      inputPerMillion: 29,
      // ¥2.10 → ceil(28.97) = 29
      outputPerMillion: 116,
      // ¥8.40 → ceil(115.86) = 116
      cacheReadPerMillion: 3,
      // ¥0.21 → ceil(2.90) = 3
      cacheCreationPerMillion: 37
      // ¥2.625 → ceil(36.21) = 37 (ceil-for-safety)
    },
    limit: { context: 2e5, output: 8192 },
    capabilities: { toolCall: true, vision: false, reasoning: false, structuredOutput: true },
    pricingSource: "platform.minimaxi.com/docs/guides/pricing-paygo.md (historical CNY\u2192USD at 7.25) last checked 2026-06-12; current China quote not independently reverified 2026-10-31"
  },
  // ── DeepSeek ───────────────────────────────────────────────────────────────
  // Peak USD prices from api-docs.deepseek.com/quick_start/pricing, stored as
  // cents per 1M tokens. Off-peak is half and is not used, so a peak-hour call
  // cannot be underbilled. Cache hits are billed; the official hit rates are
  // fractional cents, so they are ceiled to the next integer cent. There is no
  // cache-write price, so cache creation stays 0.
  "deepseek/deepseek-flash": {
    // Lite's primary route, plus the price for historical turns that already
    // ran on the official API.
    providerSku: "deepseek-flash",
    supportsCache: true,
    cost: {
      inputPerMillion: 30,
      // $0.30 peak cache miss
      outputPerMillion: 120,
      // $1.20 peak
      cacheReadPerMillion: 1,
      // $0.006 peak cache hit → ceil(0.6) = 1
      cacheCreationPerMillion: 0
    },
    limit: { context: 1e6, output: 384e3 },
    capabilities: { toolCall: true, vision: true, reasoning: true, structuredOutput: true },
    pricingSource: "api-docs.deepseek.com/quick_start/pricing (DeepSeek-V4.1-Flash, peak; cache hit ceiled) checked 2026-09-22"
  },
  "deepseek/deepseek-v4-pro": {
    // Trial showed this model is unsuitable: it cannot accept image blocks, and
    // run_game_test sends screenshots back as images. Keep the row so historical
    // invocations still price. Not in MODEL_ROUTING, the dev picker, or the allowlist.
    agentRoutable: false,
    providerSku: "deepseek-v4-pro",
    supportsCache: true,
    cost: {
      inputPerMillion: 132,
      // $1.32 peak cache miss
      outputPerMillion: 396,
      // $3.96 peak
      cacheReadPerMillion: 5,
      // $0.044 peak cache hit → ceil(4.4) = 5
      cacheCreationPerMillion: 0
    },
    limit: { context: 1e6, output: 384e3 },
    capabilities: { toolCall: true, vision: false, reasoning: true, structuredOutput: true },
    pricingSource: "api-docs.deepseek.com/quick_start/pricing (DeepSeek-V4-Pro-0813, peak; cache hit ceiled) checked 2026-09-22"
  },
  // OpenRouter pricing is independent of DeepSeek's direct API rates.
  "openrouter/deepseek-flash": {
    ...OPENROUTER_DEEPSEEK_FLASH_ENTRY,
    providerSku: "~deepseek/deepseek-flash-latest"
  }
};
var CATALOG_KEY_BY_PROVIDER_SKU = (() => {
  const index = /* @__PURE__ */ new Map();
  for (const [key, entry] of Object.entries(MODEL_CATALOG)) {
    if (entry.providerSku === void 0) continue;
    const { providerId } = splitProviderModelKey(key);
    const skuKey = `${providerId}/${entry.providerSku}`;
    const clash = index.get(skuKey);
    if (clash !== void 0) {
      throw new Error(
        `model catalog: providerSku "${entry.providerSku}" is carried by both "${clash}" and "${key}". A SKU must name exactly one row within a provider \u2014 give one of them its own SKU, or drop it.`
      );
    }
    index.set(skuKey, key);
  }
  return index;
})();

// ../../packages/billing-contracts/src/provider-id.ts
var PROVIDER_IDS = [
  "anthropic",
  "bedrock",
  "moonshot",
  "minimax",
  "neorouter",
  "deepseek",
  "openrouter",
  "gemini"
];

// ../../packages/billing-contracts/src/provider-registry.ts
var REGION_PLACEHOLDER = "{region}";
var AUTH_ENV_KEY_SCHEME = {
  ANTHROPIC_API_KEY: "x-api-key",
  ANTHROPIC_AUTH_TOKEN: "bearer",
  AWS_BEARER_TOKEN_BEDROCK: "bearer"
};
function bedrockProfileId(key) {
  return catalogModelId(key, { requireProviderSku: true, requireAgentRoutable: true });
}
function catalogModelId(key, options = {}) {
  const entry = MODEL_CATALOG[key];
  if (!entry) throw new Error(`provider registry: missing catalog row ${key}`);
  if (entry.disabled === true || options.requireAgentRoutable && entry.agentRoutable === false) {
    throw new Error(`provider registry: catalog row ${key} is not agent-routable`);
  }
  if (options.requireProviderSku && !entry.providerSku) {
    throw new Error(`provider registry: catalog row ${key} has no providerSku`);
  }
  return entry.providerSku ?? splitProviderModelKey(key).modelId;
}
var PROVIDER_REGISTRY = {
  anthropic: {
    providerId: "anthropic",
    displayName: "Anthropic Direct",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://api.anthropic.com",
      streamEncoding: "sse"
    },
    subprocessEnv: {
      // The sandbox puts a `wcap_*` capability token in ANTHROPIC_API_KEY
      // rather than an `sk-ant-api*` key, so the CLI's built-in direct-key
      // check returns false and falls back to the main model unless Haiku is
      // explicitly pinned here.
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("anthropic/claude-haiku-4-5")
    },
    authEnvKey: "ANTHROPIC_API_KEY",
    serverCredential: { kind: "env", fromEnv: "ANTHROPIC_API_KEY" }
  },
  bedrock: {
    providerId: "bedrock",
    displayName: "AWS Bedrock",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BEDROCK_BASE_URL",
      baseUrlTemplate: `https://bedrock-runtime.${REGION_PLACEHOLDER}.amazonaws.com`,
      streamEncoding: "aws-event-stream"
    },
    subprocessEnv: {
      // Instructs Claude SDK to route through the Bedrock translation layer.
      CLAUDE_CODE_USE_BEDROCK: "1",
      AWS_REGION: { fromEnv: "AWS_REGION" },
      // Prefer global cross-region profiles for built-in model resolution.
      ANTHROPIC_BEDROCK_REGION_PREFIX: "global",
      // Auxiliary family aliases, not the turn model. The turn passes --model.
      // An unset Opus default is probed with a one-token invoke; any failure
      // other than 429 replaces it for the rest of the process. Opus 5 is
      // enough for that alias.
      ANTHROPIC_DEFAULT_HAIKU_MODEL: bedrockProfileId("bedrock/claude-haiku-4-5"),
      ANTHROPIC_DEFAULT_SONNET_MODEL: bedrockProfileId("bedrock/claude-sonnet-5-5"),
      ANTHROPIC_DEFAULT_OPUS_MODEL: bedrockProfileId("bedrock/claude-opus-5")
    },
    // The CLI sends whatever sits in AWS_BEARER_TOKEN_BEDROCK as
    // `Authorization: Bearer`, so the capability rides that slot; the gateway
    // replaces it with a key it mints from its own AWS identity.
    authEnvKey: "AWS_BEARER_TOKEN_BEDROCK",
    serverCredential: { kind: "aws-bedrock-short-term-key" }
  },
  moonshot: {
    providerId: "moonshot",
    displayName: "Moonshot (Kimi Direct)",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://api.moonshot.cn/anthropic",
      streamEncoding: "sse"
    },
    // Claude Code's Goal Stop hook calls the model selected by this alias. The
    // CLI otherwise falls back to Anthropic Haiku, which Moonshot does not
    // expose. K3 is the routable Moonshot model and is resolved from the
    // billing catalog so the evaluator request is metered as Kimi usage.
    subprocessEnv: {
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("moonshot/kimi-k3")
    },
    // Moonshot uses Bearer token auth (Authorization: Bearer <key>), not API-key header.
    // Claude SDK reads ANTHROPIC_AUTH_TOKEN for Bearer auth and ANTHROPIC_API_KEY for
    // x-api-key auth. Moonshot requires Bearer, so the capability rides ANTHROPIC_AUTH_TOKEN.
    authEnvKey: "ANTHROPIC_AUTH_TOKEN",
    serverCredential: { kind: "env", fromEnv: "MOONSHOT_API_KEY" }
  },
  minimax: {
    providerId: "minimax",
    displayName: "MiniMax Direct",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://api.minimaxi.com/anthropic",
      streamEncoding: "sse"
    },
    // MiniMax has no Anthropic Haiku alias. Point the evaluator at the
    // provider's routable M3 model instead of letting the CLI use its
    // Anthropic default.
    subprocessEnv: {
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("minimax/MiniMax-M3")
    },
    authEnvKey: "ANTHROPIC_API_KEY",
    serverCredential: { kind: "env", fromEnv: "MINIMAX_API_KEY" }
  },
  deepseek: {
    providerId: "deepseek",
    displayName: "DeepSeek",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://api.deepseek.com/anthropic",
      streamEncoding: "sse"
    },
    // Keep the evaluator on DeepSeek's verified Anthropic-compatible model;
    // this also makes the behavior explicit instead of relying on the CLI's
    // built-in Haiku fallback.
    subprocessEnv: {
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("deepseek/deepseek-flash")
    },
    // DeepSeek's Anthropic-compatible endpoint accepts x-api-key. The Claude
    // SDK sends ANTHROPIC_API_KEY as that header.
    authEnvKey: "ANTHROPIC_API_KEY",
    serverCredential: { kind: "env", fromEnv: "DEEPSEEK_API_KEY" }
  },
  openrouter: {
    providerId: "openrouter",
    displayName: "OpenRouter",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://openrouter.ai/api",
      streamEncoding: "sse"
    },
    subprocessEnv: {
      // OpenRouter requires bearer auth; clear any inherited API key so the
      // SDK cannot send the Anthropic key alongside the session capability.
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("openrouter/deepseek-flash")
    },
    authEnvKey: "ANTHROPIC_AUTH_TOKEN",
    serverCredential: { kind: "env", fromEnv: "OPENROUTER_API_KEY" }
  },
  neorouter: {
    providerId: "neorouter",
    displayName: "NeoRouter (Anthropic-compatible)",
    protocol: "anthropic",
    endpoint: {
      // NeoRouter exposes an Anthropic-compatible endpoint.
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://api.neorouter.ai",
      streamEncoding: "sse"
    },
    subprocessEnv: {
      // NeoRouter intermittently returns Bedrock InvokeModel schema errors when
      // Anthropic context-management fields are present. Keep adaptive thinking
      // enabled while omitting experimental request fields on this provider only.
      CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: "1",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("neorouter/claude-haiku-4-5")
    },
    authEnvKey: "ANTHROPIC_API_KEY",
    serverCredential: { kind: "env", fromEnv: "NEOROUTER_API_KEY" }
  },
  gemini: {
    providerId: "gemini",
    displayName: "Google Gemini Direct",
    protocol: "anthropic",
    endpoint: {
      envKey: "ANTHROPIC_BASE_URL",
      baseUrlTemplate: "https://generativelanguage.googleapis.com",
      streamEncoding: "sse"
    },
    subprocessEnv: {
      ANTHROPIC_DEFAULT_HAIKU_MODEL: catalogModelId("gemini/gemini-4-argon")
    },
    authEnvKey: "ANTHROPIC_API_KEY",
    serverCredential: { kind: "env", fromEnv: "GEMINI_API_KEY" }
  }
};
function providerAuthScheme(config) {
  const scheme = AUTH_ENV_KEY_SCHEME[config.authEnvKey];
  if (!scheme) {
    throw new Error(
      `provider ${config.providerId}: authEnvKey "${config.authEnvKey}" has no defined wire scheme`
    );
  }
  return scheme;
}

// ../../packages/billing-contracts/src/model-routing.ts
var MODEL_ROUTING = {
  // ── Anthropic Claude Fable 5.1 (Bedrock only) ─────────────────────────────
  // Anthropic Direct and NeoRouter are omitted until those catalog rows exist.
  "claude-fable-5-1": {
    modelId: "claude-fable-5-1",
    displayName: "Claude Fable 5.1",
    strategy: "failover",
    providers: [{ providerId: "bedrock", role: "primary" }]
  },
  // ── Anthropic Claude Opus 5.5 ─────────────────────────────────────────────
  // Bedrock is primary for AWS runtimes; Anthropic remains the standby.
  // NeoRouter is omitted until it serves this model.
  "claude-opus-5-5": {
    modelId: "claude-opus-5-5",
    displayName: "Claude Opus 5.5",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" }
    ]
  },
  // ── Anthropic Claude Opus 5 ───────────────────────────────────────────────
  // Bedrock is primary for AWS runtimes; Anthropic and NeoRouter remain
  // standbys for environments that provide those credentials.
  "claude-opus-5": {
    modelId: "claude-opus-5",
    displayName: "Claude Opus 5",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" },
      { providerId: "neorouter", role: "standby" }
    ]
  },
  // ── Anthropic Claude Opus 4.6 ─────────────────────────────────────────────
  "claude-opus-4-6": {
    modelId: "claude-opus-4-6",
    displayName: "Claude Opus 4.6",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" },
      { providerId: "neorouter", role: "standby" }
    ]
  },
  // ── Anthropic Claude Sonnet 5.5 ───────────────────────────────────────────
  // Bedrock is primary for AWS runtimes; Anthropic remains the standby.
  // NeoRouter is omitted until it is confirmed to serve this model.
  "claude-sonnet-5-5": {
    modelId: "claude-sonnet-5-5",
    displayName: "Claude Sonnet 5.5",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" }
    ]
  },
  // ── Anthropic Claude Sonnet 5 ─────────────────────────────────────────────
  // Bedrock is primary for AWS runtimes; Anthropic and NeoRouter remain
  // standbys for environments that provide those credentials.
  "claude-sonnet-5": {
    modelId: "claude-sonnet-5",
    displayName: "Claude Sonnet 5",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" },
      { providerId: "neorouter", role: "standby" }
    ]
  },
  // ── Anthropic Claude Sonnet 4.x ───────────────────────────────────────────
  "claude-sonnet-4-6": {
    modelId: "claude-sonnet-4-6",
    displayName: "Claude Sonnet 4.6",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" },
      { providerId: "neorouter", role: "standby" }
    ]
  },
  "claude-haiku-4-5": {
    modelId: "claude-haiku-4-5",
    displayName: "Claude Haiku 4.5",
    strategy: "failover",
    providers: [
      { providerId: "bedrock", role: "primary" },
      { providerId: "anthropic", role: "standby" },
      { providerId: "neorouter", role: "standby" }
    ]
  },
  // ── Kimi (Moonshot AI) ───────────────────────────────────────────────────────
  "kimi-k3": {
    modelId: "kimi-k3",
    displayName: "Kimi K3",
    strategy: "failover",
    providers: [{ providerId: "moonshot", role: "primary" }]
  },
  // ── MiniMax M-series ──────────────────────────────────────────────────────
  "MiniMax-M3": {
    modelId: "MiniMax-M3",
    displayName: "MiniMax M3",
    strategy: "failover",
    providers: [{ providerId: "minimax", role: "primary" }]
  },
  "MiniMax-M2.7": {
    modelId: "MiniMax-M2.7",
    displayName: "MiniMax M2.7",
    strategy: "failover",
    providers: [{ providerId: "minimax", role: "primary" }]
  },
  "MiniMax-M2.5": {
    modelId: "MiniMax-M2.5",
    displayName: "MiniMax M2.5",
    strategy: "failover",
    providers: [{ providerId: "minimax", role: "primary" }]
  },
  // ── DeepSeek ──────────────────────────────────────────────────────────────
  // The official DeepSeek API is Lite's primary provider; OpenRouter is the
  // standby when the official API is unavailable or unhealthy. Both serve the
  // latest DeepSeek Flash through Anthropic-compatible APIs. V4 Pro is
  // historical-only.
  "deepseek-flash": {
    modelId: "deepseek-flash",
    displayName: "DeepSeek 4.1 Flash",
    strategy: "failover",
    providers: [
      { providerId: "deepseek", role: "primary" },
      { providerId: "openrouter", role: "standby" }
    ]
  },
  // ── Google Gemini ──────────────────────────────────────────────────────────
  "gemini-4-argon": {
    modelId: "gemini-4-argon",
    displayName: "Gemini 4 Argon",
    strategy: "failover",
    providers: [{ providerId: "gemini", role: "primary" }]
  }
};

// ../../packages/billing-contracts/src/product-models.ts
var WANAKA_ULTRA_PRODUCT_MODEL_ID = "wanaka-ultra";
var WANAKA_MAX_PRODUCT_MODEL_ID = "wanaka-max";
var WANAKA_PRO_PRODUCT_MODEL_ID = "wanaka-pro";
var WANAKA_LITE_PRODUCT_MODEL_ID = "wanaka-lite";
var OPUS_BY_ENV = {
  // NeoRouter, the only Claude provider allowed locally, does not serve Opus 5.5.
  local: "claude-opus-5",
  dev: "claude-opus-5-5",
  staging: "claude-opus-5-5",
  prod: "claude-opus-5-5"
};
var ULTRA_BY_ENV = {
  // NeoRouter does not serve Fable 5.1, so local uses its supported Opus 5
  // route. Cloud environments keep the intended Ultra model.
  local: "claude-opus-5",
  dev: "claude-fable-5-1",
  staging: "claude-fable-5-1",
  prod: "claude-fable-5-1"
};
var SONNET_BY_ENV = {
  local: "claude-sonnet-5",
  dev: "claude-sonnet-5-5",
  staging: "claude-sonnet-5-5",
  prod: "claude-sonnet-5-5"
};
var DEV_ONLY_DESCRIPTION = "dev only";
var PRODUCT_MODELS = [
  {
    id: WANAKA_ULTRA_PRODUCT_MODEL_ID,
    label: "Wanaka 1.0 Ultra",
    description: "Powerful, for complex game production",
    modelByEnv: ULTRA_BY_ENV,
    effort: "medium"
  },
  {
    id: WANAKA_MAX_PRODUCT_MODEL_ID,
    label: "Wanaka 1.0 Max",
    description: "Advanced, for demanding tasks",
    modelByEnv: OPUS_BY_ENV,
    effort: "medium"
  },
  {
    id: WANAKA_PRO_PRODUCT_MODEL_ID,
    label: "Wanaka 1.0 Pro",
    description: "Full-featured, for most tasks",
    modelByEnv: SONNET_BY_ENV,
    effort: "medium"
  },
  {
    id: WANAKA_LITE_PRODUCT_MODEL_ID,
    label: "Wanaka 1.0 Lite",
    description: "Fast, for normal changes",
    modelByEnv: {
      local: "deepseek-flash",
      dev: "deepseek-flash",
      staging: "deepseek-flash",
      prod: "deepseek-flash"
    },
    effort: "high"
  },
  {
    id: "kimi-k3",
    label: "Kimi K3",
    description: DEV_ONLY_DESCRIPTION,
    modelByEnv: { local: "kimi-k3", dev: "kimi-k3" }
  },
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    description: DEV_ONLY_DESCRIPTION,
    // Not offered locally: NeoRouter, the only Claude provider allowed there,
    // has no Sonnet 5.5 catalog row.
    modelByEnv: { dev: "claude-sonnet-5-5" }
  },
  {
    id: "gemini-4-argon",
    label: "Gemini 4 Argon",
    description: DEV_ONLY_DESCRIPTION,
    modelByEnv: { local: "gemini-4-argon", dev: "gemini-4-argon" },
    effort: "medium"
  }
];
var PRODUCT_MODEL_BY_ID = new Map(PRODUCT_MODELS.map((p) => [p.id, p]));

// ../../packages/billing-contracts/src/entitlement.ts
var FEATURE_KEYS = [
  "chat-with-model",
  "credits-per-period",
  "daily-base-credits",
  "monthly-base-cap-credits",
  "export-character",
  "game-export",
  "generate-image",
  "generate-3d-model",
  "generate-animation",
  "rig-character",
  "retarget-character",
  "generate-audio",
  "generate-articulated-asset",
  "watermark"
];
var KNOWN2 = new Set(FEATURE_KEYS);

// ../../packages/billing-contracts/src/validate-registries.ts
var SUBPROCESS_DEFAULT_MODEL_ENV_KEYS = /* @__PURE__ */ new Set([
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_FABLE_MODEL",
  "ANTHROPIC_SMALL_FAST_MODEL"
]);
function validateRegistries(registry, catalog, routing) {
  const errors = [];
  const referencedKeys = /* @__PURE__ */ new Set();
  const referencedProviders = /* @__PURE__ */ new Set();
  for (const [modelId, route] of Object.entries(routing)) {
    for (const p of route.providers) {
      referencedProviders.add(p.providerId);
      if (!Object.prototype.hasOwnProperty.call(registry, p.providerId)) {
        errors.push(
          `routing["${modelId}"] references unknown providerId "${p.providerId}" \u2014 add it to PROVIDER_REGISTRY`
        );
      }
      const catalogKey = `${p.providerId}/${modelId}`;
      if (!Object.prototype.hasOwnProperty.call(catalog, catalogKey)) {
        errors.push(
          `routing["${modelId}"] references provider "${p.providerId}" but catalog row "${catalogKey}" is missing \u2014 add it to MODEL_CATALOG`
        );
      }
      referencedKeys.add(catalogKey);
    }
    if (route.strategy === "failover") {
      const hasPrimary = route.providers.some((p) => p.role === "primary");
      if (!hasPrimary) {
        errors.push(
          `routing["${modelId}"] strategy=failover has no provider with role="primary" \u2014 mark at least one provider as primary`
        );
      }
    }
    if (route.strategy === "weighted") {
      const missing = route.providers.filter((p) => p.weight === void 0);
      if (missing.length > 0) {
        const ids = missing.map((p) => `"${p.providerId}"`).join(", ");
        errors.push(
          `routing["${modelId}"] strategy=weighted has ${missing.length} provider(s) without a weight: ${ids} \u2014 add weight to each provider`
        );
      }
    }
  }
  for (const [key, entry] of Object.entries(catalog)) {
    if (entry.disabled === true || entry.agentRoutable === false) {
      continue;
    }
    if (!referencedKeys.has(key)) {
      errors.push(
        `catalog["${key}"] is not referenced by any routing entry \u2014 add a MODEL_ROUTING entry or set disabled:true`
      );
    }
  }
  for (const [key, entry] of Object.entries(catalog)) {
    if (entry.providerSku !== void 0 && entry.providerSku.trim() === "") {
      errors.push(
        `catalog["${key}"].providerSku is empty \u2014 omit the field instead of setting it to ""`
      );
    }
  }
  for (const [providerId, cfg] of Object.entries(registry)) {
    try {
      providerAuthScheme(cfg);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
    if (cfg.serverCredential.kind === "env" && cfg.serverCredential.fromEnv.trim() === "") {
      errors.push(
        `provider "${providerId}" serverCredential.fromEnv is empty \u2014 name the env var holding its real key`
      );
    }
    if (!referencedProviders.has(providerId)) continue;
    for (const [envKey, source] of Object.entries(cfg.subprocessEnv)) {
      if (!SUBPROCESS_DEFAULT_MODEL_ENV_KEYS.has(envKey) || typeof source !== "string") continue;
      const wireValue = source.trim();
      const matchingEntry = Object.entries(catalog).find(([key, entry]) => {
        const parsed = splitProviderModelKey(key);
        if (parsed.providerId !== providerId) return false;
        return (entry.providerSku ?? parsed.modelId) === wireValue || parsed.modelId === wireValue;
      });
      if (!matchingEntry) {
        errors.push(
          `provider "${providerId}" subprocessEnv.${envKey}="${wireValue}" does not match any catalog row for "${providerId}"`
        );
      } else if (matchingEntry[1].disabled === true || matchingEntry[1].agentRoutable === false) {
        errors.push(
          `provider "${providerId}" subprocessEnv.${envKey}="${wireValue}" references non-routable catalog row "${matchingEntry[0]}"`
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

// ../../packages/billing-contracts/src/effective-availability.ts
function parseAllowedProviders(env) {
  const rawAllowed = (env["AGENT_PROVIDERS_ALLOWED"] ?? "").trim();
  if (rawAllowed === "") {
    return /* @__PURE__ */ new Set();
  }
  const entries = rawAllowed.split(",").map((s) => s.trim()).filter((s) => s !== "");
  const knownSet = new Set(PROVIDER_IDS);
  for (const entry of entries) {
    if (!knownSet.has(entry)) {
      throw new Error(
        `AGENT_PROVIDERS_ALLOWED contains unknown provider "${entry}". Known providers: ${PROVIDER_IDS.join(", ")}`
      );
    }
  }
  return new Set(entries);
}

// ../../packages/billing-contracts/src/consumption-defaults.ts
var DEFAULT_RESERVE_TTL_MS = 60 * 60 * 1e3;

// ../../packages/billing-contracts/src/provider-deadline.ts
var SETTLE_HEADROOM_MS = 90 * 1e3;

// ../../packages/billing-contracts/src/plan-presentation.ts
var MAX_ADDITIONAL_LABELS = [
  "Exclusive feedback channel",
  "More game exposure opportunities",
  "Opportunities to preview new releases",
  "More personalized features"
];
var ADDITIONAL_LABELS_BY_LEVEL = {
  free: [],
  pro: [],
  max: MAX_ADDITIONAL_LABELS,
  ultra: [
    ...MAX_ADDITIONAL_LABELS,
    "Dedicated personal support",
    "Invitations to in-person Game Jams"
  ]
};

// src/boot/validate-or-exit.ts
function validateOrExit(deps) {
  const registry = deps.registry ?? PROVIDER_REGISTRY;
  const catalog = deps.catalog ?? MODEL_CATALOG;
  const routing = deps.routing ?? MODEL_ROUTING;
  const result = validateRegistries(registry, catalog, routing);
  if (!result.ok) {
    for (const err of result.errors) {
      deps.logger.error(err);
    }
    deps.exit(1);
  }
}

// src/boot/preflight.ts
function preflight(deps) {
  validateOrExit(deps);
  const env = deps.env ?? process.env;
  const allowed = parseAllowedProviders(env);
  if (allowed.size === 0) {
    deps.logger.error(
      "no routable provider: AGENT_PROVIDERS_ALLOWED is empty. Set it to the providers this environment should route to."
    );
    deps.exit(1);
  }
}

// src/entry-preflight.ts
function main() {
  preflight({
    logger: { error: (msg) => process.stderr.write(`[preflight] ${msg}
`) },
    exit: (code) => process.exit(code)
  });
  process.stdout.write(
    "[preflight] OK \u2014 registries consistent and at least one provider routable\n"
  );
}
try {
  main();
} catch (err) {
  process.stderr.write(
    `[preflight] ${err instanceof Error ? err.stack ?? err.message : String(err)}
`
  );
  process.exit(1);
}
//# sourceMappingURL=entry-preflight.js.map
