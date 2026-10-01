# STREAMLINED PROJECT BLUEPRINT (DONOR ➔ CENTRAL HOSPITAL ➔ ADMIN)
## Blood Donation & Emergency Donor Management System (MERN Stack)

**Project Core**: Centralized 3-Pillar Ecosystem  
**Target Nodes**: 🩸 Voluntary Donor | 🏥 Central Hospital & Blood Bank | 👨‍💼 System Admin  
**Primary Hub**: City Central Hospital & Blood Bank  
**Special Automation**: 🤖 Automated 90-Day Eligibility Re-Engagement Engine  
**Geospatial Layer**: 🗺️ OpenStreetMap / Leaflet Interactive Mapping Engine  

---

## 📌 1. THE 3-PILLAR ECOSYSTEM OVERVIEW

```
  ┌──────────────────┐    🤖 Auto 90-Day Eligibility Invitation  ┌──────────────────────┐
  │                  │ ◄──────────────────────────────────────── │                      │
  │  🩸 VOLUNTARY        🚨 Hospital Emergency Request Alert    │  🏥 CENTRAL HOSPITAL │
  │      DONOR       │ ────────────────────────────────────────► │   & BLOOD BANK       │
  │                  │         Visits Hospital & Donates         │                      │
  └──────────────────┘                                           └──────────────────────┘
            │                                                               │
            │ Logs Activity                                 Manages Inventory
            ▼                                                               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                👨‍💼 SYSTEM ADMIN                                       │
  │                Monitors Analytics, Stock Levels, & User Credentials                  │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ 2. GEOSPATIAL MAP INTEGRATION: KAUN SA ROLE KAISE USE KAREGA?

| Role | Map Usage Purpose & Features | Visual Markers Seen |
| :--- | :--- | :--- |
| 🩸 **VOLUNTARY DONOR** | Central Hospital ki exact location (`🟢 Green Pin`) aur distance ($3.2\text{ km}$) dekhna aur wahan pahunchne ka rasta trace karna. | 🟢 Central Hospital Pin<br>🚨 Active Emergency Dispatch Pin |
| 🏥 **CENTRAL HOSPITAL** | Emergency Request dispatch karte waqt dekhna ki Central Hospital ke 5-10 km radius me kitne **Available Compatible Donors (`🔴 Red Pins`)** hain. | 🔴 Available Donors Pins<br>🟢 Hospital Central Hub |
| 👨‍💼 **SYSTEM ADMIN** | Complete city-wide geospatial overview dekhna (Donors density, active emergency alerts, central blood bank location). | 🟢 Hospital Node<br>🔴 Donor Clusters<br>🚨 Emergency Pulsing Pins |

---

### 📱 Detailed Role Breakdown for Map Usage:

#### 1. 🩸 **Donor Role ke Liye Map Use**:
* **Hospital Route Guidance**: Alert milne par donor map par Central Hospital ki exact location aur distance dekh sakta hai.
* **Privacy Safe**: Donor ka personal home address public me show nahi hota; unka area radius circle me dikhta hai.

#### 2. 🏥 **Central Hospital Staff ke Liye Map Use**:
* **Donor Coverage Radius View**: Emergency request dispatch karte waqt hospital staff map par dekh sakti hai ki 5 km / 10 km / 20 km radius me kitne voluntary donors available hain.

#### 3. 👨‍💼 **System Admin ke Liye Map Use**:
* **City-wide Geographic Overview**: Admin map par live city density aur emergency activity monitoring karta hai.

---

## 🔄 3. STEP-BY-STEP END-TO-END WORKFLOW

### **STEP 1: Donor Registration & Eligibility Setup**
1. **Registration**: Voluntary Donor registers with Name, Email, Password, Phone, Blood Group ($A^+, A^-, B^+, B^-, O^+, O^-, AB^+, AB^-$), City, and Geo-coordinates (Lat/Lng).
2. **Availability Toggle**: Donor sets status to **`Available 🟢`** or **`Busy 🔴`**.
3. **90-Day Recovery Timer**: System automatically tracks the 90-day post-donation recovery interval.

---

### **STEP 2: 🤖 AUTOMATED 90-DAY ELIGIBILITY INVITATION**
1. **Automated Background Checker**: When a donor completes their 90-day recovery gap ($\text{Today} - \text{lastDonationDate} \ge 90 \text{ Days}$):
2. **Automatic Notification Dispatch**: The system automatically dispatches an invitation alert to the donor:  
   *"🎉 Congratulations! Your 90-day recovery period is complete. You are now eligible to donate blood again! City Central Hospital welcomes your contribution."*
3. **Dashboard Widget Update**: On the Donor Dashboard, the recovery countdown widget automatically transforms into:  
   **`🎉 ELIGIBLE TO DONATE NOW! 🟢`** with a 1-click button: **`[🩸 Schedule Donation at Central Hospital]`**.

---

### **STEP 3: Central Hospital Inventory Tracking**
1. **Live 8-Group Stock Visualizer**: City Central Hospital Medical Staff manages live inventory gauges for all 8 blood groups ($A^+, A^-, B^+, B^-, O^+, O^-, AB^+, AB^-$).
2. **Stock Monitoring**: Stock statuses are auto-categorized:
   - `Sufficient 🟢` ($>15$ units)
   - `Low Stock 🟡` ($5-15$ units)
   - `Critical Shortage 🔴` ($<5$ units)

---

### **STEP 4: Hospital Dispatches Emergency Request**
1. When stock drops to critical levels or an emergency ICU patient arrives, Central Hospital staff opens the **Emergency Dispatcher**.
2. Staff enters: Blood Group Required (e.g. $O^-$), Units Needed (e.g. $3$), Urgency Level (`Normal`, `Urgent`, `● Critical`), and Required Date/Time.
3. Hospital clicks **`[Dispatch Emergency Request 🚨]`**.

---

### **STEP 5: Smart RBC Donor Matching & Alert Broadcast**
1. **RBC Compatibility Matching Engine**: System filters eligible donors based on strict biological Red Blood Cell transfusion rules (e.g., $O^-$ donors for $O^-$ or $O^+$ requests).
2. **Haversine Distance & Priority Scoring**: Calculates distance between Hospital and Donor, sorting donors by **Priority Score**.
3. **Socket.IO Push Alert**: Matched donors receive an instant notification:  
   *"🚨 CRITICAL ALERT: City Central Hospital needs O- Blood (3 Units, 3.2 km away)"*.

---

### **STEP 6: Donor Responds & Visits Central Hospital**
1. Donor clicks on notification or automated 90-day invitation to open Request Details Page.
2. Donor clicks **`[🩸 I'm Available to Donate at Hospital]`**.
3. The **Live Request Tracker** updates progress for hospital staff (e.g., `3/4 Units Arranged 🟢`).
4. Donor travels to City Central Hospital.

---

### **STEP 7: Hospital Collects Blood & Auto-Updates Stock**
1. Donor arrives at the Central Hospital reception.
2. Medical staff opens **Arriving Donors List** and clicks **`[Verify & Mark Blood Collected 🛡️]`**.
3. **Automated Inventory Update**: Central Hospital stock for that blood group automatically increments ($+1$ Unit).
4. **Digital Certificate & Recovery Reset**: System resets Donor's `lastDonationDate` to today, restarts the 90-day countdown timer, and generates a downloadable Donation Certificate.

---

### **STEP 8: Admin Monitoring & Analytics Oversight**
1. System Admin logs into the **Admin Dashboard**.
2. **KPI Overview**: Displays total platform metrics (Total Voluntary Donors, Total Blood Units in Central Bank, Active Emergency Dispatches, Automated 90-Day Invitations Sent).
3. **Recharts Supply/Demand Graphs**: Visual bar/line charts showing demand trends per blood group.
4. **User & Hospital Control**: Admin verifies hospital credentials and manages platform users.

---

## 👥 4. FOCUSED ROLE PERMISSION MATRIX

| System Feature / Action | 🩸 VOLUNTARY DONOR | 🏥 CENTRAL HOSPITAL | 👨‍💼 SYSTEM ADMIN |
| :--- | :---: | :---: | :---: |
| Account Registration & Profile Management | ✅ | ✅ | ✅ |
| Toggle Availability (`Available 🟢` / `Busy 🔴`) | **✅** | ❌ | ❌ |
| View Interactive Leaflet Map & Custom Pins | **✅** | **✅** | **✅** |
| Automated 90-Day Eligibility Invitation | **🤖 (System Auto)** | ❌ | ❌ |
| Manage Central Blood Inventory (8 Stock Gauges) | ❌ | **✅ (Exclusive)** | ❌ |
| **Dispatch Emergency Blood Request to Donors** | ❌ | **✅ (Exclusive)** | ❌ |
| Respond to Emergency Alert / 90-Day Invitation | **✅** | ❌ | ❌ |
| Verify Arriving Donor & Auto-Increment Inventory | ❌ | **✅ (Exclusive)** | ❌ |
| View Donation Passport & Download Certificates | **✅** | ❌ | ❌ |
| Platform Analytics & Recharts Graphs | ❌ | ❌ | **✅ (Exclusive)** |
| 1-Click Demo Role Switcher (For Evaluation) | ✅ | ✅ | ✅ |

---

## 🗄️ 5. STREAMLINED DATABASE SCHEMAS

```javascript
// 1. User Schema (Single Auth for all 3 roles)
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['DONOR', 'HOSPITAL', 'ADMIN'], default: 'DONOR' },
  phone: String,
  city: String,
  address: String,
  location: { lat: Number, lng: Number }
}, { timestamps: true });

// 2. Donor Profile Schema with Geo-Coordinates & 90-Day Trigger
const DonorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  lastDonationDate: Date,
  nextEligibleDate: Date,
  autoInvitationSent: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  totalDonations: { type: Number, default: 0 },
  location: { lat: Number, lng: Number }
});

// 3. Central Hospital Inventory Schema
const HospitalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  hospitalName: { type: String, default: "City Central Hospital & Blood Bank" },
  licenseNumber: { type: String, default: "HOSP-8849-VERIFIED" },
  location: { lat: { type: Number, default: 30.901 }, lng: { type: Number, default: 75.857 } },
  inventory: [{
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    units: { type: Number, default: 15 },
    lastUpdated: { type: Date, default: Date.now }
  }]
});

// 4. Emergency Blood Request Schema
const BloodRequestSchema = new Schema({
  requestId: { type: String, unique: true },
  hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
  bloodGroup: String,
  unitsRequired: Number,
  unitsFulfilled: { type: Number, default: 0 },
  requestType: { type: String, enum: ['EMERGENCY_DISPATCH', 'AUTO_90DAY_REENGAGEMENT'], default: 'EMERGENCY_DISPATCH' },
  urgency: { type: String, enum: ['NORMAL', 'URGENT', 'CRITICAL'], default: 'CRITICAL' },
  status: { type: String, enum: ['ACTIVE', 'FULFILLED', 'CANCELLED'], default: 'ACTIVE' },
  respondedDonors: [{
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor' },
    status: { type: String, enum: ['NOTIFIED', 'ACCEPTED', 'COLLECTED'] },
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
```
