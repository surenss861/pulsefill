import SwiftUI

struct OperatorMorningRecoveryDigestBlock: View {
    let digest: MorningRecoveryDigestResponse
    let onTapSection: (MorningRecoveryDigestSection) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            OperatorMorningDigestQuickScanCard(summary: digest.summary)
            OperatorMorningDigestWorkFirstCard(sections: digest.sections, onTapSection: onTapSection)
        }
    }
}

private struct OperatorMorningDigestQuickScanCard: View {
    let summary: MorningRecoveryDigestSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("QUICK SCAN")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: 10),
                    GridItem(.flexible(), spacing: 10),
                ],
                spacing: 10
            ) {
                digestMetric(label: "Retry now", value: summary.retryNowCount)
                digestMetric(label: "Quiet-hours ready", value: summary.quietHoursReadyCount)
                digestMetric(label: "Manual follow-up", value: summary.manualFollowUpCount)
                digestMetric(label: "Expand match pool", value: summary.expandMatchPoolCount)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func digestMetric(label: String, value: Int) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 11))
                .foregroundStyle(PFColor.textSecondary)
            Text("\(value)")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(PFColor.background.opacity(0.55))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct OperatorMorningDigestWorkFirstCard: View {
    let sections: [MorningRecoveryDigestSection]
    let onTapSection: (MorningRecoveryDigestSection) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("WHAT TO WORK FIRST")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("Priority groups from current slot state, delivery, and standby coverage.")
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            if sections.isEmpty {
                Text("Nothing grouped right now — you’re caught up on digest-sized work.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
                    .padding(.top, 4)
            } else {
                VStack(spacing: 10) {
                    ForEach(sections) { section in
                        Button {
                            onTapSection(section)
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(section.title)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(PFColor.textPrimary)
                                        .multilineTextAlignment(.leading)
                                    Text(section.detail)
                                        .font(.system(size: 12))
                                        .foregroundStyle(PFColor.textSecondary)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer(minLength: 8)
                                VStack(alignment: .trailing, spacing: 6) {
                                    Text("\(section.count)")
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundStyle(PFColor.textPrimary)
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundStyle(PFColor.textSecondary)
                                }
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(PFColor.background.opacity(0.55))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
