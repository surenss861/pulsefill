import SwiftUI

private let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

struct OperatorStandbyPreferencesSection: View {
    let preferences: [OperatorStandbyPreferenceItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("STANDBY PREFERENCES (THIS BUSINESS)")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if preferences.isEmpty {
                Text("No standby preferences on file. This customer may have claimed via another path.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(PFColor.textSecondary.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            } else {
                ForEach(preferences) { pref in
                    preferenceRow(pref)
                }
            }
        }
    }

    private func preferenceRow(_ p: OperatorStandbyPreferenceItem) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("\(p.serviceName ?? "Any service") · \(p.businessName ?? "Business")")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Spacer(minLength: 0)
                Text(p.active ? "Active" : "Paused")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(p.active ? PFColor.success : PFColor.textSecondary)
            }

            let locLine = [p.locationName, p.providerName].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
            if !locLine.isEmpty {
                Text(locLine)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Text(windowLine(p))
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textPrimary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.1), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private func windowLine(_ p: OperatorStandbyPreferenceItem) -> String {
        let days: String = {
            guard !p.daysOfWeek.isEmpty else { return "Any day" }
            return p.daysOfWeek.sorted()
                .compactMap { d in
                    guard d >= 0, d < dayNames.count else { return nil }
                    return dayNames[d]
                }
                .joined(separator: ", ")
        }()

        var parts: [String] = [days]
        if let a = p.earliestTime, let b = p.latestTime {
            parts.append("\(a)–\(b)")
        } else if let a = p.earliestTime {
            parts.append(a)
        } else if let b = p.latestTime {
            parts.append(b)
        }
        if let h = p.maxNoticeHours {
            parts.append("up to \(h)h notice")
        }
        if p.depositOk {
            parts.append("deposit ok")
        }
        return parts.joined(separator: " · ")
    }
}
