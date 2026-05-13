/// One row of signed-out pass rotation — no operator language.
struct AuthAppointmentPreview: Equatable {
    let service: String
    let businessName: String
    /// Top-right capsule (e.g. Today, Tomorrow, Friday).
    let pillDay: String
    /// Small caps above the time (e.g. TODAY, TOMORROW, FRI).
    let scheduleEyebrow: String
    let time: String
    /// Status chip only — not a CTA.
    let status: String

    static let rotationExamples: [AuthAppointmentPreview] = [
        AuthAppointmentPreview(
            service: "Dental cleaning",
            businessName: "Yorkville Wellness",
            pillDay: "Today",
            scheduleEyebrow: "Today",
            time: "2:30 PM",
            status: "Maya claimed · Recover $185"
        ),
        AuthAppointmentPreview(
            service: "Physio consult",
            businessName: "Midtown Wellness",
            pillDay: "Tomorrow",
            scheduleEyebrow: "Tomorrow",
            time: "11:15 AM",
            status: "Waiting on business"
        ),
        AuthAppointmentPreview(
            service: "Skin treatment",
            businessName: "Queen West Studio",
            pillDay: "Friday",
            scheduleEyebrow: "Fri",
            time: "4:00 PM",
            status: "Opening available"
        ),
    ]
}
