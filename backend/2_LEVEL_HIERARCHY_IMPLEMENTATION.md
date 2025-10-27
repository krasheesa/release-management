# 2-Level System Hierarchy Implementation

## Overview
Implemented a strict 2-level hierarchy system where:
- **Systems** (root level) can have **Subsystems** (second level)
- **Subsystems** cannot have further subsystems (no sub-subsystems)

## Frontend Changes ✅

### 1. SystemDetail.js - Conditional Subsystem Section
- **Change**: Hide subsystem management UI when viewing a subsystem
- **Logic**: Only show "Subsystems" section if `!system.parent_id` (root system)
- **Result**: Subsystems don't show "Create Subsystem" button or subsystem list

### 2. SystemForm.js - Already Enforced
- **Existing**: Parent dropdown only shows root systems (no `parent_id`)
- **Existing**: Auto-selects parent when creating subsystem
- **Result**: User cannot accidentally create 3+ level hierarchy

### 3. SystemManager.js - Already Enforced  
- **Existing**: Only shows root systems in main list
- **Existing**: Expansion shows subsystems with view buttons
- **Result**: Clean 2-level navigation structure

## Backend Changes ✅

### 1. SystemHandler.go - API Validation

#### CreateSystem Validation:
```go
// Validate 2-level hierarchy: if parent_id is provided, ensure the parent is a root system
if system.ParentID != nil && *system.ParentID != "" {
    var parent models.System
    if err := database.DB.First(&parent, "id = ?", *system.ParentID).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Parent system not found"})
        return
    }
    
    // Check if the parent system already has a parent (is a subsystem)
    if parent.ParentID != nil && *parent.ParentID != "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot create subsystem under a subsystem. Only 2-level hierarchy is allowed (System -> Subsystem)"})
        return
    }
}
```

#### UpdateSystem Validation:
- Same parent validation as CreateSystem
- Additional check: Prevent moving systems with subsystems under other systems
- Prevents creating orphaned 3+ level structures

#### DeleteSystem Validation:
- Check if system has subsystems before deletion
- Prevents accidental data loss
- Forces user to delete subsystems first

### 2. System.go Model - Database Level Validation

#### BeforeCreate Hook:
```go
// Validate 2-level hierarchy constraint
if s.ParentID != nil && *s.ParentID != "" {
    var parent System
    if err := tx.First(&parent, "id = ?", *s.ParentID).Error; err != nil {
        return err
    }
    if parent.ParentID != nil && *parent.ParentID != "" {
        return gorm.ErrInvalidValue
    }
}
```

#### BeforeUpdate Hook:
- Same validation as BeforeCreate
- Ensures data integrity during updates

## Hierarchy Enforcement Summary

### ✅ **Frontend Guards:**
1. UI only shows subsystem creation for root systems
2. Parent dropdown filtered to root systems only  
3. Navigation structure enforces 2-level view

### ✅ **Backend Guards:**
1. API validation in Create/Update endpoints
2. Database model validation hooks
3. Delete protection for systems with subsystems

### ✅ **Error Messages:**
- `"Cannot create subsystem under a subsystem. Only 2-level hierarchy is allowed (System -> Subsystem)"`
- `"Cannot move system under a subsystem. Only 2-level hierarchy is allowed (System -> Subsystem)"`
- `"Cannot move a system with subsystems under another system. Only 2-level hierarchy is allowed"`
- `"Cannot delete system with subsystems. Please delete subsystems first"`

## Navigation Flow

```
Systems Manager → [Root Systems Only]
├── System A
│   ├── [Expand] → Subsystem A1, A2 (View buttons only)
│   └── [View] → System A Detail
│       ├── System A Builds
│       ├── System A Subsystems (CRUD available)
│       └── [Create Subsystem] → Form (Parent=A, fixed)
└── System B
    ├── [Expand] → No subsystems  
    └── [View] → System B Detail
        ├── System B Builds
        └── No Subsystem section (B has no subsystems)

Subsystem A1 Detail → 
├── Subsystem A1 Builds
└── NO Subsystem section (A1 cannot have subsystems)
```

## Benefits of 2-Level Hierarchy

1. **Simplified Navigation**: Clear system → subsystem structure
2. **Data Integrity**: No complex nested relationships
3. **Performance**: Faster queries with limited depth
4. **User Experience**: Intuitive interface without complexity
5. **Maintainability**: Easier to understand and modify

The implementation provides robust validation at multiple levels (UI, API, Database) to ensure the 2-level hierarchy constraint is never violated.