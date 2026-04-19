import SwiftUI

@main
struct PulseFillApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var env = AppEnvironment.development

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(env)
                .environmentObject(env.sessionStore)
                .task {
                    AppDelegate.pushCoordinator = env.pushCoordinator
                    await env.authManager.restoreSessionIfNeeded()
                    await env.pushCoordinator.bootstrapIfSignedIn(sessionStore: env.sessionStore)
                }
                .onChange(of: env.sessionStore.accessToken) { _, newValue in
                    guard newValue != nil else { return }
                    Task {
                        await env.pushCoordinator.bootstrapIfSignedIn(sessionStore: env.sessionStore)
                    }
                }
        }
    }
}
