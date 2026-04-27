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

    private let ctaOrange = Color(red: 1.0, green: 0.42, blue: 0.05)

    init(initialMode: AuthFormMode) {
        _mode = State(initialValue: initialMode)
    }

    var body: some View {
        ZStack {
            AuthMetalBackgroundView(reduceMotion: reduceMotion)
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
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 30)
                    .padding(.bottom, 36)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 12)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            if reduceMotion {
                appeared = true
            } else {
                withAnimation(.spring(response: 0.72, dampingFraction: 0.88)) {
                    appeared = true
                }
            }
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
                    .foregroundStyle(.white.opacity(0.88))
                    .frame(width: 42, height: 42)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Spacer()

            Text(mode.navigationTitle)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.white.opacity(0.92))

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
            Text(mode.eyebrow)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(PFColor.ember)

            Text(mode.title)
                .font(.system(size: 34, weight: .bold))
                .lineSpacing(2)
                .foregroundStyle(.white.opacity(0.96))
                .contentTransition(.opacity)

            Text(mode.subtitle)
                .font(.system(size: 15.5, weight: .semibold))
                .lineSpacing(4)
                .foregroundStyle(Color(red: 0.63, green: 0.66, blue: 0.72))
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
        .background(Color.white.opacity(0.055))
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color.white.opacity(0.10), lineWidth: 1)
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

                Text(target == .signIn ? "Sign in" : "Create")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(mode == target ? Color.black.opacity(0.88) : Color.white.opacity(0.56))
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
            }

            if let banner = authManager.banner, !banner.isEmpty {
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PFColor.error)

                    Text(banner)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(PFColor.error)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(13)
                .background(PFColor.error.opacity(0.11))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            Button {
                submit()
            } label: {
                HStack(spacing: 10) {
                    if authManager.isBusy {
                        ProgressView()
                            .tint(authPrimaryCTAChromeActive ? .black : .white.opacity(0.72))
                    }

                    Text(authManager.isBusy ? mode.busyTitle : mode.primaryButtonTitle)
                        .font(.system(size: 16, weight: .bold))
                }
                .foregroundStyle(authPrimaryCTAChromeActive ? Color.black.opacity(0.88) : Color.white.opacity(0.54))
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background {
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(authPrimaryCTAChromeActive ? ctaOrange : Color.white.opacity(0.16))
                        .overlay {
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(authPrimaryCTAChromeActive ? 0.18 : 0.08),
                                    Color.black.opacity(authPrimaryCTAChromeActive ? 0.08 : 0.03),
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            .blendMode(.overlay)
                            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        }
                }
            }
            .buttonStyle(CustomerCardPressButtonStyle())
            .disabled(authManager.isBusy)
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: authManager.banner)
        .padding(18)
        .background {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
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
                .matchedGeometryEffect(id: "auth-form-card", in: authNamespace)
                .overlay {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Color.white.opacity(0.07), Color.white.opacity(0.0)],
                                startPoint: .top,
                                endPoint: UnitPoint(x: 0.5, y: 0.38)
                            )
                        )
                        .allowsHitTesting(false)
                }
                .overlay {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    PFColor.ember.opacity(0.26),
                                    Color.white.opacity(0.12),
                                    Color.white.opacity(0.11),
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                }
        }
        .shadow(color: Color.black.opacity(0.42), radius: 24, x: 0, y: 18)
        .shadow(color: ctaOrange.opacity(0.10), radius: 34, x: 0, y: 18)
        .animation(authAnimation, value: mode)
    }

    private var switchModeFooter: some View {
        HStack(spacing: 6) {
            Text(mode.switchPrompt)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white.opacity(0.46))

            Button {
                switchMode(mode == .signIn ? .signUp : .signIn)
            } label: {
                Text(mode.switchActionTitle)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PFColor.ember)
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 2)
    }

    private var authScrim: some View {
        LinearGradient(
            colors: [
                Color.black.opacity(0.12),
                Color.black.opacity(0.02),
                Color.black.opacity(0.64),
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

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            !password.isEmpty &&
            !authManager.isBusy
    }

    /// Primary ember CTA chrome while the form can submit or a submit is in flight.
    private var authPrimaryCTAChromeActive: Bool {
        canSubmit || authManager.isBusy
    }

    private func switchMode(_ next: AuthFormMode) {
        guard next != mode else { return }
        authManager.banner = nil
        PFHaptics.selection()

        if reduceMotion {
            mode = next
        } else {
            withAnimation(.spring(response: 0.48, dampingFraction: 0.86)) {
                mode = next
            }
        }
    }

    private func submit() {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !password.isEmpty, !authManager.isBusy else {
            PFHaptics.warning()
            return
        }
        PFHaptics.mediumImpact()
        Task {
            switch mode {
            case .signIn:
                await authManager.signIn(email: trimmed, password: password)
            case .signUp:
                await authManager.signUp(email: trimmed, password: password)
            }
        }
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
                .foregroundStyle(isFocused ? PFColor.emberReadable : Color.white.opacity(0.52))
                .frame(width: 20)

            Group {
                if isSecure {
                    SecureField(
                        "",
                        text: $text,
                        prompt: Text(title).foregroundStyle(Color.white.opacity(0.48))
                    )
                } else {
                    TextField(
                        "",
                        text: $text,
                        prompt: Text(title).foregroundStyle(Color.white.opacity(0.48))
                    )
                }
            }
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(Color.white.opacity(0.94))
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
                .fill(Color.white.opacity(0.095))
                .overlay {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(
                            isFocused
                                ? PFColor.ember.opacity(0.50)
                                : Color.white.opacity(0.12),
                            lineWidth: 1
                        )
                }
        }
    }
}
