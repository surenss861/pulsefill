import SwiftUI

// MARK: - Press feedback (customer cards / rows)

/// Subtle press scale + opacity for tappable customer surfaces.
struct CustomerCardPressButtonStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.94 : 1)
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.985)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

// MARK: - Appear motion (respects Reduce Motion)

private struct CustomerAppearAnimationModifier: ViewModifier {
    let staggerIndex: Int
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : (reduceMotion ? 1 : 0))
            .offset(y: shown ? 0 : (reduceMotion ? 0 : 8))
            .onAppear {
                if reduceMotion {
                    shown = true
                }
            }
            .task {
                guard !reduceMotion else { return }
                let step: UInt64 = 45_000_000
                try? await Task.sleep(nanoseconds: UInt64(staggerIndex) * step)
                withAnimation(.easeOut(duration: 0.32)) {
                    shown = true
                }
            }
    }
}

extension View {
    /// Fade in + 8pt rise; optional stagger for list rows. No motion when Reduce Motion is on.
    func customerAppearAnimation(staggerIndex: Int = 0) -> some View {
        modifier(CustomerAppearAnimationModifier(staggerIndex: staggerIndex))
    }
}

// MARK: - Status pill pulse

struct CustomerStatusPillPulseModifier: ViewModifier {
    let trigger: Int
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulsing = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(pulsing ? 1.06 : 1.0)
            .animation(reduceMotion ? nil : .spring(response: 0.34, dampingFraction: 0.58), value: pulsing)
            .onChange(of: trigger) { _, new in
                guard new > 0, !reduceMotion else { return }
                pulsing = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                    pulsing = false
                }
            }
    }
}

extension View {
    func customerStatusPillPulse(trigger: Int) -> some View {
        modifier(CustomerStatusPillPulseModifier(trigger: trigger))
    }
}

// MARK: - Screen chrome

/// Warm near-black gradient behind customer flows (Home, Offers, Activity, Profile).
struct CustomerScreenBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    PFColor.customerInkDeep,
                    PFColor.customerInk,
                    PFColor.background,
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            Circle()
                .fill(PFColor.customerTopGlow)
                .frame(width: 260, height: 260)
                .blur(radius: 54)
                .offset(x: -130, y: -300)

            Circle()
                .fill(PFColor.customerSuccessGlow)
                .frame(width: 240, height: 240)
                .blur(radius: 64)
                .offset(x: 150, y: -110)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Appointment pass shell (dark glass)

/// Elevated dark “appointment pass” — use for claimable Home / Offers / detail summaries.
struct CustomerAppointmentPassCard<Content: View>: View {
    @ViewBuilder private let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        content()
            .padding(20)
            .background {
                RoundedRectangle(cornerRadius: PFRadius.pass, style: .continuous)
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
                        RoundedRectangle(cornerRadius: PFRadius.pass, style: .continuous)
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
                        RoundedRectangle(cornerRadius: PFRadius.pass, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        PFColor.ember.opacity(0.28),
                                        Color.white.opacity(0.12),
                                        Color.white.opacity(0.10),
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
                            .frame(width: 180, height: 180)
                            .blur(radius: 38)
                            .offset(x: -70, y: -90)
                    }
            }
            .shadow(color: Color.black.opacity(0.42), radius: 24, x: 0, y: 18)
            .shadow(color: PFColor.ember.opacity(0.12), radius: 30, x: 0, y: 14)
    }
}

// MARK: - Primary CTA

struct CustomerPrimaryButton: View {
    let title: String
    var isEnabled: Bool = true
    /// Haptic fired on a successful tap (ignored when disabled with no `onDisabledTap`).
    var hapticImpact: PFHaptics.TapImpact = .light
    /// When the control is disabled, optional tap handler (e.g. warn + explain) instead of swallowing touches.
    var onDisabledTap: (() -> Void)? = nil
    let action: () -> Void

    var body: some View {
        Group {
            if isEnabled {
                Button {
                    PFHaptics.fire(hapticImpact)
                    action()
                } label: {
                    label
                }
                .buttonStyle(CustomerCardPressButtonStyle())
            } else if let onDisabledTap {
                Button {
                    PFHaptics.warning()
                    onDisabledTap()
                } label: {
                    label.opacity(0.5)
                }
                .buttonStyle(CustomerCardPressButtonStyle())
            } else {
                Button(action: {}) {
                    label.opacity(0.5)
                }
                .buttonStyle(.plain)
                .disabled(true)
            }
        }
    }

