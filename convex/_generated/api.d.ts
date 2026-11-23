/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as crypto from "../crypto.js";
import type * as gymPrompts from "../gymPrompts.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as mistakes from "../mistakes.js";
import type * as perks from "../perks.js";
import type * as progress from "../progress.js";
import type * as tts from "../tts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  account: typeof account;
  admin: typeof admin;
  ai: typeof ai;
  analytics: typeof analytics;
  auth: typeof auth;
  crypto: typeof crypto;
  gymPrompts: typeof gymPrompts;
  http: typeof http;
  migrations: typeof migrations;
  mistakes: typeof mistakes;
  perks: typeof perks;
  progress: typeof progress;
  tts: typeof tts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
