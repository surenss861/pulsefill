import Combine
import Foundation

@MainActor
final class BusinessOperatorCustomersViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published private(set) var loadState: LoadState = .idle
    @Published private(set) var didLoadOnce = false
    @Published private(set) var invites: [StaffCustomerInviteListItemDTO] = []

    @Published var flashMessage: String?
    /// After POST create succeeds — lets the UI offer copy-token / URL affordances.
    @Published var inviteJustCreatedForCopy: StaffCustomerInviteListItemDTO?

    private let businessAPI: BusinessOperatorAPIClient

    init(businessAPI: BusinessOperatorAPIClient) {
        self.businessAPI = businessAPI
    }

    var pendingInvites: [StaffCustomerInviteListItemDTO] {
        invites.filter { $0.status.lowercased() == "pending" }
            .sorted { $0.createdAt > $1.createdAt }
    }

    /// Accepted connects with a resolved customer id — treat as “Customers you work with.”
    var connectedInvites: [StaffCustomerInviteListItemDTO] {
        invites.filter {
            $0.status.lowercased() == "accepted" && $0.acceptedByCustomerId?.isEmpty == false
        }
        .sorted { ($0.acceptedAt ?? $0.createdAt) > ($1.acceptedAt ?? $1.createdAt) }
    }

    /// Subset where standby / reachability is in play (derived from server onboarding key).
    var standbySpotlightInvites: [StaffCustomerInviteListItemDTO] {
        let keys: Set<String> = [
            "accepted_standby_active",
            "accepted_limited_reach",
            "accepted_not_reachable",
            "accepted_needs_standby",
        ]
        return connectedInvites.filter { keys.contains($0.onboardingStatus.key) }
    }

    func load() async {
        if !didLoadOnce { loadState = .loading }
        do {
            let res = try await businessAPI.listOperatorCustomerInvites()
            invites = res.invites
            loadState = .loaded
            didLoadOnce = true
        } catch {
            let msg = APIErrorCopy.message(for: error)
            if !didLoadOnce {
                loadState = .failed(msg)
            } else {
                flashMessage = msg
                loadState = .loaded
            }
        }
    }

    func refresh() async {
        await load()
    }

    @discardableResult
    func createInvite(email: String, customerName: String?) async -> Bool {
        do {
            let body = try CreateStaffCustomerInviteBody(trimmedEmail: email, customerName: customerName)
            let created = try await businessAPI.createCustomerInvite(body)
            inviteJustCreatedForCopy = created
            await reloadAfterInviteMutation()
            if inviteJustCreatedForCopy != nil {
                let id = inviteJustCreatedForCopy?.id
                if let id, let synced = invites.first(where: { $0.id == id }) {
                    inviteJustCreatedForCopy = synced
                }
            }
            return true
        } catch let err as CreateStaffCustomerInviteBody.ValidationError {
            flashMessage = err.localizedDescription
            return false
        } catch {
            flashMessage = OperatorMutationFriendlyCopy.createInviteFailed(error)
            return false
        }
    }

    private func reloadAfterInviteMutation() async {
        do {
            let res = try await businessAPI.listOperatorCustomerInvites()
            invites = res.invites
            loadState = .loaded
            didLoadOnce = true
            OperatorMutationNotifier.postCustomerInvitesChanged()
        } catch {
            let msg = APIErrorCopy.message(for: error)
            flashMessage = msg
        }
    }

    func clearInviteCopyCue() {
        inviteJustCreatedForCopy = nil
    }

    func revokePendingInvite(id: String) async {
        do {
            _ = try await businessAPI.revokeCustomerInvite(inviteId: id)
            flashMessage = "Invite revoked."
            await load()
        } catch {
            flashMessage = OperatorMutationFriendlyCopy.revokeInviteFailed(error)
        }
    }
}
