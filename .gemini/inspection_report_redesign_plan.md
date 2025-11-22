# Car Inspection Report Redesign Plan

## Overview
Redesign the car inspection report page to match the Encar style shown in the reference images, with precise repair/replacement markers on the car diagram using real API data.

## Reference Analysis

### From Uploaded Images:

1. **Image 1 - Driving Information**
   - Chronological ownership periods
   - Location, owner type, distance driven per period
   - Clean timeline layout

2. **Image 2 - Vehicle History Information**
   - Manufacturing company, model, rating
   - Year of manufacture, mileage
   - Production date, country of origin
   - Shipping information, fuel consumption

3. **Image 3 - Attention History**
   - Recall required (3 cases)
   - Period of non-subscription to insurance
   - Total loss, flooding, theft status
   - For commercial use, police cars, rental cars

4. **Image 4 - Inspection Diagram**
   - Top-view car diagram
   - Color-coded markers:
     - 🔴 Red (교환) = Replaced/Exchanged parts
     - 🔵 Blue (판금/용접) = Repair/Welding
     - 🟠 Orange (부식) = Rust/Corrosion
     - ⚪ Gray (흠집) = Scratches
     - ⚫ Gray (요철) = Dents
     - 🟤 Brown (손상) = Damage
   - Precise positioning on actual parts

5. **Image 5 - Insurance/Maintenance History**
   - Chronological order
   - Insurance claim details (damage to my car)
   - Date of occurrence
   - Cost breakdown: parts, public service, coating
   - General maintenance records

## Implementation Plan

###  1. Page Structure
```tsx
<CarInspectionReport>
  <Header>
    - Car ID, Image
    - Basic Info (Year, Model, Mileage)
  </Header>
  
  <TabsSection>
    <Tab: "Driving Information">
      - Ownership timeline
      - Usage history
    </Tab>
    
    <Tab: "Vehicle History">
      - Manufacturing details
      - Shipping information
      - Specifications
    </Tab>
    
    <Tab: "Inspection Diagram">
      - Car diagram with precise markers
      - Color legend
      - Statistics
    </Tab>
    
    <Tab: "Insurance/Maintenance">
      - Chronological history
      - Claims details
      - Maintenance records
    </Tab>
    
    <Tab: "Attention History">
      - Recalls
      - Insurance gaps
      - Special usage
    </Tab>
  </TabsSection>
</CarInspectionReport>
```

### 2. Data Structure Mapping

#### From API `insurance_v2`:
```typescript
interface Insurance_V2 {
  accident_count: number;
  accident_history: Array<{
    date: string;
    cost_parts: number;
    cost_service: number;
    cost_coating: number;
    type: 'my_damage' | 'other_damage | 'estimate';
  }>;
  ownership_history: Array<{
    from_date: string;
    to_date: string;
    location: string;
    owner_type: string;
    distance_km: number;
  }>;
  recalls?: Array<{
    title: string;
    status: string;
  }>;
  special_usage: {
    commercial: boolean;
    rental: boolean;
    taxi: boolean;
    police: boolean;
  };
}
``

#### From API `inspect`:
```typescript
interface Inspect {
  items: Array<{
    type: { code: string; title: string };
    statusTypes: Array<{
      code: string; // X=exchange, W=weld, A=repair, U=corrosion, S=scratch
      title: string;
    }>;
    attributes: string[];
  }>;
}
```

### 3. Key Components to Create/Update

#### A. `DrivingInformationPanel` (NEW)
- Timeline of ownership periods
- Location, owner type, distance per period
- Chronological order sorting

#### B. `VehicleHistoryPanel` (NEW)
- Manufacturing details from API
- Production/shipping information
- Specifications display

#### C. `AttentionHistoryPanel` (NEW)
- Recall notifications from insurance_v2
- Insurance gap periods
- Special usage indicators (taxi, rental, etc.)

#### D. `InsuranceMaintenancePanel` (UPDATE)
- Format like Encar image 5
- Chronological insurance claims
- Cost breakdown (parts, service, coating)
- Maintenance records

#### E. `CarInspectionDiagram` (UPDATE)
- Already exists but needs:
  - Precise marker positioning (DONE)
  - Better color coding to match Encar
  - Statistics panel (DONE)
  - Better mobile/desktop responsiveness

### 4. Priority Implementation Steps

1. ✅ **Already have**: Precise car diagram with markers
2. 🔄 **Update**: Color legend to match Encar exactly
3. 🆕 **Create**: DrivingInformationPanel
4. 🆕 **Create**: VehicleHistoryPanel
5. 🆕 **Create**: AttentionHistoryPanel
6. 🔄 **Update**: Insurance/maintenance history formatting
7. 🔄 **Update**: Main page layout with tabs
8. 🔄 **Update**: Desktop/mobile responsiveness

### 5. Design Specifications

#### Colors (from Encar):
- Exchange/Replaced: `#EF4444` (Red)
- Repair/Welding: `#3B82F6` (Blue)
- Rust/Corrosion: `#F97316` (Orange)
- Scratches: Color
- Dents: `#6B7280` (Gray)
- Damage: `#92400E` (Brown)
- Good/Normal: `#22C55E` (Green)

#### Typography:
- Headers: 16-18px, semi-bold
- Body: 14px, regular
- Metadata: 12px, text-muted

#### Spacing:
- Section gap: 16-24px
- Item gap: 8-12px
- Mobile padding: 16px
- Desktop padding: 24px

## Next Steps

1. Create the new panel components
2. Update CarInspectionReport.tsx with tab structure
3. Map all real API data to the new panels
4. Ensure desktop + mobile responsiveness
5. Add precise markers to diagram based on inspect data
6. Test with real car data

## Expected Outcome

A professional car report page that:
- ✅ Matches Encar's style and layout
- ✅ Shows precise repairs/replacements on diagram
- ✅ Uses ALL real data from API
- ✅ Works perfectly on desktop AND mobile
- ✅ Has clear chronological organization
- ✅ Provides comprehensive vehicle history
