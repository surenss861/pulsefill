import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PFSpacing.lg) {
                PFTypography.hero("Welcome back")
                PFTypography.caption("Sign in to view your available offers and booking activity.")

                TextField("Email", text: $email)
                    .textFieldStyle(PFTextFieldStyle())
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
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
            }
            .padding(PFSpacing.xl)
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Sign in")
        .navigationBarTitleDisplayMode(.inline)
    }
}
