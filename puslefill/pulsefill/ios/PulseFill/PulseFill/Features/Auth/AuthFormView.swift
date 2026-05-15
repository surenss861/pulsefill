import OSLog
import SwiftUI

struct AuthFormView: View {
    @EnvironmentObject private var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @Namespace private var authNamespace

    @State private var mode: AuthFormMode
    @State private var email = ""
    @State private var password = ""
    @State private var appeared = false
    /// Sole source of truth for the auth form banner (validation + remote outcomes).
    @State private var formBanner: AuthFormBanner?

    init(initialMode: AuthFormMode) {
        _mode = State(initialValue: initialMode)
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                PFScreenBackground()
                    .ignoresSafeArea()

                authScrim

                VStack(spacing: 0) {
                    customTopBar

                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 24) {
                            header

                            modeSwitch

                            formCard

                            switchModeFooter

                            Text(PulseFillBuildConfiguration.authScreenQAFootnote)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(PFColor.textMuted.opacity(0.85))
                                .lineSpacing(3)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.top, 8)
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 36)
                        .padding(.bottom, 36)
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 12)
                    }
                }
                .padding(.top, proxy.safeAreaInsets.top)
            }
            .frame(width: proxy.size.width, height: proxy.size.height, alignment: .top)
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            clearFormBanner()
            if reduceMotion {
                appeared = true
            } else {
                withAnimation(.spring(response: 0.72, dampingFraction: 0.88)) {
                    appeared = true
                }
            }
        }
        .onChange(of: email) { _, _ in
            clearFormBanner()
        }
        .onChange(of: password) { _, _ in
            clearFormBanner()
        }
        .onChange(of: mode) { _, _ in
            clearFormBanner()
        }
    }

    private var customTopBar: some View {
        HStack {
            Button {
                PFHaptics.lightImpact()
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textSecondary)
                    .frame(width: 42, height: 42)
                    .background(PFColor.chipWashStrong)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(PFColor.hairline, lineWidth: 1))
            }
            .buttonStyle(.plain)

            Spacer()

            Text(mode.navigationTitle)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(PFColor.textPrimary)

            Spacer()

            Color.clear
                .frame(width: 42, height: 42)
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 4)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            if !mode.eyebrow.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Text(mode.eyebrow)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Text(mode.title)
                .font(.system(size: 28, weight: .bold))
                .lineSpacing(2)
                .foregroundStyle(PFColor.textPrimary)
                .lineLimit(4)
                .minimumScaleFactor(0.82)
                .contentTransition(.opacity)

            Text(mode.subtitle)
                .font(.system(size: 15, weight: .medium))
                .lineSpacing(4)
                .foregroundStyle(PFColor.textMuted)
                .fixedSize(horizontal: false, vertical: true)
                .contentTransition(.opacity)
        }
        .animation(authAnimation, value: mode)
    }

    private var modeSwitch: some View {
        HStack(spacing: 0) {
            authModeButton(.signIn)
            authModeButton(.signUp)
        }
        .padding(5)
        .background(PFColor.chipWash)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous)
                .stroke(PFColor.hairline, lineWidth: 1)
        }
    }

    private func authModeButton(_ target: AuthFormMode) -> some View {
        Button {
            switchMode(target)
        } label: {
            ZStack {
                if mode == target {
                    RoundedRectangle(cornerRadius: 17, style: .continuous)
                        .fill(PFColor.ember)
                        .matchedGeometryEffect(id: "active-auth-mode", in: authNamespace)
                }

                Text(target == .signIn ? "Sign in" : "Create account")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(mode == target ? PFColor.emberText : PFColor.customerTextTertiary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 42)
            }
        }
        .buttonStyle(.plain)
    }

    private var formCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(spacing: 12) {
                AuthInputField(
                    title: "Email",
                    text: $email,
                    systemImage: "envelope",
                    keyboardType: .emailAddress,
                    isSecure: false
                )

                AuthInputField(
                    title: "Password",
                    text: $password,
                    systemImage: "lock",
                    keyboardType: .default,
                    isSecure: true
                )

                if mode == .signIn {
                    HStack {
                        Spacer(minLength: 0)
                        Button {
                            PFHaptics.lightImpact()
                            clearFormBanner()
                            Task { await submitPasswordReset() }
                        } label: {
                            Text("Reset password")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(PFColor.emberReadable)
                        }
                        .buttonStyle(.plain)
                        .disabled(authManager.isBusy)
                        .opacity(authManager.isBusy ? 0.45 : 1)
                    }
                    .padding(.top, 2)
                }
            }

            if let formBanner {
                let isPositive = formBanner.usesSuccessChrome
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: isPositive ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(isPositive ? PFColor.success : PFColor.error)

                    Text(formBanner.message)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(isPositive ? PFColor.success : PFColor.error)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(13)
                .background((isPositive ? PFColor.success : PFColor.error).opacity(0.11))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            Button {
                submit()
            } label: {
                HStack(spacing: 10) {
                    if authManager.isBusy {
                        ProgressView()
                            .tint(authPrimaryCTAChromeActive ? PFColor.emberText.opacity(0.9) : PFColor.customerTextSecondary)
                    }

                    Text(authManager.isBusy ? mode.busyTitle : mode.primaryButtonTitle)
                        .font(.system(size: 16, weight: .bold))
                }
                .foregroundStyle(
                    authPrimaryCTAChromeActive ? PFColor.emberText : PFColor.customerTextSecondary
                )
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background {
                    RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous)
                        .fill(authPrimaryCTAChromeFill)
                        .overlay {
                            if authPrimaryCTAChromeActive {
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.10),
                                        Color.clear,
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                                .blendMode(.overlay)
                                .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
                            }
                        }
                        .overlay {
                            RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous)
                                .stroke(
                                    authPrimaryCTAChromeActive ? Color.clear : PFColor.customerHairline,
                                    lineWidth: 1
                                )
                        }
                }
            }
            .buttonStyle(CustomerCardPressButtonStyle())
            .disabled(authManager.isBusy)
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: formBannerAnimationKey)
        .padding(18)
        .background {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(PFColor.customerGlass)
                .matchedGeometryEffect(id: "auth-form-card", in: authNamespace)
                .overlay {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [PFColor.cardSheenWarm.opacity(0.4), Color.clear],
                                startPoint: .top,
                                endPoint: UnitPoint(x: 0.5, y: 0.35)
                            )
                        )
                        .allowsHitTesting(false)
                }
                .overlay {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .stroke(PFColor.customerHairlineStrong, lineWidth: 1)
                }
        }
        .shadow(color: PFColor.elevationShadowDeep, radius: 18, x: 0, y: 12)
        .animation(authAnimation, value: mode)
    }

    private var switchModeFooter: some View {
        HStack(spacing: 6) {
            Text(mode.switchPrompt)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(PFColor.customerTextTertiary)

            Button {
                switchMode(mode == .signIn ? .signUp : .signIn)
            } label: {
                Text(mode.switchActionTitle)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PFColor.emberReadable)
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 2)
    }

    private var authScrim: some View {
        LinearGradient(
            colors: [
                PFColor.customerInkDeep.opacity(0.06),
                Color.clear,
                PFColor.background.opacity(0.32),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }

    private var authAnimation: Animation? {
        reduceMotion ? nil : .spring(response: 0.48, dampingFraction: 0.86)
    }

    private var formBannerAnimationKey: String {
        guard let formBanner else { return "" }
        switch formBanner {
        case .validation(let s): return "v:\(s)"
        case .info(let s): return "i:\(s)"
        case .auth(let s): return "a:\(s)"
        case .connection(let s): return "c:\(s)"
        }
    }

    private func clearFormBanner() {
        formBanner = nil
    }

    private var canSubmit: Bool {
        !authManager.isBusy
    }

    /// Primary ember CTA chrome while the form can submit or a submit is in flight.
    private var authPrimaryCTAChromeActive: Bool {
        canSubmit || authManager.isBusy
    }

    /// Slightly burnt ember (web-style) when active; solid walnut when disabled but still legible.
    private var authPrimaryCTAChromeFill: LinearGradient {
        if authPrimaryCTAChromeActive {
            LinearGradient(
                colors: [PFColor.primaryDark, PFColor.ember.opacity(0.92)],
                startPoint: .bottomLeading,
                endPoint: .topTrailing
            )
        } else {
            LinearGradient(
                colors: [PFColor.customerGlass, PFColor.customerGlass],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private func switchMode(_ next: AuthFormMode) {
        guard next != mode else { return }
        clearFormBanner()
        PFHaptics.selection()

        if reduceMotion {
            mode = next
        } else {
            withAnimation(.spring(response: 0.48, dampingFraction: 0.86)) {
                mode = next
            }
        }
    }

    private func submitPasswordReset() async {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            formBanner = .validation("Enter your email.")
            PFHaptics.warning()
            return
        }
        if !AuthFormValidation.isValidSingleEmailFormat(trimmed) {
            formBanner = .validation("Enter a valid email address.")
            PFHaptics.warning()
            return
        }
        let remote = await authManager.performPasswordReset(email: trimmed)
        formBanner = remote
        switch remote {
        case .info:
            PFHaptics.lightImpact()
        case .validation, .auth, .connection:
            PFHaptics.warning()
        }
    }

    private func submit() {
        clearFormBanner()
        guard !authManager.isBusy else { return }
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let pwTrim = password.trimmingCharacters(in: .whitespacesAndNewlines)
        AuthSubmitQALog.logSubmitTapped(
            mode: mode,
            emailEmpty: trimmedEmail.isEmpty,
            emailFormatOK: AuthFormValidation.isValidSingleEmailFormat(trimmedEmail),
            passwordEmpty: pwTrim.isEmpty,
            signUpPwLen: mode == .signUp ? pwTrim.count : -1
        )
        switch AuthFormValidation.submitValidation(email: trimmedEmail, password: password, mode: mode) {
        case .ok:
            AuthSubmitQALog.logLocalValidationPassed()
            PFHaptics.mediumImpact()
            Task {
                switch mode {
                case .signIn:
                    let outcome = await authManager.performSignIn(email: trimmedEmail, password: password)
                    if case .failed(let b) = outcome {
                        formBanner = b
                        PFHaptics.warning()
                    }
                case .signUp:
                    let outcome = await authManager.performSignUp(email: trimmedEmail, password: password)
                    switch outcome {
                    case .signedIn:
                        break
                    case .verifyEmailInbox:
                        formBanner = .info("Check your inbox to verify your email, then sign in.")
                        PFHaptics.lightImpact()
                    case .failed(let b):
                        formBanner = b
                        PFHaptics.warning()
                    }
                }
            }
        case .failure(let banner, let qaReason):
            formBanner = banner
            AuthSubmitQALog.logLocalValidationFailed(qaReason: qaReason)
            PFHaptics.warning()
        }
    }
}

// MARK: - Auth submit QA log

private enum AuthSubmitQALog {
    private static let log = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "PulseFill",
        category: "auth-submit"
    )

    static func logSubmitTapped(
        mode: AuthFormMode,
        emailEmpty: Bool,
        emailFormatOK: Bool,
        passwordEmpty: Bool,
        signUpPwLen: Int
    ) {
        guard PulseFillBuildConfiguration.isAuthQaLoggingEnabled else { return }
        let ee = emailEmpty ? "true" : "false"
        let ef = emailFormatOK ? "true" : "false"
        let pe = passwordEmpty ? "true" : "false"
        log.info(
            "Auth submit tapped mode=\(mode.rawValue, privacy: .public) emailEmpty=\(ee, privacy: .public) emailFormatOK=\(ef, privacy: .public) passwordEmpty=\(pe, privacy: .public) signUpPwLen=\(String(signUpPwLen), privacy: .public)"
        )
    }

    static func logLocalValidationFailed(qaReason: String) {
        guard PulseFillBuildConfiguration.isAuthQaLoggingEnabled else { return }
        log.info("Auth local validation failed reason=\(qaReason, privacy: .public)")
    }

    static func logLocalValidationPassed() {
        guard PulseFillBuildConfiguration.isAuthQaLoggingEnabled else { return }
        log.info("Auth local validation passed, starting auth task")
    }
}

// MARK: - Fields

private struct AuthInputField: View {
    let title: String
    @Binding var text: String
    let systemImage: String
    let keyboardType: UIKeyboardType
    let isSecure: Bool

    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isFocused ? PFColor.emberReadable : PFColor.customerTextTertiary)
                .frame(width: 20)

            Group {
                if isSecure {
                    SecureField(
                        "",
                        text: $text,
                        prompt: Text(title).foregroundStyle(PFColor.customerTextTertiary)
                    )
                } else {
                    TextField(
                        "",
                        text: $text,
                        prompt: Text(title).foregroundStyle(PFColor.customerTextTertiary)
                    )
                }
            }
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(PFColor.textPrimary)
            .tint(PFColor.ember)
            .keyboardType(keyboardType)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .focused($isFocused)
        }
        .padding(.horizontal, 14)
        .frame(height: 54)
        .background {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(PFColor.customerGlassDeep)
                .overlay {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(
                            isFocused ? PFColor.primaryBorder.opacity(0.5) : PFColor.customerHairline,
                            lineWidth: 1
                        )
                }
        }
    }
}
