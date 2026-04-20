import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        NavigationStack {
            Group {
                if !env.sessionStore.isSignedIn {
                    LoginView()
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: PFSpacing.lg) {
                            SectionHeaderView(title: "Standby")
                            PFSurfaceCard {
                                PFTypography.body("You’re signed in. Pick a business and tune standby preferences next.")
                            }
                            NavigationLink("Choose business") {
                                BusinessPickerView()
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(PFColor.primary)
                        }
                        .padding(PFSpacing.lg)
                    }
                }
            }
            .navigationTitle("PulseFill")
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .tint(PFColor.primary)
    }
}
