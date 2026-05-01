/// One row of signed-out pass rotation — no operator language.
struct AuthAppointmentPreview: Equatable {
    let service: String
    let clinic: String
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
            clinic: "Yorkville Clinic",
            pillDay: "Today",
            scheduleEyebrow: "TODAY",
            time: "2:30 PM",
            status: "Ready to claim"
        ),
        AuthAppointmentPreview(
            service: "Physio consult",
            clinic: "Midtown Wellness",
            pillDay: "Tomorrow",
            scheduleEyebrow: "TOMORROW",
            time: "11:15 AM",
            status: "Earlier time found"
        ),
        AuthAppointmentPreview(
            service: "Skin treatment",
            clinic: "Queen West Studio",
            pillDay: "Friday",
            scheduleEyebrow: "FRI",
            time: "4:00 PM",
            status: "Opening available"
        ),
    ]
}
