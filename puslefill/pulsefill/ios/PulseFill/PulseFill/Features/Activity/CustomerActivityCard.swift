import SwiftUI

struct CustomerActivityCard: View {
    let item: CustomerActivityItem

    private var kind: CustomerEventKind? {
        CustomerEventKind(rawKind: item.kind)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let kind {
                Text(CustomerStateLabelPresenter.label(for: kind).uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(CustomerStateLabelPresenter.color(for: kind))
            }

            Text(displayTitle)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let detail = item.detail, !detail.isEmpty {
                Text(detail)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }

            if let business = item.businessName, !business.isEmpty {
                Text(business)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
            }
            if let service = item.serviceName, !service.isEmpty {
                Text(service)
                    .font(.system(size: 12))
                    .foregroundStyle(PFColor.textSecondary)
            }

            Text(DateFormatterPF.medium(item.occurredAt))
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)

            if let startsAt = item.startsAt {
                Text(DateFormatterPF.dateTimeRange(start: startsAt, end: item.endsAt))
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }

    private var displayTitle: String {
        if let kind, item.title.isEmpty {
            return CustomerEventCopy.fallbackTitle(for: kind)
        }
        return item.title
    }
}
