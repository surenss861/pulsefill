import SwiftUI

@main
struct PulseFillApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var env = AppEnvironment.development

    var body: some Scene {
        WindowGroup {
            MainShellView()
                .environmentObject(env)
                .environmentObject(env.sessionStore)
                .environmentObject(env.authManager)
                .onOpenURL { url in
                    let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
                    if let token = items?.first(where: { $0.name == "token" })?.value, !token.isEmpty {
                        env.sessionStore.pendingInviteToken = token
                        Task { await env.authManager.processPendingInviteTokenIfNeeded() }
                    }
                }
                .task {
                    AppDelegate.pushCoordinator = env.pushCoordinator
                    await env.authManager.restoreSessionIfNeeded()
                    await env.pushCoordinator.bootstrapIfSignedIn(sessionStore: env.sessionStore)
                }
                .onChange(of: env.sessionStore.accessToken) { _, newValue in
                    guard newValue != nil else { return }
                    Task {
                        await env.authManager.refreshStaffAccess()
                        await env.pushCoordinator.bootstrapIfSignedIn(sessionStore: env.sessionStore)
                    }
                }
        }
    }
}
