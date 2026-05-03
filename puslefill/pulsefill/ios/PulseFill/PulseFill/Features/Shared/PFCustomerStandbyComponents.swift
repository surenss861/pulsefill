import SwiftUI

// MARK: - Screen (customer standby chrome)

/// Warm charcoal + ember glow behind customer flows. Alias of the shared customer backdrop.
struct PFScreenBackground: View {
    var body: some View {
        CustomerScreenBackground()
    }
}

// MARK: - Section surfaces (customer — distinct from operator `PFSectionCard`)

enum PFCustomerSectionVariant: Equatable {
    case `default`
    case elevated
    case quiet
    /// Claim / waiting emphasis — lifted surface + ember hairline.
    case attention
}

struct PFCustomerSectionCard<Content: View>: View {
    let variant: PFCustomerSectionVariant
    var padding: CGFloat = 18
    @ViewBuilder private let content: () -> Content

    init(variant: PFCustomerSectionVariant = .default, padding: CGFloat = 18, @ViewBuilder content: @escaping () -> Content) {
        self.variant = variant
        self.padding = padding
        self.content = content
    }

    private var elevated: Bool {
        switch variant {
        case .elevated, .attention: true
        case .default, .quiet: false
        }
    }

    var body: some View {
        CustomerSectionCard(padding: padding, elevated: elevated) {
            content()
        }
        .overlay {
            if variant == .attention {
                RoundedRectangle(cornerRadius: PFRadius.customerCard, style: .continuous)
                    .stroke(PFColor.primaryBorder.opacity(0.85), lineWidth: 1)
            }
        }
    }
}

// MARK: - Status chip (customer-safe labels)

enum PFCustomerOfferStatusKind: Equatable {
    case available
    case waiting
    case confirmed
    case expired
    case unavailable
    case taken
    case pending
    case active
    case inactive
    case unknown

    var label: String {
        switch self {
        case .available: "Opening available"
        case .waiting: "Waiting for confirmation"
        case .confirmed: "Confirmed"
        case .expired, .unavailable: "No longer available"
        case .taken: "Opening taken"
        case .pending: "Pending"
        case .active: "Active"
        case .inactive: "Inactive"
        case .unknown: "Status unavailable"
        }
    }

    fileprivate var pillTone: CustomerStatusPillTone {
        switch self {
        case .available, .pending, .active: .onDarkEmber
        case .waiting: .warning
        case .confirmed: .success
        case .expired, .unavailable, .inactive, .unknown: .onDarkNeutral
        case .taken: .danger
        }
    }
}

struct PFCustomerStatusChip: View {
    let kind: PFCustomerOfferStatusKind
    /// When set, replaces `kind.label` (e.g. Activity timeline uses shorter category text with offer tones).
    var labelOverride: String? = nil

    var body: some View {
        CustomerStatusPill(text: labelOverride ?? kind.label, tone: kind.pillTone)
    }
}

extension PFCustomerOfferStatusKind {
    /// Maps shared offer display logic to customer-safe inbox / detail chips.
    static func fromInboxDisplayStatus(_ status: CustomerOfferDisplayStatus) -> PFCustomerOfferStatusKind {
        switch status {
        case .readyToClaim, .offerAvailable, .expiresSoon:
            return .available
        case .claimed:
            return .waiting
        case .confirmed:
            return .confirmed
        case .expired:
            return .expired
        case .unavailable:
            return .unavailable
        case .unknown:
            return .unknown
        }
    }
}

// MARK: - Primary CTA (loading without layout jump)

struct PFCustomerPrimaryButton: View {
    let title: String
    var isEnabled: Bool = true
    var isLoading: Bool = false
    var hapticImpact: PFHaptics.TapImpact = .light
    var onDisabledTap: (() -> Void)? = nil
    let action: () -> Void

    var body: some View {
        Group {
            if isLoading {
                ZStack {
                    PFTypography.Customer.button(" ")
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 54)
                        .opacity(0)
                    HStack(spacing: 10) {
                        ProgressView()
                            .tint(.black.opacity(0.85))
                        Text(title)
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.black.opacity(0.92))
                    }
                }
                .frame(maxWidth: .infinity)
                .background(emberFill)
                .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
                .shadow(color: Color.black.opacity(0.12), radius: 6, y: 3)
                .shadow(color: PFColor.ember.opacity(0.28), radius: 14, y: 4)
                .allowsHitTesting(false)
            } else {
                CustomerPrimaryButton(
                    title: title,
                    isEnabled: isEnabled,
                    hapticImpact: hapticImpact,
                    onDisabledTap: onDisabledTap,
                    action: action,
                )
            }
        }
    }

    private var emberFill: some View {
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
}

// MARK: - Secondary CTA

