# RentPulse - Room & Tenant Management CRM

**RentPulse** is a modern, fast, responsive Property & Tenant CRM built specifically for room partition, flat, and bedspace management in Dubai (e.g. Al Barsha, Deira), inspired directly by the **Vienna - Partition** spreadsheet.

## 🚀 Features

- **Exact Smart Spreadsheet Interface**:
  - Golden header, mint-green rows, and black section dividers (`HALL` & `ROOM`).
  - Columns: `Sno`, `Tenants`, `Place` (Karnataka, Indonesia, Malayali, Tamil, Srilankan), `Deposit` (Advance), `Joining date`, `Stay Duration`, `Rent / Sep-26 Status`, `Cu/k` (Cupboard Key), `D/k` (Door Key), `Remarks`, `Partition` (P1–P8), and `Actions`.
- **Automated 30-Day Rent Cycle & Notification Engine**:
  - Tracks 30 days from tenant joining date or last paid date.
  - Highlights **Overdue**, **Due Today**, and **Upcoming** rent.
  - Slide-out alert center with notification badge counter.
  - **1-Click Call**: Dials tenant phone number directly.
  - **1-Click WhatsApp**: Opens WhatsApp with a pre-formatted polite rent reminder specifying their flat, partition number, and AED amount.
- **Hierarchical Management**:
  - **Location** (e.g. *Barsha*, *Deira*, *Al Nahda*)
  - **Flats** (e.g. *Vienna - Partition*, *Barsha 1 - Flat 204*)
  - **Sections** (`HALL`, `ROOM`, `MASTER`)
  - **Partitions** (`p1` to `p8`)
  - Full access to add, edit, or rename locations and flats at any time.
- **Rapid New Tenant Onboarding**:
  - Quick "+ Add Tenant" form with instant validation, deposit logging, key assignments, and entry into the sheet.
- **Financial & Occupancy Metrics**:
  - Real-time counters for Active Tenants, Deposits Held (AED), Monthly Expected Rent, and Key Handover status.
- **Excel & Backup Export**:
  - 1-Click "Export to Excel" (.xlsx) with formatting matching your sheet.
  - Local persistence via browser storage (data never resets on refresh).

## 🛠️ How to Run Locally

```bash
# In this directory:
cmd /c "npm install"

# Start the dev server:
cmd /c "npm run dev"
```

Open `http://localhost:3000/` in your browser.
A ready-to-use spreadsheet file `VIENNA_PARTITIION.xlsx` is also included in this root directory.
