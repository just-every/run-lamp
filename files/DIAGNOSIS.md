# Read-only diagnosis before edits

Lamp package.json identifies this checkout's seed version as 1.11.14. Settings has no software version display, and its GET /api/app/page-settings returns settings only. That is Lamp-owned.

src/base/deployment-health.ts is an unmodified retained Base copy from foundation/runtime/deployment-health.ts at 73923a8d0a5e5a2cd7f0cb204ec97b227d73b4bf (sha256 49f4dac80429ea7d9477b40799a6242f9af4870f3229df70d0ac1f635476b8b7). It reads RER_DEPLOY_SOURCE, RER_DEPLOY_FINGERPRINT and RER_VERSION.id directly and reports absent inputs as null. Lamp's health route calls it unchanged. The pinned rer deploy kit renders those two plain-text bindings plus version_metadata binding RER_VERSION (modules/deploy-kit/render.mjs). Lamp's direct deployment recipe likewise provides the first two and declares RER_VERSION in generated wrangler.toml.

The managed artifact path is different: scripts/delivery/rer-entry.template.mjs uses RER_RELEASE_DIGEST and RER_VERSION_METADATA.id at /__rer/release. scripts/delivery/base/spec.mjs reserves those for delivery authority. They are not the legacy /health bindings and the seed cannot infer a Git source SHA or built fingerprint from them. Null legacy fields do not establish that the running platform supplied and Lamp lost them. Installed runtime inspection must decide that.

/api/version has no registered door and is outside the existing host-dispatch allowlist. A new public route would broaden the lease and is unnecessary for the requested existing Settings surface. The repair exposes the actual built package version through the already authenticated Settings API, preserving /api/version's current 404 and health behavior.

Owner: sd owns Lamp's missing display; pr owns installed managed delivery binding inspection. Exact pr followup: inspect the named installation's non-secret binding PRESENCE and provenance of RER_DEPLOY_SOURCE, RER_DEPLOY_FINGERPRINT, RER_VERSION versus managed RER_RELEASE_DIGEST and RER_VERSION_METADATA; compare /health and /__rer/release to that deployment's retained source/artifact receipt. Establish the managed metadata contract or supply the legacy inputs if that contract requires them. Do not echo private bindings or use package version as a fake source SHA/fingerprint/version UUID. No platform changes or deployment authorized here.

Installed-stage proof: NOT RUN; the brief supplies no installation origin or authenticated owner session. The prior bz observation is supplied context, not a new live measurement.
