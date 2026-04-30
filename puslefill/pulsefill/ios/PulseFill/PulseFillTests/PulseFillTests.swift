//
//  PulseFillTests.swift
//  PulseFillTests
//

import Testing
@testable import PulseFill

struct PulseFillTests {
    @Test func notificationPayloadReadsNestedDictionaryData() {
        let payload = NotificationRoutePayload(userInfo: [
            "data": [
                "type": "CUSTOMER_OFFER_SENT",
                "offer_id": "offer-1",
                "open_slot_id": "slot-1",
            ],
        ])

        #expect(payload.routeKey == "customer_offer_sent")
        #expect(payload.offerId == "offer-1")
        #expect(payload.openSlotId == "slot-1")
    }

    @Test func notificationPayloadReadsJsonStringData() {
        let payload = NotificationRoutePayload(userInfo: [
            "data": #"{"kind":"booking_confirmed","claimId":"claim-1"}"#,
        ])

        #expect(payload.routeKey == "booking_confirmed")
        #expect(payload.claimId == "claim-1")
    }
}
