import SwiftUI

struct ClaimOutcomeHeroCard: View {
    let outcome: ClaimOutcomeSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(stateLabel.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(stateColor)

            Text(outcome.title)
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let detail = outcome.detail, !detail.isEmpty {
                Text(detail)
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var stateLabel: String {
        outcome.state.replacingOccurrences(of: "_", with: " ")
    }

    private var stateColor: Color {
        switch outcome.state {
        case "confirmed":
            PFColor.success
        case "pending_confirmation":
            PFColor.primary
        case "expired", "lost", "unavailable":
            PFColor.warning
        default:
            PFColor.textSecondary
        }
    }
}

struct ClaimOutcomeBookingCard: View {
    let claim: ClaimOutcomeClaim

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("OPENING")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text(claim.businessName ?? "Clinic")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let serviceName = claim.serviceName {
                Text(serviceName)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let startsAt = claim.startsAt {
                Text(DateFormatterPF.dateTimeRange(start: startsAt, end: claim.endsAt))
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let providerName = claim.providerName {
                Text("Provider: \(providerName)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let locationName = claim.locationName {
                Text("Location: \(locationName)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}

struct ClaimOutcomeNextStepsCard: View {
    let steps: [ClaimOutcomeNextStep]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("WHAT HAPPENS NEXT")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if steps.isEmpty {
                Text("You’ll see updates here if anything changes.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(steps, id: \.code) { step in
                        HStack(alignment: .top, spacing: 8) {
                            Text("•")
                                .foregroundStyle(PFColor.textSecondary)
                            Text(step.title)
                                .font(.system(size: 13))
                                .foregroundStyle(PFColor.textSecondary)
                        }
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}

struct BookingConfirmedCard: View {
    let claim: ClaimOutcomeClaim
    let outcome: ClaimOutcomeSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("CONFIRMED")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.success)

            Text(outcome.title)
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let detail = outcome.detail, !detail.isEmpty {
                Text(detail)
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Divider()
                .overlay(PFColor.divider)

            Text(claim.businessName ?? "Clinic")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let serviceName = claim.serviceName {
                Text(serviceName)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let startsAt = claim.startsAt {
                Text(DateFormatterPF.dateTimeRange(start: startsAt, end: claim.endsAt))
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textPrimary)
            }

            if let providerName = claim.providerName {
                Text("Provider: \(providerName)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let locationName = claim.locationName {
                Text("Location: \(locationName)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
