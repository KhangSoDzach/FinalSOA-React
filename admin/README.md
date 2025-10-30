# Admin Panel - SKYHOME Management System

## Overview
The admin panel provides comprehensive management capabilities for the SKYHOME apartment complex. Unlike the resident interface, administrators have full access to all system data and management functions.

## Key Differences: Admin vs User

### Sidebar Structure
Both admin and user interfaces now share the **same sidebar navigation structure** for consistency:

**Common Navigation:**
- Home
- Bills
- Feedback
- Vehicle Card
- Utilities
- Profile
- Settings

### Access Level Differences

#### **User (Resident) Access:**
- ✅ View personal unit information (Unit 303A)
- ✅ View and pay own bills only
- ✅ Submit feedback for their unit
- ✅ Register own vehicles
- ✅ Request utilities/services for their unit
- ❌ Cannot view other residents' data
- ❌ Cannot modify system settings

#### **Admin Access:**
- ✅ View all 115 apartments across 2 buildings
- ✅ View and manage all 57 residents
- ✅ Access system-wide statistics
- ✅ Manage all bills (generate, track, collect)
- ✅ Handle all feedback/complaints from residents
- ✅ Approve/manage all vehicle registrations
- ✅ Oversee all utility requests
- ✅ Full CRUD operations on all data

## Admin Dashboard Features

### Statistics Overview
The admin home page displays:
- **Total Buildings**: 2 buildings
- **Total Apartments**: 115 apartments
- **Total Residents**: 57 residents

### Property Information
- 618 apartment units total
- 8 penthouse units
- Location: Mai Chi Tho, An Phu Ward, District 2, HCMC
- Unit types:
  - 1 Bedroom: 43.8m²
  - 2 Bedrooms: 55.1 - 74 m²
  - 3 Bedrooms: 88.2 - 97.1 m²
  - Penthouse: 120 - 180 m²

## Admin Pages

### 1. Home (`index.html`)
- System-wide statistics dashboard
- Building and apartment overview
- Property type breakdown
- Quick statistics cards

### 2. Bills Management (`bills.html`)
- View all resident bills
- Generate new bills
- Track outstanding payments ($45,230)
- Monitor paid bills ($89,450)
- Identify overdue accounts (12 units)
- **Admin Advantage**: See all units, not just one

### 3. Feedback Management (`tickets.html`)
- View all resident feedback
- Open tickets: 23
- In progress: 15
- Resolved: 142
- Respond to complaints
- Assign to maintenance team
- **Admin Advantage**: Handle all complaints system-wide

### 4. Vehicle Management (`vehicles.html`)
- Manage all vehicle registrations (87 total)
- Track available parking spots (28 available)
- Approve pending registrations (5 pending)
- Assign parking spaces
- **Admin Advantage**: Control entire parking system

### 5. Utilities Management (`utilities.html`)
- Track all service requests
- Pending: 18 requests
- In progress: 12 requests
- Completed: 256 requests
- Assign maintenance staff
- **Admin Advantage**: Coordinate all maintenance across complex

### 6. Apartments Management (`apartments.html`)
- View all 115 apartments
- Add/Edit/Delete apartment records
- Track occupancy status
- Assign residents to units
- Manage building floor plans

### 7. Buildings Management (`buildings.html`)
- Building A: 60 apartments (12 floors)
- Building B: 55 apartments (11 floors)
- Manage building information

### 8. Profile (`profile.html`)
- Admin account information
- Role: ADMINISTRATOR
- Credentials management

### 9. Settings (`settings.html`)
- System-wide configuration
- User management
- Billing settings
- Notification preferences

## Design Elements

### Color Scheme
**Admin Theme:**
- Primary: Purple (#9c27b0)
- Gradient backgrounds for cards
- Light purple hover effects (#e1bee7)

**User Theme:**
- Primary: Blue (#007bff)
- Standard blue hover effects

### Visual Indicators
- **Admin Panel**: Purple accents, gradient cards
- **User Panel**: Blue accents, simpler design
- Admin pages show aggregate data
- User pages show personal data only

## File Structure
```
admin/
├── index.html              # Admin dashboard
├── bills.html              # All bills management
├── tickets.html            # All feedback management
├── vehicles.html           # All vehicles management
├── utilities.html          # All utilities management
├── apartments.html         # Apartment CRUD operations
├── buildings.html          # Building management
├── profile.html            # Admin profile
├── settings.html           # System settings
├── admin-styles.css        # Admin-specific styling
└── COMPARISON.md           # Detailed comparison document
```

## Key Features

### 1. Consistent Navigation
Both admin and user interfaces share the same navigation structure, making it intuitive for admins who also have user accounts.

### 2. Scope Differentiation
- **User**: "My Bills", "My Feedback", "My Vehicles"
- **Admin**: "All Bills", "All Feedback", "All Vehicles"

### 3. Additional Controls
Admin pages include:
- "Add New" buttons
- Edit/Delete actions
- Approval workflows
- System configuration

### 4. Data Aggregation
Admin dashboard shows:
- Total counts and statistics
- System-wide metrics
- Performance indicators
- Outstanding issues

## Security Notes

### Authentication
- Separate admin login required
- Role-based access control (RBAC)
- Admin credentials stored securely
- Session management with elevated privileges

### Authorization
- Admin role verified on each request
- Audit logging for admin actions
- Restricted endpoints for admin operations
- User data privacy maintained

## Usage

### For Administrators:
1. Login with admin credentials
2. Access full system dashboard
3. Navigate using same menu as users
4. View aggregate data for all residents
5. Perform management operations

### Key Differences from User View:
- Statistics show ALL units, not just one
- Actions affect system-wide data
- CRUD operations available
- Oversight and approval capabilities

## Future Enhancements

### Planned Features:
- Role hierarchy (Super Admin, Building Manager, Staff)
- Advanced analytics and reporting
- Bulk operations (mass bill generation)
- Export data to Excel/PDF
- Real-time notifications
- Mobile admin app
- Audit trail viewer
- Automated billing system

## Technical Details

### Technologies:
- HTML5, CSS3, JavaScript
- Font Awesome icons
- Responsive grid layouts
- CSS gradients and animations

### Browser Support:
- Chrome (recommended)
- Firefox
- Edge
- Safari

## Comparison Summary

| Feature | User | Admin |
|---------|------|-------|
| Navigation Items | 7 (same) | 7 (same) |
| Data Scope | Personal only | System-wide |
| Statistics | Not shown | Dashboard overview |
| CRUD Operations | Limited | Full access |
| Bills View | Own bills | All bills |
| Feedback | Submit own | View/manage all |
| Vehicles | Register own | Manage all |
| Utilities | Request own | Coordinate all |
| Color Theme | Blue | Purple |

---

**Last Updated**: October 25, 2025  
**Version**: 2.0 (Unified Navigation)
