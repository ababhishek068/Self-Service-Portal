import { Navigate, Route, Routes } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { MainContent } from '@/components/layout/MainContent'
import { MobileNav } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { LayoutProvider } from '@/context/LayoutContext'
import { useAuth } from '@/hooks/useAuth'
import { Login } from '@/pages/auth/Login'
import { ApprovalDetail } from '@/pages/approvals/ApprovalDetail'
import { ApprovedDocuments } from '@/pages/approvals/ApprovedDocuments'
import { PendingApprovals } from '@/pages/approvals/PendingApprovals'
import { RejectedDocuments } from '@/pages/approvals/RejectedDocuments'
import { ChangePassword } from '@/pages/auth/ChangePassword'
import { Profile } from '@/pages/auth/Profile'
import { MasterRoll } from '@/pages/ceo/MasterRoll'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { Documents } from '@/pages/downloads/Documents'
import { FuelRequest } from '@/pages/facility/FuelRequest'
import { GatePass } from '@/pages/facility/GatePass'
import { MaintenanceRequest } from '@/pages/facility/MaintenanceRequest'
import { PurchaseRequisition } from '@/pages/facility/PurchaseRequisition'
import { StoreRequisition } from '@/pages/facility/StoreRequisition'
import { TransferOrder } from '@/pages/facility/TransferOrder'
import { TransportRequest } from '@/pages/facility/TransportRequest'
import { VehicleTransfer } from '@/pages/facility/VehicleTransfer'
import { WorkTickets } from '@/pages/facility/WorkTickets'
import { ImprestRequest } from '@/pages/finance/ImprestRequest'
import { ImprestSurrender } from '@/pages/finance/ImprestSurrender'
import { PettyCash } from '@/pages/finance/PettyCash'
import { PettyCashReplenishment } from '@/pages/finance/PettyCashReplenishment'
import { StaffClaim } from '@/pages/finance/StaffClaim'
import { HodTeamRequests } from '@/pages/hod/HodTeamRequests'
import { StaffOnLeave } from '@/pages/hod/StaffOnLeave'
import { Attendance } from '@/pages/hr/Attendance'
import { DocumentRequisition } from '@/pages/hr/DocumentRequisition'
import { LeaveRequest } from '@/pages/hr/LeaveRequest'
import { LeaveStatement } from '@/pages/hr/LeaveStatement'
import { OvertimeRequest } from '@/pages/hr/OvertimeRequest'
import { Payslip } from '@/pages/hr/Payslip'
import { Performance } from '@/pages/hr/Performance'
import { SalaryAdvance } from '@/pages/hr/SalaryAdvance'
import { TrainingRequest } from '@/pages/hr/TrainingRequest'
import { TravelRequest } from '@/pages/hr/TravelRequest'
import { ErpConnector } from '@/pages/reports/ErpConnector'
import { GatePassLog } from '@/pages/reports/GatePassLog'
import { LeaveBalanceReport } from '@/pages/reports/LeaveBalanceReport'
import { StoreUsageReport } from '@/pages/reports/StoreUsageReport'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <LayoutProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar />
            <MainContent />
          </div>
        </div>
        <Footer />
        <MobileNav />
      </div>
    </LayoutProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="finance/imprest" element={<ImprestRequest />} />
        <Route path="finance/imprest-surrender" element={<ImprestSurrender />} />
        <Route path="finance/staff-claim" element={<StaffClaim />} />
        <Route path="finance/petty-cash" element={<PettyCash />} />
        <Route path="finance/petty-cash-replenishment" element={<PettyCashReplenishment />} />
        <Route path="facility/store-requisition" element={<StoreRequisition />} />
        <Route path="facility/purchase-requisition" element={<PurchaseRequisition />} />
        <Route path="facility/fuel-request" element={<FuelRequest />} />
        <Route path="facility/transport-request" element={<TransportRequest />} />
        <Route path="facility/maintenance-request" element={<MaintenanceRequest />} />
        <Route path="facility/transfer-order" element={<TransferOrder />} />
        <Route path="facility/work-tickets" element={<WorkTickets />} />
        <Route path="facility/gate-pass" element={<GatePass />} />
        <Route path="facility/vehicle-transfer" element={<VehicleTransfer />} />
        <Route path="hr/leave-request" element={<LeaveRequest />} />
        <Route path="hr/leave-statement" element={<LeaveStatement />} />
        <Route path="hr/attendance" element={<Attendance />} />
        <Route path="hr/performance" element={<Performance />} />
        <Route path="hr/training-request" element={<TrainingRequest />} />
        <Route path="hr/payslip" element={<Payslip />} />
        <Route path="hr/salary-advance" element={<SalaryAdvance />} />
        <Route path="hr/document-requisition" element={<DocumentRequisition />} />
        <Route path="hr/overtime-request" element={<OvertimeRequest />} />
        <Route path="hr/travel-request" element={<TravelRequest />} />
        <Route path="approvals" element={<PendingApprovals />} />
        <Route path="approvals/approved" element={<ApprovedDocuments />} />
        <Route path="approvals/rejected" element={<RejectedDocuments />} />
        <Route path="approvals/:id" element={<ApprovalDetail />} />
        <Route path="ceo/master-roll" element={<MasterRoll />} />
        <Route path="hod/team-requests" element={<HodTeamRequests />} />
        <Route path="hod/staff-on-leave" element={<StaffOnLeave />} />
        <Route path="downloads/documents" element={<Documents />} />
        <Route path="profile" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="reports/store-usage" element={<StoreUsageReport />} />
        <Route path="reports/leave-balance" element={<LeaveBalanceReport />} />
        <Route path="reports/gate-pass-log" element={<GatePassLog />} />
        <Route path="reports/erp-connector" element={<ErpConnector />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
