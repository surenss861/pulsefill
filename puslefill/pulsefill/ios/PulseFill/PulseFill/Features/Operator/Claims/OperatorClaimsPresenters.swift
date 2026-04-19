import Foundation

enum OperatorClaimsPresenters {
    static func isAwaiting(_ claim: OperatorClaimCardModel) -> Bool {
        claim.slotStatus == "claimed" && claim.claimStatus == "won"
    }

    static func isConfirmed(_ claim: OperatorClaimCardModel) -> Bool {
        claim.slotStatus == "booked" || claim.claimStatus == "confirmed"
    }

    static func bannerTitle(for claim: OperatorClaimCardModel) -> String {
        if isAwaiting(claim) {
            "ACTION NEEDED · CONFIRM BOOKING"
        } else {
            "COMPLETE"
        }
    }

    static func countAwaiting(_ claims: [OperatorClaimCardModel]) -> Int {
        claims.filter(isAwaiting).count
    }

    static func countConfirmed(_ claims: [OperatorClaimCardModel]) -> Int {
        claims.filter(isConfirmed).count
    }
}
