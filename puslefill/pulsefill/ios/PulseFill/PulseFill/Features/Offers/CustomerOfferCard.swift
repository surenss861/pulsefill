import SwiftUI

// MARK: - Inbox copy helpers

enum CustomerOfferDetailCopy {
    static func serviceLine(for offer: CustomerOfferDetail) -> String {
        if let s = offer.serviceName?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty {
            return s
        }
        if let b = offer.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !b.isEmpty {
            return b
        }
        return "Earlier opening"
    }

    static func clinicLine(for offer: CustomerOfferDetail) -> String {
        let service = serviceLine(for: offer)
        if let b = offer.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !b.isEmpty,
           service.caseInsensitiveCompare(b) != .orderedSame {
            return b
        }
        if let loc = offer.locationName?.trimmingCharacters(in: .whitespacesAndNewlines), !loc.isEmpty {
            return loc
        }
        if let p = offer.providerName?.trimmingCharacters(in: .whitespacesAndNewlines), !p.isEmpty {
            return p
        }
        return "Your appointment"
    }

    static func timeLine(for offer: CustomerOfferDetail) -> String {
        guard let startsAt = offer.startsAt else { return "See details" }
        let time = DateFormatterPF.time(startsAt)
        guard let start = CustomerStatusPresentersISO.parse(startsAt) else {
            return "\(DateFormatterPF.short(startsAt)) · \(time)"
        }
        if Calendar.current.isDateInToday(start) {
            return "Today · \(time)"
        }
        return "\(DateFormatterPF.short(startsAt)) · \(time)"
    }
}

enum CustomerOfferInboxCopy {
    static func serviceLine(for offer: OfferInboxItem) -> String {
        if let notes = offer.openSlot?.notes?.trimmingCharacters(in: .whitespacesAndNewlines), !notes.isEmpty {
            return notes
        }
        if let name = offer.openSlot?.providerNameSnapshot?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return name
        }
        return "Earlier opening"
    }

    static func clinicLine(for offer: OfferInboxItem) -> String {
        let service = serviceLine(for: offer)
        if let name = offer.openSlot?.providerNameSnapshot?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            if service.caseInsensitiveCompare(name) == .orderedSame {
                return "Your appointment"
            }
            return name
        }
        return "Your clinic"
    }

    static func timeLine(for offer: OfferInboxItem) -> String {
        guard let slot = offer.openSlot else { return "See details" }
        let time = DateFormatterPF.time(slot.startsAt)
        guard let start = CustomerStatusPresentersISO.parse(slot.startsAt) else {
            return "\(DateFormatterPF.short(slot.startsAt)) · \(time)"
        }
        if Calendar.current.isDateInToday(start) {
            return "Today · \(time)"
        }
        return "\(DateFormatterPF.short(slot.startsAt)) · \(time)"
    }
}

// MARK: - Claimable (dark glass pass)

struct CustomerOfferCard: View {
    let offer: OfferInboxItem
    let displayStatus: CustomerOfferDisplayStatus
    /// Shown on the pass chrome (e.g. "View opening", "View status").
    var chromeActionTitle: String = "View opening"
    /// Small label above the service line (patient-safe).
    var openingLabel: String = "Opening available"
    let onView: () -> Void

    var body: some View {
        Button {
            PFHaptics.lightImpact()
            onView()
        } label: {
            CustomerAppointmentPassCard {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(alignment: .center) {
                        HStack(spacing: 9) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(PFColor.passBadgeFill)
                                Image(systemName: "calendar.badge.clock")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(PFColor.passBadgeIcon)
                            }
                            .frame(width: 34, height: 34)

                            Text(openingLabel)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(PFColor.passOpeningLabel)
                        }

                        Spacer()

                        CustomerStatusPill(text: displayStatus.label, tone: displayStatus.pillToneOnPass)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(CustomerOfferInboxCopy.serviceLine(for: offer))
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(PFColor.passTitle)
                            .lineLimit(2)
                            .minimumScaleFactor(0.82)

                        Text(CustomerOfferInboxCopy.clinicLine(for: offer))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(PFColor.customerTextSecondary)

                        Text(CustomerOfferInboxCopy.timeLine(for: offer))
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(PFColor.passTimeBlock)
                            .padding(.top, 8)
                    }

                    CustomerPrimaryChromeLabel(title: chromeActionTitle)
                }
            }
        }
        .buttonStyle(CustomerCardPressButtonStyle())
    }
}

// MARK: - Past / quiet (dark)

struct CustomerOfferPastCard: View {
    let offer: OfferInboxItem
    let displayStatus: CustomerOfferDisplayStatus

    var body: some View {
        CustomerSectionCard(padding: 16, elevated: false) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(CustomerOfferInboxCopy.serviceLine(for: offer))
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(PFColor.textPrimary)
                            .lineLimit(2)

                        Text(CustomerOfferInboxCopy.timeLine(for: offer))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.customerMutedText)
                    }
                    Spacer()
                    CustomerStatusPill(text: displayStatus.label, tone: displayStatus.pillToneOnDark)
                }

                Text(CustomerOfferInboxCopy.clinicLine(for: offer))
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textMuted)
                    .lineLimit(1)
            }
        }
        .opacity(0.92)
    }
}
