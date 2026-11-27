import { createStatusPageRepository } from "../features/page-settings/status-page.repository";
import { createSnapshotRepository } from "../features/public-snapshot/repository";
import { createScopedSnapshots } from "../features/public-snapshot/scoped-service";
import { createPublicSnapshotService, runningReleaseIdentity, type PublicSnapshotService } from "../features/public-snapshot/service";
import { smsSubscriberConfigured } from "../features/sms/service";
import { authOrigin } from "../platform/auth/config";
import { createSnapshotBlobStore } from "../platform/blobs/r2";
import { createRetainedSnapshotCache } from "../platform/blobs/retained";
import type { BlobStore } from "../platform/blobs/store";
import { createServerExtensionMount } from "./extensions/server";
import { outboundUnavailable } from "./hosting";
import { createAppMailTransport, prepareAppMailBindings, type MailExecution } from "./mail";
import { publicPageOrigin } from "./public-origin";
import type { AppBindings } from "./types";

export function createSnapshotServices(
  bindings: AppBindings,
  blobs: BlobStore,
  extensions: ReturnType<typeof createServerExtensionMount>,
  execution?: MailExecution,
) {
  const mailAdapter = extensions.adapters["mail.sender.v1"];
  const { sender: mail, local } = createAppMailTransport(bindings, mailAdapter, execution);
  // Settings and the rendered subscription choices both use the composed sender's availability.
  const localMailSuppressed = local && bindings.RER_DEMO !== "1";
  const mailConfiguration = {
    local: localMailSuppressed,
    primaryProvider: mail.configured && !localMailSuppressed
      ? mailAdapter ? "custom" : bindings.MAIL_PROVIDER || "resend"
      : null,
  };
  const smsConfiguration = {
    accountSid: bindings.TWILIO_ACCOUNT_SID, authToken: bindings.TWILIO_AUTH_TOKEN,
    fromNumber: bindings.TWILIO_FROM_NUMBER, messagingService: bindings.TWILIO_MESSAGING_SERVICE,
    tokenSecret: bindings.SUBSCRIBER_TOKEN_SECRET, effectsPaused: bindings.EFFECTS_PAUSED === "1",
    unavailable: outboundUnavailable(bindings, "SMS messages"),
  };
  const webhookSecrets = bindings.WEBHOOK_SIGNING_SECRET?.split(",").map(secret => secret.trim()).filter(Boolean);
  const snapshotOrigin = bindings.LAMP_LOCAL_ORIGIN ? publicPageOrigin(bindings.LAMP_LOCAL_ORIGIN, bindings.LAMP_PAGE_HOST) : undefined;
  const repository = createSnapshotRepository(bindings.DB, snapshotOrigin, {
    email: mailConfiguration.primaryProvider !== null && Boolean(bindings.SUBSCRIBER_TOKEN_SECRET),
    mailFromAddress: bindings.MAIL_FROM_ADDRESS,
    sms: smsSubscriberConfigured(smsConfiguration),
    webhook: Boolean(webhookSecrets?.length) && bindings.EFFECTS_PAUSED !== "1",
    slack: Boolean(
      bindings.SLACK_CLIENT_ID && bindings.SLACK_CLIENT_SECRET && bindings.SLACK_SIGNING_SECRET
      && bindings.WEBHOOK_SIGNING_SECRET && bindings.SUBSCRIBER_TOKEN_SECRET,
    ) && !outboundUnavailable(bindings, "Slack subscriptions"),
    teams: Boolean(bindings.WEBHOOK_SIGNING_SECRET && bindings.SUBSCRIBER_TOKEN_SECRET) && !outboundUnavailable(bindings, "Teams subscriptions"),
  });
  const primarySnapshot = createPublicSnapshotService(
    repository, blobs, extensions.publicSnapshotPolicies, extensions.publicSnapshotEvents, extensions.slots,
    createRetainedSnapshotCache(bindings), runningReleaseIdentity(bindings), false, authOrigin(bindings),
  );
  const statusPages = createStatusPageRepository(bindings.DB);
  const scopedSnapshots = createScopedSnapshots(bindings, blobs, statusPages, extensions.publicSnapshotPolicies);
  const publicSnapshots: PublicSnapshotService = {
    ...primarySnapshot,
    async rebuild(force?: boolean) {
      await primarySnapshot.rebuild(force);
      await scopedSnapshots.forEach(snapshot => snapshot.rebuild());
    },
    async retryPendingBuild() {
      const primaryChanged = await primarySnapshot.retryPendingBuild();
      return await scopedSnapshots.forEach(snapshot => snapshot.retryPendingBuild()) || primaryChanged;
    },
  };
  return { publicSnapshots, statusPages, scopedSnapshots, mail, local, mailConfiguration, smsConfiguration, webhookSecrets };
}

export async function createBackgroundSnapshots(bindings: AppBindings): Promise<PublicSnapshotService> {
  const preparedBindings = await prepareAppMailBindings(bindings, "background");
  const blobs = createSnapshotBlobStore(preparedBindings);
  const extensions = createServerExtensionMount();
  return createSnapshotServices(preparedBindings, blobs, extensions, "background").publicSnapshots;
}
