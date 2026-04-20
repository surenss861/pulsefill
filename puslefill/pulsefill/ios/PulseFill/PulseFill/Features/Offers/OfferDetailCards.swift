import SwiftUI

struct OfferHeroCard: View {
    let offer: CustomerOfferDetail

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(offer.businessName ?? "Clinic")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let serviceName = offer.serviceName {
                Text(serviceName)
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let startsAt = offer.startsAt {
                Text(DateFormatterPF.dateTimeRange(start: startsAt, end: offer.endsAt))
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textPrimary)
            }

            if let providerName = offer.providerName {
                Text("Provider: \(providerName)")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let locationName = offer.locationName {
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

struct OfferExpiryCard: View {
    let expiresAtIso: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("TIME TO CLAIM")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if let expiresAtIso, let exp = OfferExpiryCard.parse(expiresAtIso) {
                if exp.timeIntervalSinceNow <= 0 {
                    Text("This offer has expired.")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.warning)
                } else {
                    Text(relativeExpiryText(exp))
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                }
            } else {
                Text("Claim as soon as you can.")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private static func parse(_ string: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: string) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: string)
    }

    private func relativeExpiryText(_ expiresAt: Date) -> String {
        let minutes = max(1, Int(expiresAt.timeIntervalSinceNow / 60))
        if minutes < 60 {
            return "Expires in about \(minutes) min"
        }
        let hours = Int(round(Double(minutes) / 60.0))
        return "Expires in about \(hours) hr"
    }
}

struct OfferMatchReasonCard: View {
    let offer: CustomerOfferDetail

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("WHY YOU’RE SEEING THIS")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            if let matched = offer.matchedPreference {
                Text("This opening matched one of your standby requests.")
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textPrimary)

                if let serviceName = matched.serviceName {
                    Text("Service: \(serviceName)")
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                }

                if let providerName = matched.providerName {
                    Text("Provider: \(providerName)")
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                }

                if let locationName = matched.locationName {
                    Text("Location: \(locationName)")
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                }
            } else {
                Text("This opening matched your current standby setup.")
                    .font(.system(size: 17))
                    .foregroundStyle(PFColor.textPrimary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}

struct OfferClaimConfidenceCard: View {
    let guidance: OfferClaimGuidance?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("WHAT HAPPENS NEXT")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text(guidance?.title ?? "Claim this opening")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            Text(
                guidance?.detail
                    ?? "Claiming sends your intent right away. The clinic may still need to confirm the booking."
            )
            .font(.system(size: 13))
            .foregroundStyle(PFColor.textSecondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
