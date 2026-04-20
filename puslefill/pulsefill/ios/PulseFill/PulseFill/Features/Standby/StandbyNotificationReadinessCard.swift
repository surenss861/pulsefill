import SwiftUI
import UIKit

struct StandbyNotificationReadinessCard: View {
    let readiness: StandbyNotificationReadiness

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("NOTIFICATION READINESS")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            row(label: "Push permission", value: permissionLabel, good: readiness.pushPermissionStatus != "denied")
            row(label: "Device registered", value: readiness.hasPushDevice ? "Yes" : "No", good: readiness.hasPushDevice)
            row(label: "Email on file", value: readiness.hasEmail ? "Yes" : "No", good: readiness.hasEmail)
            row(label: "SMS reachable", value: readiness.hasSms ? "Yes" : "No", good: readiness.hasSms)
            row(label: "Reachable overall", value: readiness.hasAnyReachableChannel ? "Yes" : "No", good: readiness.hasAnyReachableChannel)

            if readiness.pushPermissionStatus == "denied" {
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(PFColor.primary)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private var permissionLabel: String {
        switch readiness.pushPermissionStatus {
        case "authorized": return "Authorized"
        case "denied": return "Denied"
        case "not_determined": return "Not determined"
        default: return "Unknown"
        }
    }

    private func row(label: String, value: String, good: Bool) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(PFColor.textSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(good ? PFColor.textPrimary : PFColor.warning)
        }
    }
}