    private var label: some View {
        PFTypography.Customer.button(title)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 54)
            .foregroundStyle(.black)
            .background {
                ZStack {
                    PFColor.ember
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.2),
                            Color.clear,
                        ],
                        startPoint: .top,
                        endPoint: .center
                    )
                    .blendMode(.overlay)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
            .shadow(color: Color.black.opacity(0.12), radius: 6, y: 3)
            .shadow(color: PFColor.ember.opacity(0.28), radius: 14, y: 4)
    }
}

/// Visual twin of `CustomerPrimaryButton` label (use inside `NavigationLink` labels).
struct CustomerPrimaryChromeLabel: View {
    let title: String

    var body: some View {
        PFTypography.Customer.button(title)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 54)
            .foregroundStyle(.black)
            .background {
                ZStack {
                    PFColor.ember
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.2),
                            Color.clear,
                        ],
                        startPoint: .top,
                        endPoint: .center
                    )
                    .blendMode(.overlay)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
            .shadow(color: Color.black.opacity(0.12), radius: 6, y: 3)
            .shadow(color: PFColor.ember.opacity(0.28), radius: 14, y: 4)
    }
}

// MARK: - Status pill

enum CustomerStatusPillTone {
    /// Ember chip on dark glass pass (default claimable copy).
    case onCream
    /// Muted capsule on dark cards.
    case onDarkNeutral
    case onDarkEmber
    case success
    case warning
    case danger
}

struct CustomerStatusPill: View {
    let text: String
    var tone: CustomerStatusPillTone = .onCream

    var body: some View {
        Text(text)
            .font(.system(size: 13, weight: .bold, design: .default))
            .foregroundStyle(foreground)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(background)
            .clipShape(Capsule())
            .overlay {
                Capsule()
                    .strokeBorder(strokeColor, lineWidth: 1)
            }
    }

    private var foreground: Color {
        switch tone {
        case .onCream:
            PFColor.emberReadable
        case .onDarkNeutral:
            PFColor.customerTextSecondary
        case .onDarkEmber:
            PFColor.primaryText
        case .success:
            Color(red: 0.44, green: 0.94, blue: 0.62)
        case .warning:
            PFColor.warning
        case .danger:
            PFColor.error
        }
    }

    private var background: Color {
        switch tone {
        case .onCream:
            PFColor.emberSoft
        case .onDarkNeutral:
            Color.white.opacity(0.065)
        case .onDarkEmber:
            PFColor.primarySoft
        case .success:
            Color.green.opacity(0.12)
        case .warning:
            PFColor.warning.opacity(0.16)
        case .danger:
            PFColor.error.opacity(0.16)
        }
    }

    private var strokeColor: Color {
        switch tone {
        case .onCream:
            PFColor.ember.opacity(0.16)
        case .onDarkNeutral:
            Color.white.opacity(0.08)
        case .onDarkEmber:
            PFColor.primary.opacity(0.40)
        case .success:
            Color.green.opacity(0.16)
        case .warning:
            PFColor.warning.opacity(0.35)
        case .danger:
            PFColor.error.opacity(0.35)
        }
    }
}

// MARK: - Dark section card

struct CustomerSectionCard<Content: View>: View {
    var padding: CGFloat = 18
    var elevated: Bool = false
    @ViewBuilder private let content: () -> Content

    init(padding: CGFloat = 18, elevated: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.padding = padding
        self.elevated = elevated
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: PFRadius.customerCard, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: elevated
                                ? [PFColor.customerGlassElevated, PFColor.customerGlass]
                                : [PFColor.customerGlass, PFColor.customerGlassDeep.opacity(0.92)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(alignment: .topLeading) {
                        Circle()
                            .fill(elevated ? PFColor.emberGlow.opacity(0.62) : Color.white.opacity(0.035))
                            .frame(width: 140, height: 140)
                            .blur(radius: 32)
                            .offset(x: -62, y: -78)
                    }
                    .overlay {
                        RoundedRectangle(cornerRadius: PFRadius.customerCard, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        elevated ? PFColor.primaryBorder : PFColor.customerHairlineStrong,
                                        PFColor.customerHairline,
                                        Color.white.opacity(0.04),
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    }
            }
            .clipShape(RoundedRectangle(cornerRadius: PFRadius.customerCard, style: .continuous))
            .shadow(color: Color.black.opacity(elevated ? 0.34 : 0.22), radius: elevated ? 22 : 14, x: 0, y: elevated ? 16 : 8)
    }
}

// MARK: - Empty state

struct CustomerEmptyStateCard: View {
    let systemImage: String
    let title: String
    let message: String
    var footnote: String?
    var primaryActionTitle: String?
    var primaryAction: (() -> Void)?
    var secondaryActionTitle: String?
    var secondaryAction: (() -> Void)?

