import SwiftUI

struct OperatorCustomerSummaryCard: View {
    let customer: OperatorCustomerContextCustomer
    let delivery: OperatorDeliveryContext

    private var title: String {
        if let name = customer.displayName?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        if let e = customer.emailMasked, !e.isEmpty { return e }
        if let p = customer.phoneMasked, !p.isEmpty { return p }
        return "Customer"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("CUSTOMER")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text(title)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let email = customer.emailMasked, !email.isEmpty {
                labeledLine(label: "Email", value: email)
            }
            if let phone = customer.phoneMasked, !phone.isEmpty {
                labeledLine(label: "Phone", value: phone)
            }

            Text(
                "Channels · Push \(customer.pushEnabled ? "on" : "off") · Email \(customer.emailEnabled ? "on" : "off") · SMS \(customer.smsEnabled ? "on" : "off")"
            )
            .font(.system(size: 13))
            .foregroundStyle(PFColor.textSecondary)

            Divider().overlay(PFColor.textSecondary.opacity(0.2))

            Text("DELIVERY READINESS")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("Push: \(delivery.hasPushReady ? "Ready" : "Not ready") · Email: \(delivery.hasEmail ? "Available" : "Unavailable") · SMS: \(delivery.hasSms ? "Available" : "Unavailable")")
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)

            Text("Reachable: \(delivery.hasAnyReachableChannel ? "Yes" : "No")")
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)

            Text("Push devices registered: \(delivery.pushDevicesCount)")
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
                .padding(.top, 4)

            if let failed = delivery.lastFailedDeliveryAt {
                Text("Last failed delivery: \(DateFormatterPF.medium(failed))")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.warning)
                if let reason = delivery.lastFailedDeliveryReason, !reason.isEmpty {
                    Text(reason)
                        .font(.system(size: 12))
                        .foregroundStyle(PFColor.textSecondary)
                }
            } else {
                Text("No failed deliveries logged for this business yet.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.12), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func labeledLine(label: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
            Text(value)
                .font(.system(size: 15))
                .foregroundStyle(PFColor.textPrimary)
        }
    }
}
