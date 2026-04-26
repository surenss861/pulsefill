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
                    Spacer(minLength: 54)

                    VStack(alignment: .leading, spacing: 16) {
                        Text("PulseFill")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(PFColor.textPrimary)

                        Text("Earlier appointments.\nLess waiting.")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(PFColor.textPrimary)
                            .lineSpacing(1)
                            .multilineTextAlignment(.leading)
                    }
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 10)

                    Spacer(minLength: 32)

                    AuthAppointmentPassCard()
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 8)
                        .scaleEffect(appeared ? 1 : 0.98)

                    Spacer(minLength: 26)

                    Text("Get notified when better times open up.\nClaim fast. Track status. Skip the back-and-forth.")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                        .lineSpacing(5)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 6)

                    Spacer()

                    VStack(spacing: 12) {
                        Button {
                            path.append(AuthDestination.signIn)
                        } label: {
                            Text("Sign in")
                                .font(.system(size: 17, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(PFColor.primary)
                                .foregroundStyle(Color.black)
                                .clipShape(RoundedRectangle(cornerRadius: PFRadius.largeControl, style: .continuous))
                                .shadow(color: Color.black.opacity(0.42), radius: 12, y: 8)
                                .shadow(color: PFColor.primary.opacity(0.12), radius: 8, y: 3)
                        }

                        Button {
                            path.append(AuthDestination.signUp)
                        } label: {
                            Text("I have an invite")
                                .font(.system(size: 16, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .foregroundStyle(Color.white.opacity(0.94))
                                .background(Color.white.opacity(0.08))
                                .overlay(
                                    RoundedRectangle(cornerRadius: PFRadius.largeControl, style: .continuous)
                                        .stroke(Color.white.opacity(0.28), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: PFRadius.largeControl, style: .continuous))
                        }

                        Text("For invited customers and standby users.")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color.white.opacity(0.48))
                            .padding(.top, 4)
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
                        Color(red: 0.05, green: 0.03, blue: 0.025).opacity(0.45),
                        Color(red: 0.035, green: 0.022, blue: 0.018).opacity(0.78),
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
