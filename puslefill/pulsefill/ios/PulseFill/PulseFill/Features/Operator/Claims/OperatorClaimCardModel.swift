import Foundation

struct OperatorClaimCardModel: Identifiable, Hashable {
    let openSlotId: String
    let claimId: String
    let claimStatus: String
    let slotStatus: String
    let providerName: String?
    let serviceId: String?
    let startsAt: String
    let endsAt: String
    let customerId: String

    var id: String { claimId }

    static func from(row: StaffOpenSlotListRow) -> OperatorClaimCardModel? {
        guard let wc = row.winningClaim else { return nil }
        return OperatorClaimCardModel(
            openSlotId: row.id,
            claimId: wc.id,
            claimStatus: wc.status,
            slotStatus: row.status,
            providerName: row.providerNameSnapshot,
            serviceId: row.serviceId,
            startsAt: row.startsAt,
            endsAt: row.endsAt,
            customerId: wc.customerId
        )
    }

    func customerLabel() -> String {
        let id = customerId
        if id.count <= 14 { return id }
        return "\(id.prefix(4))…\(id.suffix(4))"
    }
}
