//
//  Item.swift
//  puslefill
//
//  Created by suren sureshkumar on 2026-04-16.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
