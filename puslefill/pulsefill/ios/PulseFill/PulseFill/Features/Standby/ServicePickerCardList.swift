import SwiftUI

struct ServiceOption: Identifiable, Equatable {
    let id: String
    let name: String
    let description: String?
}

struct ServicePickerCardList: View {
    let services: [ServiceOption]
    @Binding var selectedOptionId: String

    var body: some View {
        VStack(spacing: 10) {
            ForEach(services) { service in
                let isSelected = selectedOptionId == service.id
                Button {
                    selectedOptionId = service.id
                } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(service.name)
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(PFColor.textPrimary)

                                if let description = service.description, !description.isEmpty {
                                    Text(description)
                                        .font(.system(size: 13, weight: .regular))
                                        .foregroundStyle(PFColor.textSecondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }

                            Spacer(minLength: 8)

                            if isSelected {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 22, weight: .semibold))
                                    .foregroundStyle(PFColor.primary)
                            }
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(isSelected ? PFColor.primary.opacity(0.10) : PFSurface.card)
                    .overlay(
                        RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                            .stroke(isSelected ? PFColor.primary.opacity(0.35) : PFColor.divider, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
    }
}
