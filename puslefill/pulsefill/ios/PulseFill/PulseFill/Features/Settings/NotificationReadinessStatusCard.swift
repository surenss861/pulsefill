import SwiftUI

struct NotificationReadinessStatusCard: View {
    let readiness: NotificationReadinessSummary?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("NOTIFICATION READINESS")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("Push permission: \(pushPermissionText)")
                .font(.system(size: 17))
                .foregroundStyle(PFColor.textPrimary)

            Text("Device registered: \(deviceRegisteredText)")
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var pushPermissionText: String {
        switch readiness?.pushPermissionStatus {
        case "authorized": "On"
        case "denied": "Off"
        case "not_determined": "Not set"
        default: "Unknown"
        }
    }

    private var deviceRegisteredText: String {
        readiness?.hasPushDevice == true ? "Yes" : "No"
    }
}
