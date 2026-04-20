import SwiftUI

struct OperatorSlotsSummaryBar: View {
    let counts: [String: Int]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                chip("Open", counts["open"] ?? 0, PFColor.primary)
                chip("Offered", counts["offered"] ?? 0, PFColor.primary)
                chip("Claimed", counts["claimed"] ?? 0, PFColor.warning)
                chip("Booked", counts["booked"] ?? 0, PFColor.success)
                chip("Expired", counts["expired"] ?? 0, PFColor.textSecondary)
            }
            .padding(.horizontal, 4)
        }
    }

    private func chip(_ label: String, _ count: Int, _ tone: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(count)")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(tone.opacity(0.10))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(tone.opacity(0.22), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
