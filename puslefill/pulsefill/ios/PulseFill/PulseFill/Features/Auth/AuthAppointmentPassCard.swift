import Combine
import SwiftUI

/// Structured appointment pass with optional quiet rotation (read-only, no CTA).
struct AuthAppointmentPassCard: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var selectedIndex = 0
    @State private var statusEmphasis: CGFloat = 1.0

    private static let previews = AuthAppointmentPreview.rotationExamples

    private var current: AuthAppointmentPreview {
        Self.previews[selectedIndex]
    }

    private let rotateTimer = Timer.publish(every: 3.6, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: 11) {
            Group {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .center) {
                        HStack(spacing: 8) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(PFColor.passBadgeFill)

                                Image(systemName: "calendar.badge.clock")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(PFColor.passBadgeIcon)
                            }
                            .frame(width: 30, height: 30)

                            Text("Opening available")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(PFColor.passOpeningLabel)
                        }

                        Spacer()

                        Text(current.pillDay)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(PFColor.passTodayPillForeground)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(PFColor.passTodayPillBackground)
                            .clipShape(Capsule())
                            .frame(minWidth: 56, alignment: .center)
                    }

                    VStack(alignment: .leading, spacing: 5) {
                        Text(current.service)
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(PFColor.passTitle)
                            .lineLimit(1)
                            .minimumScaleFactor(0.86)

                        Text(current.clinic)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(PFColor.customerTextSecondary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.88)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(minHeight: 52, alignment: .top)

                    HStack(alignment: .bottom, spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(current.scheduleEyebrow)
                                .font(.system(size: 10, weight: .bold))
                                .tracking(1.1)
                                .foregroundStyle(PFColor.customerTextTertiary)

                            Text(current.time)
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(PFColor.passTimeBlock)
                        }
                        .frame(minWidth: 100, alignment: .leading)

                        Spacer()

                        VStack(alignment: .trailing, spacing: 6) {
                            Text(current.status)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(PFColor.passChipForeground)
                                .lineLimit(1)
                                .minimumScaleFactor(0.85)
                                .padding(.horizontal, 11)
                                .padding(.vertical, 6)
                                .background(PFColor.passChipBackground)
                                .clipShape(Capsule())
                                .scaleEffect(statusEmphasis)
                                .frame(minHeight: 28, alignment: .center)

                            HStack(spacing: 5) {
                                Circle()
                                    .fill(PFColor.passAlertDot)
                                    .frame(width: 6, height: 6)

                                Text("Alerts active")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(PFColor.customerTextSecondary)
                            }
                        }
                    }
                    .frame(minHeight: 48, alignment: .bottom)
                }
                .padding(18)
            }
            .id(selectedIndex)
            .transition(
                reduceMotion
                    ? .opacity
                    : .asymmetric(
                        insertion: .move(edge: .bottom).combined(with: .opacity),
                        removal: .move(edge: .top).combined(with: .opacity)
                    )
            )
            .frame(maxWidth: 326, alignment: .leading)
            .frame(maxWidth: .infinity)
            .background {
                RoundedRectangle(cornerRadius: PFRadius.passCard, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                PFColor.customerGlassElevated,
                                PFColor.customerGlassDeep,
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay {
                        RoundedRectangle(cornerRadius: PFRadius.passCard, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.07), Color.white.opacity(0.0)],
                                    startPoint: .top,
                                    endPoint: UnitPoint(x: 0.5, y: 0.36)
                                )
                            )
                            .allowsHitTesting(false)
                    }
                    .overlay {
                        RoundedRectangle(cornerRadius: PFRadius.passCard, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        PFColor.ember.opacity(0.30),
                                        Color.white.opacity(0.13),
                                        Color.white.opacity(0.11),
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    }
                    .overlay(alignment: .topLeading) {
                        Circle()
                            .fill(Color.white.opacity(0.07))
                            .frame(width: 190, height: 190)
                            .blur(radius: 38)
                            .offset(x: -76, y: -92)
                    }
                    .overlay(alignment: .bottomTrailing) {
                        Circle()
                            .fill(PFColor.ember.opacity(0.10))
                            .frame(width: 170, height: 170)
                            .blur(radius: 42)
                            .offset(x: 56, y: 70)
                    }
            }
            .shadow(color: Color.black.opacity(0.46), radius: 28, x: 0, y: 20)
            .shadow(color: PFColor.ember.opacity(0.14), radius: 34, x: 0, y: 18)

            progressDots
        }
        .allowsHitTesting(false)
        .onReceive(rotateTimer) { _ in
            guard !reduceMotion else { return }
            let next = (selectedIndex + 1) % Self.previews.count
            withAnimation(.easeInOut(duration: 0.45)) {
                selectedIndex = next
            }
            pulseStatusChip()
        }
        .onAppear {
            selectedIndex = 0
        }
    }

    private var progressDots: some View {
        HStack(spacing: 6) {
            ForEach(0 ..< Self.previews.count, id: \.self) { index in
                let active = !reduceMotion && index == selectedIndex
                Circle()
                    .fill(
                        reduceMotion
                            ? Color.white.opacity(0.28)
                            : (active ? PFColor.ember : Color.white.opacity(0.24))
                    )
                    .frame(width: reduceMotion ? 5 : (active ? 7 : 5), height: reduceMotion ? 5 : (active ? 7 : 5))
                    .animation(.easeInOut(duration: 0.22), value: selectedIndex)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityHidden(true)
    }

    private func pulseStatusChip() {
        guard !reduceMotion else { return }
        withAnimation(.easeOut(duration: 0.18)) {
            statusEmphasis = 1.045
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            withAnimation(.easeInOut(duration: 0.22)) {
                statusEmphasis = 1.0
            }
        }
    }
}
