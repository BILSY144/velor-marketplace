// Global polyfills that MUST load before any other module.
// Imported first from index.ts -- import order is preserved by Metro.
//
// DOMException (2026-08-04): Hermes does not provide a global DOMException.
// livekit-client (pulled in via @livekit/react-native) declares
// "class AbortError extends DOMException" at MODULE SCOPE, so the release
// bundle crashed instantly at startup with:
//   [runtime not ready]: ReferenceError: Property 'DOMException' doesn't exist
// (seen in Appetize debug logs for build 1.1.0 (6)). Providing a minimal
// spec-shaped DOMException before anything else loads fixes the crash.
// Guarded so it becomes a no-op if Hermes/RN ever ship a native one.

if (typeof globalThis.DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    code: number;
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
      this.code = 0;
    }
  }
  // @ts-expect-error assigning polyfill onto the global object
  globalThis.DOMException = DOMExceptionPolyfill;
}

export {};