    init(
        systemImage: String,
        title: String,
        message: String,
        footnote: String? = nil,
        primaryActionTitle: String? = nil,
        primaryAction: (() -> Void)? = nil,
        secondaryActionTitle: String? = nil,
        secondaryAction: (() -> Void)? = nil
    ) {
        self.systemImage = systemImage
        self.title = title
        self.message = message
        self.footnote = footnote
        self.primaryActionTitle = primaryActionTitle
        self.primaryAction = primaryAction
        self.secondaryActionTitle = secondaryActionTitle
        self.secondaryAction = secondaryAction
    }

    var body: some View {
        CustomerSectionCard(padding: 20) {
            VStack(alignment: .leading, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(PFColor.primary.opacity(0.10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(PFColor.primary.opacity(0.22), lineWidth: 1)
                        )

                    Image(systemName: systemImage)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(PFColor.primaryText)
                }
                .frame(width: 48, height: 48)

                VStack(alignment: .leading, spacing: 8) {
                    Text(title)
                        .font(.system(size: 24, weight: .bold, design: .default))
                        .foregroundStyle(PFColor.textPrimary)

                    Text(message)
                        .font(.system(size: 15, weight: .semibold, design: .default))
                        .lineSpacing(3)
                        .foregroundStyle(PFColor.textSecondary)

                    if let footnote {
                        Text(footnote)
                            .font(.system(size: 13, weight: .medium, design: .default))
                            .foregroundStyle(PFColor.textMuted)
                            .padding(.top, 2)
                    }

                    if primaryActionTitle != nil || secondaryActionTitle != nil {
                        VStack(alignment: .leading, spacing: 10) {
                            if let t = primaryActionTitle, let a = primaryAction {
                                Button(action: {
                                    PFHaptics.lightImpact()
                                    a()
                                }) {
                                    Text(t)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(PFColor.primaryText)
                                        .padding(.horizontal, 18)
                                        .padding(.vertical, 11)
                                        .background(Color.clear)
                                        .overlay(
                                            Capsule()
                                                .stroke(PFColor.primaryBorder, lineWidth: 1)
                                        )
                                }
                                .buttonStyle(CustomerCardPressButtonStyle())
                            }
                            if let t = secondaryActionTitle, let a = secondaryAction {
                                Button(action: {
                                    PFHaptics.lightImpact()
                                    a()
                                }) {
                                    Text(t)
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(PFColor.ember)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 6)
                    }
                }
            }
        }
    }
}

// MARK: - Activity row (timeline / list)

enum CustomerActivityRowDot {
    case muted
    case ember
    case success
}

struct CustomerActivityRow: View {
    let title: String
    let relativeTime: String
    var detail: String? = nil
    var dot: CustomerActivityRowDot = .muted

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(dotFill)
                .frame(width: 6, height: 6)
                .padding(.top, 5)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold, design: .default))
                    .foregroundStyle(PFColor.textPrimary)

                if let detail, !detail.isEmpty {
                    Text(detail)
                        .font(.system(size: 14, weight: .medium, design: .default))
                        .foregroundStyle(PFColor.customerMutedText)
                        .lineLimit(3)
                }

                Text(relativeTime)
                    .font(.system(size: 13, weight: .medium, design: .default))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Spacer(minLength: 0)
        }
    }

    private var dotFill: Color {
        switch dot {
        case .muted:
            PFColor.textMuted.opacity(0.9)
        case .ember:
            PFColor.ember.opacity(0.9)
        case .success:
            PFColor.success.opacity(0.9)
        }
    }
}

// MARK: - Sticky bottom action region

/// Bottom chrome for a primary action (e.g. claim). Pair with `.safeAreaInset(edge: .bottom)`.
struct CustomerStickyActionBar<Content: View>: View {
    @ViewBuilder private let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(PFColor.hairline)
                .frame(height: 1)

            content()
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 10)
        }
        .background(PFColor.customerStickyBar)
    }
}
