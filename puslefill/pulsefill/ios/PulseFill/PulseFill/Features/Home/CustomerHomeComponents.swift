import SwiftUI

// MARK: - Header

struct CustomerHomeHeader: View {
    let greeting: String

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center, spacing: 10) {
                PFTypography.Customer.screenSubtitle(greeting)

                Spacer(minLength: 12)

                HStack(spacing: 7) {
                    Circle()
                        .fill(PFColor.success)
                        .frame(width: 7, height: 7)
                        .shadow(color: PFColor.success.opacity(0.45), radius: 8)

                    Text("Watching")
                        .font(.system(size: 12, weight: .bold, design: .default))
                        .foregroundStyle(PFColor.customerTextSecondary)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Color.white.opacity(0.055))
                .clipShape(Capsule())
                .overlay {
                    Capsule()
                        .stroke(PFColor.customerHairline, lineWidth: 1)
                }
            }

            PFTypography.Customer.screenTitle("Your appointment updates,\nall in one place.")
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Spotlight opening (aligned with Openings inbox / presenters)

struct CustomerOfferSpotlightCard: View {
    let offer: OfferInboxItem
    let displayStatus: CustomerOfferDisplayStatus
    let onPrimary: () -> Void

    private var useClaimablePass: Bool { displayStatus.isClaimable }
    private var primaryTitle: String { homeSpotlightActionTitle(for: displayStatus) }
    private var primaryEnabled: Bool { homeSpotlightCanOpenOfferDetails(for: displayStatus) }

    private var service: String { CustomerOfferInboxCopy.serviceLine(for: offer) }
    private var clinic: String { CustomerOfferInboxCopy.clinicLine(for: offer) }
    private var timeLabel: String { CustomerOfferInboxCopy.timeLine(for: offer) }

    var body: some View {
        Group {
            if useClaimablePass {
                claimablePassBody
            } else {
                secondarySpotlightBody
            }
        }
    }

    private var claimablePassBody: some View {
        CustomerAppointmentPassCard {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    HStack(spacing: 9) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(PFColor.passBadgeFill)

                            Image(systemName: "calendar.badge.clock")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(PFColor.passBadgeIcon)
                        }
                        .frame(width: 34, height: 34)

                        Text("Opening available")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(PFColor.passOpeningLabel)
                    }

                    Spacer()

                    CustomerStatusPill(text: displayStatus.label, tone: displayStatus.pillToneOnPass)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(service)
                        .font(.system(size: 29, weight: .bold))
                        .foregroundStyle(PFColor.passTitle)
                        .lineLimit(2)
                        .minimumScaleFactor(0.84)

                    Text(timeLabel)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(PFColor.passTimeBlock)
                        .padding(.top, 6)

                    Text(clinic)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(PFColor.customerTextSecondary)
                        .padding(.top, 2)
                }

                CustomerPrimaryButton(
                    title: primaryTitle,
                    isEnabled: primaryEnabled,
                    hapticImpact: .light,
                    onDisabledTap: primaryEnabled ? nil : {},
                    action: onPrimary
                )
            }
        }
    }

    private var secondarySpotlightBody: some View {
        CustomerSectionCard(padding: 18, elevated: true) {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    PFTypography.Customer.label("Opening update")

                    Spacer()

                    CustomerStatusPill(text: displayStatus.label, tone: displayStatus.pillToneOnDark)
                }

                Text(service)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)
                    .lineLimit(2)
                    .minimumScaleFactor(0.86)

                Text(timeLabel)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)

                Text(clinic)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.customerMutedText)
                    .lineLimit(2)

                CustomerPrimaryButton(
                    title: primaryTitle,
                    isEnabled: primaryEnabled,
                    hapticImpact: .light,
                    onDisabledTap: primaryEnabled ? nil : {},
                    action: onPrimary
                )
            }
        }
    }
}

// MARK: - Empty openings state

struct EmptyOfferStateCard: View {
    var onNotificationSettings: (() -> Void)?
    var onStandbyPreferences: (() -> Void)?

    var body: some View {
        CustomerEmptyStateCard(
            systemImage: "bell.badge",
            title: "No openings right now.",
            message: "You’re still on standby for updates. We’ll notify you when a better appointment time opens up.",
            footnote: "Keep notifications on so you don’t miss an opening.",
            primaryActionTitle: onNotificationSettings == nil ? nil : "Check notification settings",
            primaryAction: onNotificationSettings,
            secondaryActionTitle: onStandbyPreferences == nil ? nil : "Update standby preferences",
            secondaryAction: onStandbyPreferences
        )
    }
}

// MARK: - Standby

struct CustomerStandbyStatusCard: View {
    let isActive: Bool
    let onSetup: () -> Void

    var body: some View {
        CustomerSectionCard(padding: 16, elevated: isActive) {
            HStack(alignment: .center, spacing: 14) {
                ZStack {
                    Circle()
                        .fill(isActive ? Color.green.opacity(0.16) : PFColor.primary.opacity(0.12))

                    Image(systemName: isActive ? "dot.radiowaves.left.and.right" : "person.crop.circle.badge.plus")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(isActive ? Color.green : PFColor.primaryText)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 4) {
                    PFTypography.Customer.label("Standby")

                    Text(isActive ? "Active" : "Not set up")
                        .font(.system(size: 19, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)

                    Text(isActive ? "We’ll keep watching for better times." : "Set your preferences so we know what openings to send.")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 8)

                if isActive {
                    CustomerStatusPill(text: "Active", tone: .success)
                } else {
                    Button {
                        PFHaptics.lightImpact()
                        onSetup()
                    } label: {
                        Text("Finish setup")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(PFColor.primaryText)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(Color.clear)
                            .overlay(
                                Capsule()
                                    .stroke(PFColor.primaryBorder, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - Recent activity

struct CustomerHomeActivityRowModel: Identifiable, Hashable {
    let id: String
    let title: String
    let detail: String?
    let relativeTime: String
}

struct CustomerRecentActivityCard: View {
    let rows: [CustomerHomeActivityRowModel]
    let onSeeAll: () -> Void

    var body: some View {
        CustomerSectionCard(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("Recent activity")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)

                    Spacer()

                    Button {
                        PFHaptics.lightImpact()
                        onSeeAll()
                    } label: {
                        Text("See all")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(PFColor.customerMutedText)
                    }
                    .buttonStyle(.plain)
                }

                if rows.isEmpty {
                    Text("New openings and booking updates show up here — check back when something changes.")
                        .font(.system(size: 14, weight: .medium))
                        .lineSpacing(3)
                        .foregroundStyle(PFColor.textSecondary)
                } else {
                    VStack(spacing: 12) {
                        ForEach(rows.prefix(2)) { row in
                            CustomerActivityRow(
                                title: row.title,
                                relativeTime: row.relativeTime,
                                detail: row.detail,
                                dot: .muted
                            )
                        }
                    }
                }
            }
        }
    }
}
