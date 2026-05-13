import SwiftUI

struct AuthLandingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var path = NavigationPath()
    @State private var appeared = false

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                PFScreenBackground()

                LinearGradient(
                    colors: [
                        PFColor.customerInkDeep.opacity(0.35),
                        Color.clear,
                        PFColor.background.opacity(0.55),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                .allowsHitTesting(false)

                VStack(alignment: .leading, spacing: 0) {
                    Spacer(minLength: 36)

                    VStack(alignment: .leading, spacing: 0) {
                        Text("PulseFill")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(PFColor.textPrimary)

                        Text("Sign in to run today’s recovery.")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(PFColor.textPrimary)
                            .lineSpacing(3)
                            .lineLimit(3)
                            .minimumScaleFactor(0.82)
                            .allowsTightening(true)
                            .multilineTextAlignment(.leading)
                            .padding(.top, 14)

                        Text("Manage openings, claims, and confirmed bookings before the day slips away.")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(PFColor.textSecondary)
                            .lineSpacing(3)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 10)

                        recoveryBulletList
                            .padding(.top, 14)
                    }
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 10)

                    Spacer(minLength: 18)

                    AuthAppointmentPassCard()
                        .opacity(appeared ? 1 : 0)
                        .offset(y: appeared ? 0 : 8)
                        .scaleEffect(appeared ? 1 : 0.99)

                    Spacer()

                    VStack(spacing: 12) {
                        Button {
                            path.append(AuthDestination.signIn)
                        } label: {
                            Text("Sign in")
                                .font(.system(size: 17, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 56)
                                .foregroundStyle(PFColor.emberText)
                                .background {
                                    ZStack {
                                        PFColor.ember
                                        LinearGradient(
                                            colors: [
                                                Color.white.opacity(0.16),
                                                Color.clear,
                                            ],
                                            startPoint: .top,
                                            endPoint: .center
                                        )
                                        .blendMode(.overlay)
                                    }
                                }
                                .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
                                .shadow(color: PFColor.elevationShadowSoft, radius: 8, y: 5)
                                .shadow(color: PFColor.ember.opacity(0.16), radius: 14, y: 5)
                        }

                        Button {
                            path.append(AuthDestination.signUp)
                        } label: {
                            Text("Create account")
                                .font(.system(size: 16, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 52)
                                .foregroundStyle(PFColor.primaryText)
                                .background(PFColor.chipWashStrong)
                                .overlay(
                                    RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous)
                                        .stroke(PFColor.primaryBorder, lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
                        }

                        Button {
                            path.append(AuthDestination.signUp)
                        } label: {
                            Text("Use invite code")
                                .font(.system(size: 15, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 48)
                                .foregroundStyle(PFColor.textSecondary)
                                .background(PFColor.chipWash)
                                .overlay(
                                    RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous)
                                        .stroke(PFColor.hairline, lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: PFRadius.controlLarge, style: .continuous))
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
                        PFColor.customerInkDeep.opacity(0.22),
                        PFColor.background.opacity(0.5),
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

    private var recoveryBulletList: some View {
        VStack(alignment: .leading, spacing: 8) {
            authLandingBullet("See cancelled appointments")
            authLandingBullet("Send offers to waiting customers")
            authLandingBullet("Confirm claimed bookings")
        }
    }

    private func authLandingBullet(_ line: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Circle()
                .fill(PFColor.textMuted.opacity(0.85))
                .frame(width: 5, height: 5)
                .padding(.top, 6)
            Text(line)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(PFColor.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private enum AuthDestination: Hashable {
    case signIn
    case signUp
}
