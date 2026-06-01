<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Staff\GeneralController;
use App\Http\Controllers\Staff\LeaveController;
use App\Http\Controllers\Staff\ApprovalsController;
use App\Http\Controllers\Staff\GeneralController as StaffGeneralController;
use App\Models\ApprovalEntry;
use App\Models\HRLeaveRequisition;
use App\Models\LeaveType;
use App\Models\HREmployee;
use App\Models\PolicyController;
use App\Traits\WebServicesTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Read-only JSON facade over the existing Staff controllers.
 *
 * Each method delegates to the existing logic so we never duplicate the
 * Business Central / NTLM SOAP integration. Where the existing controller
 * returns an HTML view, we extract the same `$data` payload and return JSON.
 *
 * Mounted at /api/staff/* (see routes/api.php).
 */
class StaffApiController extends Controller
{
    use WebServicesTrait;

    /* ---------- Dashboard ---------- */

    public function dashboardStatistics(GeneralController $general)
    {
        return response()->json($general->dashboardStatistics());
    }

    /* ---------- Approvals ---------- */

    public function approvals(Request $request)
    {
        $status = $request->query('status', 'Open'); // Open|Approved|Rejected
        $docType = $request->query('docType', '');
        $skip = (int) $request->query('skip', 0);

        $query = $this->odataClient()->from(ApprovalEntry::wsName())
            ->where('Status', $status)
            ->where('ApproverID', session('authUser')['userID']);

        if ($docType !== '') {
            $query->where('DocumentType', $docType);
        }

        $rows = $query->take(30)->skip($skip)->get();

        return response()->json(['rows' => $rows, 'status' => $status]);
    }

    public function approval($docNo, ApprovalsController $controller)
    {
        // viewDocument() already builds a $data array — capture it.
        $data = $controller->viewDocumentJson
            ? $controller->viewDocumentJson($docNo)
            : ['document' => $this->odataClient()->from(ApprovalEntry::wsName())
                ->where('DocumentNo', $docNo)
                ->where('ApproverID', session('authUser')['userID'])
                ->first()];
        return response()->json($data);
    }

    public function approvalsCount(Request $request, $type, $status, ApprovalsController $controller)
    {
        // The existing controller already returns an array (auto-JSON).
        return response()->json($controller->approvalsCount($type, $status));
    }

    public function approvalDecide(Request $request, ApprovalsController $controller)
    {
        $request->validate([
            'docNo'     => 'required|string',
            'decision'  => 'required|in:Approved,Rejected',
            'comment'   => 'nullable|string',
        ]);

        // Bridge to the existing documentApproval method.
        $request->merge(['_redirect' => false]);
        $controller->documentApproval($request);

        return response()->json([
            'message' => "Document {$request->docNo} has been " . strtolower($request->decision),
        ]);
    }

    /* ---------- Leave ---------- */

    public function leaveList()
    {
        $today = Carbon::now();
        $start = $today->copy()->startOfYear()->format('Y-m-d');
        $end = $today->copy()->endOfYear()->format('Y-m-d');

        $rows = $this->odataClient()->from(HRLeaveRequisition::wsName())
            ->where('UserID', session('authUser')['userID'])
            ->where('#filter', "(ApplicationDate gt $start and ApplicationDate lt $end)" . 'filter#')
            ->get();

        return response()->json(['rows' => $rows]);
    }

    public function leaveTypes()
    {
        $notGender = session('authUser')['Gender'] === 'Male' ? 'Female' : 'Male';
        $types = $this->odataClient()->from(LeaveType::wsName())
            ->where('Gender', '!=', $notGender)
            ->get();
        return response()->json(['rows' => $types]);
    }

    public function leaveRelievers()
    {
        $rows = $this->odataClient()->from(HREmployee::wsName())
            ->select('No', 'FirstName', 'MiddleName', 'LastName')
            ->where('No', '!=', session('authUser')['employeeNo'])
            ->where('Status', '=', 'Active')
            ->get();
        return response()->json(['rows' => $rows]);
    }

    public function leaveBalance($type, LeaveController $controller)
    {
        return response()->json($controller->getLeaveBalance($type));
    }

    public function leaveDates($type, $days, $startDate, $halfDay, LeaveController $controller)
    {
        return response()->json($controller->getLeaveDates($type, $days, $startDate, $halfDay));
    }

    public function leaveShow($no, LeaveController $controller)
    {
        $data = $controller->show($no);
        if ($data instanceof \Illuminate\View\View) {
            return response()->json($data->getData());
        }
        return response()->json($data);
    }

    public function leaveStore(Request $request, LeaveController $controller)
    {
        $controller->store($request);
        return response()->json([
            'message' => session('success') ?? session('error') ?? 'Submitted',
            'ok'      => session('success') !== null,
        ]);
    }

    public function leaveCancel(Request $request, LeaveController $controller)
    {
        $controller->cancel($request);
        return response()->json([
            'message' => session('success') ?? session('error') ?? 'Updated',
            'ok'      => session('success') !== null,
        ]);
    }

    /* ---------- Master data lookups ---------- */

    public function items(StaffGeneralController $controller)
    {
        return response()->json(['rows' => $controller->getItems()]);
    }

    public function storeItems($store, StaffGeneralController $controller)
    {
        return response()->json(['rows' => $controller->getStoreItems($store)]);
    }

    public function services(StaffGeneralController $controller)
    {
        return response()->json(['rows' => $controller->getServices()]);
    }

    public function assets(StaffGeneralController $controller)
    {
        return response()->json(['rows' => $controller->getAssets()]);
    }

    public function itemBalance($item, $store, StaffGeneralController $controller)
    {
        return response()->json(['balance' => $controller->getItemBalance($item, $store)]);
    }

    public function payrollYears(StaffGeneralController $controller)
    {
        return response()->json(['rows' => $controller->prPeriodYears()]);
    }

    public function payrollMonths($year, StaffGeneralController $controller)
    {
        return response()->json(['rows' => $controller->prPeriodYearMonths($year)]);
    }
}
