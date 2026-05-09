import SwiftUI
import UserNotifications

/// Customer Home — calm appointment assistant (openings, standby, activity).
struct HomeView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("pf.onboarding.standby.completed") private var standbyOnboardingCompleted = false
    @AppStorage("pf.onboarding.standbyFirstRunComplete") private var legacyStandbyComplete = false

    @State private var loadedOffers: [OfferInboxItem] = []
    @State private var activityPreview: [CustomerActivityItem] = []
    @State private var standbySummary: StandbyStatusSummary?
    @State private var notificationReadiness: StandbyNotificationReadiness?
    @State private var lastPushPermissionStatus: String = "unknown"
    @State private var loading = true
    @State private var loadError: String?
    @State private var homeRefreshInFlight = false
    @State private var homeInitialRefreshFinished = false

    private enum HomeRefreshKind {
        /// First load / account switch — may show the blocking empty-state loader.
        case initial
        /// Pull-to-refresh — system refresh control only; do not toggle `loading`.
        case userPull
        /// App foreground / scene active again — silent; do not toggle `loading`.
        /// Also used when the customer switches back to the Home tab (in-app navigation; scene may stay `.active`).
        case sceneBecameActive
    }

    private var standbyActiveLocal: Bool {
        standbyOnboardingCompleted || legacyStandbyComplete
    }

    /// Server or local onboarding: any active standby signal.
    private var standbyConfigured: Bool {
        standbyActiveLocal || (standbySummary?.hasAnyActivePreference ?? false)
    }

    private var homeSetupBusinessConnected: Bool {
        (standbySummary?.businessesCovered ?? 0) > 0
    }

    private var homeSetupNotificationsReachable: Bool {
        let p = lastPushPermissionStatus.lowercased()
        return p == "authorized" || p == "provisional" || p == "ephemeral"
    }

    /// First incomplete checklist step, or `-1` if all three are satisfied.
    private var homeSetupHighlightStepIndex: Int {
        if !homeSetupBusinessConnected { return 0 }
        if !standbyConfigured { return 1 }
        if !homeSetupNotificationsReachable { return 2 }
        return -1
    }

    private var homeSetupChecklistHeadline: String {
        switch homeSetupHighlightStepIndex {
        case 0:
            return "Connect to a business"
        case 1:
            return "Set your standby preferences"
        case 2:
            let p = lastPushPermissionStatus.lowercased()
            if p == "denied" {
                return "Opening alerts are off"
            }
            return "Turn on opening alerts"
        default:
            return "You’re ready for openings"
        }
    }

    private var homeSetupPrimaryActionTitle: String {
        switch homeSetupHighlightStepIndex {
        case 0:
            return "Find businesses"
        case 1:
            return "Set up standby"
        case 2:
            return "Notification settings"
        default:
            return "View openings"
        }
    }

    private func runHomeSetupPrimaryAction() {
        switch homeSetupHighlightStepIndex {
        case 0:
            PFHaptics.lightImpact()
            env.customerNavigation.selectedTab = .find
        case 1:
            env.customerNavigation.open(.standbyStatus)
        case 2:
            env.customerNavigation.open(.notificationSettings)
        default:
            PFHaptics.lightImpact()
            env.customerNavigation.openOffersInbox()
        }
    }

    private var greetingLine: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5 ..< 12: return "Good morning"
        case 12 ..< 17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var homeSpotlight: (offer: OfferInboxItem, status: CustomerOfferDisplayStatus)? {
        homeSpotlightPick(from: loadedOffers)
    }

    private var homeActivityRows: [CustomerHomeActivityRowModel] {
        activityPreview.map { item in
            let kind = customerActivityDisplayKind(rawKind: item.kind)
            let rawDetail = customerActivityDetailLine(for: item)
            let detail = rawDetail.map { PFCustomerFacingErrorCopy.sanitizeCustomerMessage($0) }
            return CustomerHomeActivityRowModel(
                id: item.id,
                title: kind.title,
                detail: detail,
                relativeTime: DateFormatterPF.relative(item.occurredAt)
            )
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: PFCustomerShellMetrics.sectionSpacing) {
                    CustomerHomeHeader(greeting: greetingLine, isSignedIn: env.sessionStore.isSignedIn)
                        .customerAppearAnimation(staggerIndex: 0)

                    if env.sessionStore.isSignedIn {
                        PFEmberHero(
                            overline: "Home",
                            title: "Get earlier appointments",
                            subtitle: "Claim openings from businesses you trust before they are gone."
                        )
                        .customerAppearAnimation(staggerIndex: 1)

                        signedInContent
                    }
                }
                .padding(.horizontal, PFCustomerShellMetrics.horizontalPadding)
                .padding(.top, 24)
                .padding(.bottom, PFCustomerShellMetrics.tabBarContentInset)
            }
            .refreshable {
                await refresh(kind: .userPull)
            }
            .background(PFScreenBackground())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
        }
        .tint(PFColor.ember)
        .task(id: env.sessionStore.userId) {
            homeInitialRefreshFinished = false
            await refresh(kind: .initial)
            homeInitialRefreshFinished = true
        }
        .onChange(of: scenePhase) { oldPhase, newPhase in
            guard newPhase == .active, oldPhase != .active else { return }
            guard env.sessionStore.isSignedIn, homeInitialRefreshFinished else { return }
            Task { await refresh(kind: .sceneBecameActive) }
        }
        .onChange(of: env.customerNavigation.selectedTab) { oldTab, newTab in
            guard newTab == .home, oldTab != .home else { return }
            guard env.sessionStore.isSignedIn, homeInitialRefreshFinished else { return }
            Task { await refresh(kind: .sceneBecameActive) }
        }
    }

    @ViewBuilder
    private var signedInContent: some View {
        if loading && loadedOffers.isEmpty {
            PFCustomerLoadingState(
                title: "Loading your home…",
                message: "Checking openings and standby status.",
                compact: false
            )
            .padding(.top, 8)
            .customerAppearAnimation(staggerIndex: 2)
        } else if let loadError {
            PFErrorMoment(
                title: "Couldn’t load your latest updates",
                message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(loadError),
                actionTitle: "Reload home",
                action: { Task { await refresh(kind: .initial) } },
                secondaryTitle: "View openings",
                secondaryAction: { env.customerNavigation.openOffersInbox() }
            )
            .customerAppearAnimation(staggerIndex: 2)
        } else {
            CustomerHomeSetupChecklistCard(
                businessesConnected: homeSetupBusinessConnected,
                standbyConfigured: standbyConfigured,
                notificationsReachable: homeSetupNotificationsReachable,
                highlightStepIndex: homeSetupHighlightStepIndex,
                headline: homeSetupChecklistHeadline,
                primaryActionTitle: homeSetupPrimaryActionTitle,
                onPrimary: { runHomeSetupPrimaryAction() }
            )
            .customerAppearAnimation(staggerIndex: 2)

            homeHeroBlock
                .customerAppearAnimation(staggerIndex: 3)

            CustomerStandbyStatusCard(
                isActive: standbyConfigured,
                onSetup: {
                    env.customerNavigation.open(.standbyStatus)
                }
            )
            .customerAppearAnimation(staggerIndex: 4)

            CustomerRecentActivityCard(
                rows: homeActivityRows,
                onSeeAll: {
                    PFHaptics.lightImpact()
                    env.customerNavigation.open(.activity)
                }
            )
            .customerAppearAnimation(staggerIndex: 5)
        }
    }

    @ViewBuilder
    private var homeHeroBlock: some View {
        if let pick = homeSpotlight {
            CustomerOfferSpotlightCard(offer: pick.offer, displayStatus: pick.status) {
                env.customerNavigation.routeToOffersTab(offerId: pick.offer.id, openSlotId: nil)
            }
        }
    }

    private func refresh(kind: HomeRefreshKind = .initial) async {
        guard env.sessionStore.isSignedIn else {
            loadedOffers = []
            activityPreview = []
            standbySummary = nil
            notificationReadiness = nil
            lastPushPermissionStatus = "unknown"
            loading = false
            loadError = nil
            homeRefreshInFlight = false
            return
        }

        if homeRefreshInFlight { return }
        homeRefreshInFlight = true
        defer { homeRefreshInFlight = false }

        if kind == .initial {
            loading = true
        }
        defer {
            if kind == .initial {
                loading = false
            }
        }

        if kind != .sceneBecameActive {
            loadError = nil
        }

        let push = await Self.queryPushPermissionStatus()
        lastPushPermissionStatus = push

        let hadOffers = !loadedOffers.isEmpty

        do {
            let offers = try await env.apiClient.get("/v1/customers/me/offers", as: OfferInboxResponse.self)
            loadedOffers = offers.offers
            loadError = nil
        } catch {
            if kind == .sceneBecameActive, hadOffers {
                // Keep inbox + error out of the way when silently refreshing after Settings.
            } else {
                loadError = APIErrorCopy.message(for: error)
                loadedOffers = []
            }
        }

        do {
            let status = try await env.apiClient.getStandbyStatus(pushPermissionStatus: push)
            standbySummary = status.summary
            notificationReadiness = status.notificationReadiness
        } catch {
            if kind != .sceneBecameActive {
                standbySummary = nil
                notificationReadiness = nil
            }
        }

        if let activity = try? await env.apiClient.getCustomerActivityFeed(pushPermissionStatus: push) {
            activityPreview = Array(activity.items.prefix(2))
        } else if kind != .sceneBecameActive {
            activityPreview = []
        }
    }

    private static func queryPushPermissionStatus() async -> String {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return "authorized"
        case .denied:
            return "denied"
        case .notDetermined:
            return "not_determined"
        @unknown default:
            return "unknown"
        }
    }
}
