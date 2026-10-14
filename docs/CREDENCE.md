# Credence Cloud SDK adapter

The source includes a server-side adapter but no license, Profile ID or registered account. The local demo works without them. Live wallet verification has not been validated end to end and remains unavailable until configured.

Official references:

- https://credenceid.com/mobile-id/developer-documentation/sdk-reference/
- https://credenceid.com/mobile-id/developer-documentation/integration-guide/

## Configuration

The empty `.dev.vars.example` documents `CREDENCE_LICENSE_KEY`, `CREDENCE_PROFILE_ID` and `CREDENCE_REGISTERED_ORIGIN`. If testing with your own supported registration, copy it to `.dev.vars` and supply your own values. That file is ignored by Git. Restart the local server after changes.

The configured origin must match the actual request origin and the provider's registration. Do not reuse someone else's license or forge an origin. Localhost support also depends on the provider, browser and wallet. If your registration requires a deployed HTTPS origin, this local-only edition cannot complete that flow; a separate secure deployment and authentication design would be needed.

## Implemented flow

- Server exchanges license/profile at `/v1/setup` with the configured matching origin.
- Apple: `/v1/getDocRequest` → browser `org-iso-mdoc` → `/v1/verifyDocRequest`.
- Google: `/dcapi/openid4vp/v1/initiate` → browser `openid4vp` → `/dcapi/openid4vp/v1/validate`.
- Sessions are bound to the local workspace and selected persona, expire after five minutes, and are single use.
- Provider cancellation is checked before the result. Only `res === true` records a credential check; raw claims are not retained in app state or sent to the client.

Wallet consent must come from the wallet owner. Failure, cancellation or an unsupported browser does not grant a badge. An age-check result is not proof of student enrollment, license entitlement or safe driving. Vehicle registration and insurance evidence are separately reviewed manually.
