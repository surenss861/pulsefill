import SwiftUI

struct TimeWindowCard: View {
    @Binding var earliest: Date
    @Binding var latest: Date

    private var invalidWindow: Bool {
        let cal = Calendar.current
        let e = cal.dateComponents([.hour, .minute], from: earliest)
        let l = cal.dateComponents([.hour, .minute], from: latest)
        let em = (e.hour ?? 0) * 60 + (e.minute ?? 0)
        let lm = (l.hour ?? 0) * 60 + (l.minute ?? 0)
        return lm <= em
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Earliest time")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)

                DatePicker("", selection: $earliest, displayedComponents: .hourAndMinute)
                    .labelsHidden()
            }

            Divider().background(PFColor.divider)

            VStack(alignment: .leading, spacing: 6) {
                Text("Latest time")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)

                DatePicker("", selection: $latest, displayedComponents: .hourAndMinute)
                    .labelsHidden()
            }

            if invalidWindow {
                Text("Latest time should be after earliest time.")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.error)
            }
        }
        .padding(PFSpacing.md)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .strokeBorder(invalidWindow ? PFColor.error.opacity(0.45) : Color.white.opacity(0.06), lineWidth: 1)
        )
    }
}
