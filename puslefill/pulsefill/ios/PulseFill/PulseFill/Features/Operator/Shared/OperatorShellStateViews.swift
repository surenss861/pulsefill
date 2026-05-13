import SwiftUI

// MARK: - Empty

/// Consistent empty state for Business / operator lists and sections.
struct OperatorEmptyStateCard: View {
    let systemImage: String
    let title: String
    let message: String
    var primaryButtonTitle: String?
    var primaryAction: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: systemImage)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(PFColor.primary)
                    .frame(width: 36, height: 36)

                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(message)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }

            if let primaryButtonTitle, let primaryAction {
                Button(action: primaryAction) {
                    Text(primaryButtonTitle)
                        .font(.system(size: 15, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: PFOperatorShellMetrics.buttonMinHeight)
                }
                .buttonStyle(.borderedProminent)
                .tint(PFColor.primary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.hairline, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}

// MARK: - Error

/// Operator-facing error with friendly copy first and optional technical detail.
struct OperatorErrorStateCard: View {
    let title: String
    let message: String
    let technicalMessage: String?
    /// Action-specific label (e.g. “Reload Today”) — defaults to “Try again”.
    var retryButtonTitle: String = "Try again"
    /// Short reassurance below the retry button (e.g. other tabs still work).
    var footerHint: String?
    let onRetry: () async -> Void

    @State private var showTechnical = false
    @State private var isRetrying = false

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(PFColor.warning)
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(PFColor.textPrimary)
                    Text(message)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }

            if let technicalMessage, !technicalMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button {
                    showTechnical.toggle()
                } label: {
                    Text(showTechnical ? "Hide details" : "Details")
                        .font(.system(size: 13, weight: .semibold))
                }
                .buttonStyle(.borderless)
                .tint(PFColor.primary)

                if showTechnical {
                    Text(technicalMessage)
                        .font(.system(size: 12, weight: .regular, design: .monospaced))
                        .foregroundStyle(PFColor.textSecondary.opacity(0.95))
                        .textSelection(.enabled)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(PFColor.divider.opacity(0.85))
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }

            Button {
                Task {
                    isRetrying = true
                    defer { isRetrying = false }
                    await onRetry()
                }
            } label: {
                Text(isRetrying ? "Loading…" : retryButtonTitle)
                    .font(.system(size: 16, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: PFOperatorShellMetrics.buttonMinHeight)
            }
            .buttonStyle(PFPrimaryButtonStyle())
            .disabled(isRetrying)

            if let footerHint, !footerHint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Text(footerHint)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary.opacity(0.92))
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.warning.opacity(0.22), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}

// MARK: - Loading (section / first paint)

struct OperatorListLoadingPlaceholder: View {
    var title: String = "Loading…"
    var subtitle: String = "Hang tight while we fetch the latest."
    var skeletonCount: Int = 4

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                Text(subtitle)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            }
            PFLoadingSkeleton(count: skeletonCount)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Shared moment wrappers

/// Unified operator empty moment: one headline, one body, one obvious action.
struct PFOperatorEmptyMoment: View {
    let systemImage: String
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        OperatorEmptyStateCard(
            systemImage: systemImage,
            title: title,
            message: message,
            primaryButtonTitle: actionTitle,
            primaryAction: {
                PFHaptics.selection()
                action?()
            }
        )
    }
}

/// Unified operator error moment: friendly copy first, technical details secondary.
struct PFOperatorErrorMoment: View {
    let title: String
    let message: String
    let technicalMessage: String?
    var actionTitle: String = "Try again"
    var footerHint: String?
    let onAction: () async -> Void

    var body: some View {
        OperatorErrorStateCard(
            title: title,
            message: message,
            technicalMessage: technicalMessage,
            retryButtonTitle: actionTitle,
            footerHint: footerHint,
            onRetry: {
                PFHaptics.selection()
                await onAction()
            }
        )
    }
}
