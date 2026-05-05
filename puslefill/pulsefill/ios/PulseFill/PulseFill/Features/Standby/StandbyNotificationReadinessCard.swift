import SwiftUI
import UIKit

/// How PulseFill can reach the customer about openings (customer-safe; no APNs / token jargon).
struct StandbyNotificationReadinessCard: View {
    let readiness: StandbyNotificationReadiness

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                PFTypography.Customer.label("How we reach you")

                Text(CustomerNotificationPermissionCopy.phoneAlertsExplainer(readiness.pushPermissionStatus))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                Text(
                    CustomerNotificationPermissionCopy.thisAppReceivesAlertsLine(
                        hasRegistered: readiness.hasPushDevice,
                        permissionRaw: readiness.pushPermissionStatus
                    )
                )
                .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.customerMutedText)
                    .lineSpacing(3)

                VStack(alignment: .leading, spacing: 10) {
                    readinessRow(
                        title: "Phone alerts",
                        value: CustomerNotificationPermissionCopy.phoneAlertsShortLabel(readiness.pushPermissionStatus),
                        positiveHint: readiness.pushPermissionStatus.lowercased() == "authorized"
                    )
                    readinessRow(
                        title: "Email on your account",
                        value: readiness.hasEmail ? "Yes" : "Not on file",
                        positiveHint: readiness.hasEmail
                    )
                    readinessRow(
                        title: "Text messages (SMS)",
                        value: readiness.hasSms ? "Yes" : "Not on file",
                        positiveHint: readiness.hasSms
                    )
                    readinessRow(
                        title: "We can reach you about openings",
                        value: readiness.hasAnyReachableChannel ? "Yes" : "Limited",
                        positiveHint: readiness.hasAnyReachableChannel
                    )
                }
                .padding(.top, 4)

                if readiness.pushPermissionStatus.lowercased() == "denied" {
                    PFCustomerSecondaryButton(title: "Open Settings app") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                }
            }
        }
    }

    private func readinessRow(title: String, value: String, positiveHint: Bool) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
            Spacer(minLength: 12)
            Text(value)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(positiveHint ? PFColor.textPrimary : PFColor.warning)
                .multilineTextAlignment(.trailing)
        }
    }
}
