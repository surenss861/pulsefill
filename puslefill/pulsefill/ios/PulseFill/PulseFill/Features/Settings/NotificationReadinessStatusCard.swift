import SwiftUI

/// Summary of whether this phone can receive PulseFill alerts (no “device registered” / token wording).
struct NotificationReadinessStatusCard: View {
    let readiness: NotificationReadinessSummary?

    var body: some View {
        PFCustomerSectionCard(variant: .attention, padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                PFTypography.Customer.label("PulseFill on this phone")

                Text(CustomerNotificationPermissionCopy.phoneAlertsExplainer(permissionRaw))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                Text(
                    CustomerNotificationPermissionCopy.thisAppReceivesAlertsLine(
                        hasRegistered: readiness?.hasPushDevice == true,
                        permissionRaw: permissionRaw
                    )
                )
                .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.customerMutedText)
                    .lineSpacing(3)

                HStack {
                    Text("Phone alerts")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                    Spacer()
                    Text(CustomerNotificationPermissionCopy.phoneAlertsShortLabel(permissionRaw))
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                }
            }
        }
    }

    private var permissionRaw: String {
        readiness?.pushPermissionStatus ?? "not_determined"
    }
}
