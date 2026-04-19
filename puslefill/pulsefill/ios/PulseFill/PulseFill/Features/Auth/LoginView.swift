import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PFSpacing.lg) {
                PFTypography.hero("Welcome back")
                PFTypography.caption(
                    "Sign in with your Supabase email and password. Configure tier + URLs in PulseFillBuildConfiguration.swift, or set PULSEFILL_API_BASE_URL / PULSEFILL_TIER in the scheme for Railway."
                )
                TextField("Email", text: $email)
                    .textFieldStyle(PFTextFieldStyle())
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                SecureField("Password", text: $password)
                    .textFieldStyle(PFTextFieldStyle())

                if let banner = env.authManager.banner {
                    Text(banner)
                        .font(.footnote)
                        .foregroundStyle(PFColor.error)
                }

                Button {
                    Task { await env.authManager.signIn(email: email, password: password) }
                } label: {
                    HStack {
                        if env.authManager.isBusy { ProgressView().tint(.black) }
                        Text(env.authManager.isBusy ? "Signing in…" : "Sign in")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(PFPrimaryButtonStyle())
                .disabled(env.authManager.isBusy || email.isEmpty || password.isEmpty)

                Button {
                    Task { await env.authManager.signUp(email: email, password: password) }
                } label: {
                    Text("Create account")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(PFColor.primary)
                .disabled(env.authManager.isBusy || email.isEmpty || password.isEmpty)
            }
            .padding(PFSpacing.xl)
        }
        .background(PFColor.background.ignoresSafeArea())
    }
}