struct PFCustomerSecondaryButton: View {
    let title: String
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button {
            guard isEnabled else { return }
            PFHaptics.lightImpact()
            action()
        } label: {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(PFColor.primaryText)
                .frame(maxWidth: .infinity)
                .frame(minHeight: 50)
                .background(Color.clear)
                .overlay(
                    RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous)
                        .stroke(PFColor.primaryBorder, lineWidth: 1)
                )
        }
        .buttonStyle(CustomerCardPressButtonStyle())
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.45)
    }
}

// MARK: - Loading / error / empty

struct PFCustomerLoadingState: View {
    var title: String = "Loading…"
    var message: String = "Getting the latest standby details."
    var compact: Bool = false

    var body: some View {
        VStack(spacing: compact ? 10 : 14) {
            ProgressView()
                .tint(PFColor.ember)
                .scaleEffect(compact ? 0.95 : 1)

            Text(title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
                .multilineTextAlignment(.center)

            Text(message)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
                .padding(.horizontal, compact ? 8 : 12)
        }
        .padding(.vertical, compact ? 12 : 20)
        .padding(.horizontal, compact ? 16 : 24)
        .frame(maxWidth: .infinity)
    }
}

struct PFCustomerErrorState: View {
    let title: String
    let message: String
    var primaryTitle: String = "Try again"
    let primaryAction: () -> Void
    var secondaryTitle: String?
    var secondaryAction: (() -> Void)?

    var body: some View {
        PFCustomerSectionCard(variant: .default, padding: 20) {
            VStack(alignment: .leading, spacing: 14) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(PFColor.primaryText)

                Text(title)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(message)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                VStack(spacing: 10) {
                    PFCustomerSecondaryButton(title: primaryTitle, isEnabled: true, action: primaryAction)
                    if let secondaryTitle, let secondaryAction {
                        Button {
                            PFHaptics.lightImpact()
                            secondaryAction()
                        } label: {
                            Text(secondaryTitle)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(PFColor.ember)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.top, 4)
            }
        }
    }
}

// MARK: - Info callout (“why you received this”, “what happens next”)

enum PFCustomerInfoCalloutVariant: Equatable {
    case neutral
    case attention
    case success
    case warning
}

struct PFCustomerInfoCallout: View {
    let title: String
    let message: String
    var variant: PFCustomerInfoCalloutVariant = .neutral

    var body: some View {
        PFCustomerSectionCard(variant: sectionVariant, padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(message)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.customerMutedText)
                    .lineSpacing(3)
            }
        }
    }

    private var sectionVariant: PFCustomerSectionVariant {
        switch variant {
        case .neutral: .quiet
        case .attention: .attention
        case .success: .elevated
        case .warning: .elevated
        }
    }
}

// MARK: - Error copy sanitization (never show raw host/API lines to customers)

enum PFCustomerFacingErrorCopy {
    /// Sign-in / sign-up / Supabase auth: never surface raw Supabase JSON, API key hints, or HTTP envelopes.
    static func sanitizeAuthMessage(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return "We couldn’t connect to PulseFill. Please try again shortly."
        }
        if looksLikeInvalidSupabaseClientOrKey(trimmed) {
            return "We couldn’t connect to PulseFill. Please try again shortly."
        }
        return sanitizeCustomerMessage(trimmed)
    }

    /// Prefer friendly copy when the underlying message looks technical.
    static func sanitizeCustomerMessage(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return "Something went wrong. Please try again."
        }
        let lower = trimmed.lowercased()
        if looksLikeInvalidSupabaseClientOrKey(trimmed) {
            return "We couldn’t connect to PulseFill. Please try again shortly."
        }
        if lower.contains("http://") || lower.contains("https://") || lower.contains("api.") || lower.contains(".com/")
            || lower.contains("hostname") || lower.contains("could not connect") || lower.contains("connection refused")
        {
            return "We couldn’t load this yet. Check your connection and try again."
        }
        if lower.contains("unauthorized") || lower.contains("invalid token") || lower.contains("401") {
            return "Please sign in again to continue."
        }
        return trimmed
    }

    static func claimFailureMessage(from error: Error) -> String {
        let base = APIErrorCopy.message(for: error)
        return sanitizeCustomerMessage(base)
    }

    /// Supabase misconfiguration (wrong anon key, wrong project URL) and similar — never show verbatim to customers.
    private static func looksLikeInvalidSupabaseClientOrKey(_ raw: String) -> Bool {
        let lower = raw.lowercased()
        if lower.contains("invalid api key") { return true }
        if lower.contains("service_role") || lower.contains("service role") { return true }
        if lower.contains("`anon`") || lower.contains("anon key") || lower.contains("anon`") { return true }
        if lower.contains("double check your supabase") { return true }
        if lower.contains("\"message\""), lower.contains("invalid") { return true }
        if lower.contains("http 401"), lower.contains("api key") { return true }
        if lower.contains("http 401"), lower.contains("\"message\"") { return true }
        return false
    }
}
