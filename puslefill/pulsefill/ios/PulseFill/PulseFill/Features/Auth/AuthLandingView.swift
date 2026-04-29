import SwiftUI

struct AuthLandingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var path = NavigationPath()
    @State private var appeared = false

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                AuthMetalBackgroundView(reduceMotion: reduceMotion)
                    .ignoresSafeArea()

                LinearGradient(
                    colors: [
                        Color(red: 0.16, green: 0.10, blue: 0.08).opacity(0.72),
                        Color(red: 0.09, green: 0.06, blue: 0.055).opacity(0.55),
                        Color(red: 0.06, green: 0.045, blue: 0.04).opacity(0.68),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 0) {
                    Spacer(minLength: 42)

                    VStack(alignment: .leading, spacing: 0) {
                        Text("PulseFill")
                            .font(.system(size: 23, weight: .bold))
                            .foregroundStyle(Color.white.opacity(0.92))

                        Text("Get earlier appointments.")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(Color.white.opacity(0.94))
                            .lineSpacing(4)
                            .lineLimit(2)
                            .minimumScaleFactor(0.9)
                            .allowsTightening(true)
                            .multilineTextAlignment(.leading)
                            .padding(.top, 18)

                        Text("Create an account to receive openings from businesses you’re connected with.")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(PFColor.textSecondary)
                            .lineSpacing(3)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 14)
                    }
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 10)

                    Spacer(minLength: 22)

                    AuthAppointmentPassCard()
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 8)
                        .scaleEffect(appeared ? 1 : 0.99)

                    Spacer()

                    VStack(spacing: 12) {
                        Button {
                            path.append(AuthDestination.signUp)
                        } label: {
                            Text("Create account")
                                .font(.system(size: 17, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 58)
                                .foregroundStyle(Color.black)
                                .background {
                                    ZStack {
                                        // Brighter ember for signed-out CTA (PFColor.primary reads muddy on warm scrim).
                                        Color(red: 1.0, green: 0.42, blue: 0.05)
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
                                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                                .shadow(color: Color.black.opacity(0.22), radius: 8, y: 5)
                                .shadow(color: Color(red: 1.0, green: 0.42, blue: 0.05).opacity(0.35), radius: 16, y: 5)
                        }

                        Button {
                            path.append(AuthDestination.signIn)
                        } label: {
                            Text("Sign in")
                                .font(.system(size: 16, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .foregroundStyle(Color.white.opacity(0.92))
                                .background(Color.white.opacity(0.08))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                                        .stroke(Color.white.opacity(0.14), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        }

                        Button {
                            path.append(AuthDestination.signUp)
                        } label: {
                            Text("I have an invite code")
                                .font(.system(size: 15, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .foregroundStyle(Color.white.opacity(0.65))
                                .background(Color.white.opacity(0.05))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        }
                    }
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 12)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 22)
            }
            .overlay {
                LinearGradient(
                    colors: [
                        Color.clear,
                        Color(red: 0.05, green: 0.03, blue: 0.025).opacity(0.38),
                        Color(red: 0.035, green: 0.022, blue: 0.018).opacity(0.68),
                    ],
                    startPoint: .center,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                .allowsHitTesting(false)
            }
            .onAppear {
                if reduceMotion {
                    appeared = true
                    return
                }
                withAnimation(.spring(response: 0.85, dampingFraction: 0.88)) {
                    appeared = true
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: AuthDestination.self) { destination in
                switch destination {
                case .signIn:
                    SignInView()
                case .signUp:
                    SignUpView()
                }
            }
        }
        .tint(PFColor.primary)
    }
}

private enum AuthDestination: Hashable {
    case signIn
    case signUp
}
