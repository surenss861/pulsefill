import SwiftUI

/// Structured appointment pass: hierarchy (title → time block → status), not a flat dashboard row. Read-only.
struct AuthAppointmentPassCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
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

                    Text("Opening available")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.passOpeningLabel)
                }

                Spacer()

                Text("Today")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(PFColor.passTodayPillForeground)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 8)
                    .background(PFColor.passTodayPillBackground)
                    .clipShape(Capsule())
            }

            VStack(alignment: .leading, spacing: 7) {
                Text("Dental cleaning")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(PFColor.passTitle)
                    .lineLimit(1)
                    .minimumScaleFactor(0.86)

                Text("Yorkville Clinic")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.black.opacity(0.50))
            }

            HStack(alignment: .bottom, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TODAY")
                        .font(.system(size: 10, weight: .bold))
                        .tracking(1.1)
                        .foregroundStyle(Color.black.opacity(0.38))

                    Text("2:30 PM")
                        .font(.system(size: 25, weight: .bold))
                        .foregroundStyle(PFColor.passTimeBlock)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 8) {
                    Text("Ready to claim")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PFColor.passChipForeground)
                        .padding(.horizontal, 13)
                        .padding(.vertical, 8)
                        .background(PFColor.passChipBackground)
                        .clipShape(Capsule())

                    HStack(spacing: 6) {
                        Circle()
                            .fill(PFColor.passAlertDot)
                            .frame(width: 7, height: 7)

                        Text("Alerts active")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.black.opacity(0.42))
                    }
                }
            }
        }
        .padding(22)
        .frame(maxWidth: 350, alignment: .leading)
        .frame(maxWidth: .infinity)
        .background {
            RoundedRectangle(cornerRadius: PFRadius.passCard, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [PFColor.passCreamTop, PFColor.passCreamBottom],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    RoundedRectangle(cornerRadius: PFRadius.passCard, style: .continuous)
                        .stroke(Color.white.opacity(0.55), lineWidth: 1)
                }
        }
        .shadow(color: Color.black.opacity(0.34), radius: 26, x: 0, y: 20)
        .shadow(color: PFColor.primary.opacity(0.16), radius: 36, x: 0, y: 18)
        .allowsHitTesting(false)
    }
}
