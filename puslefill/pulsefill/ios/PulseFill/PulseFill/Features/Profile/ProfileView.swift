import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        NavigationStack {
            List {
                Section {
                    if let uid = env.sessionStore.userId {
                        LabeledContent("User", value: uid)
                    } else {
                        Text("Not signed in").foregroundStyle(PFColor.textSecondary)
                    }
                    if let email = env.sessionStore.email, !email.isEmpty {
                        LabeledContent("Email", value: email)
                    }
                }
                Section("Standby") {
                    NavigationLink("Preferences") {
                        StandbyPreferencesView(api: env.apiClient)
                    }
                }
                Section {
                    Button("Sign out", role: .destructive) {
                        Task { await env.authManager.signOut() }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(PFColor.background)
            .navigationTitle("Profile")
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }
}
