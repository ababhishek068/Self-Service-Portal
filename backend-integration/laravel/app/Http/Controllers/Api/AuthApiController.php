<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HREmployee;
use App\Models\User;
use App\Traits\WebServicesTrait;
use Illuminate\Http\Request;

/**
 * JSON authentication endpoints for the React Self-Service Portal.
 *
 * Mirrors the logic in App\Http\Controllers\Auth\AuthenticatedSessionController
 * but returns JSON responses suitable for an SPA client. Session cookies are
 * still used (Laravel's default `web` middleware), so CSRF tokens must be
 * fetched from `/sanctum/csrf-cookie` (or the legacy `/csrf-token` endpoint
 * we expose below) before a login POST.
 */
class AuthApiController extends Controller
{
    use WebServicesTrait;

    public function csrf(Request $request)
    {
        return response()->json(['token' => csrf_token()]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'staffNo'  => 'required|string',
            'password' => 'required|string',
        ]);

        $employee = $this->odataClient()->from(HREmployee::wsName())
            ->where('No', $request->staffNo)
            ->first();

        if ($employee === null) {
            return response()->json(['message' => 'Staff No or password is incorrect'], 401);
        }

        if (!(($employee->Status === 'Active') || ($employee->Password === 'Password@123'))) {
            return response()->json([
                'message' => 'Your account is currently blocked or inactive. Please contact the IT team for help.',
            ], 403);
        }

        if ($employee->ChangedPassword === false) {
            return response()->json([
                'message' => 'You need to reset your password before you can login',
                'code'    => 'PASSWORD_RESET_REQUIRED',
            ], 403);
        }

        if (!\Hash::check($request->password, $employee->PortalPassword)) {
            return response()->json(['message' => 'Staff No or password is incorrect'], 401);
        }

        $userSetup = $this->odataClient()->from(User::wsName())
            ->where('EmployeeNo', $request->staffNo)
            ->first();

        if ($userSetup === null) {
            return response()->json([
                'message' => 'User with that employee no not found in the user setup',
            ], 403);
        }

        $authUser = [
            'employeeNo'        => $employee['No'],
            'name'              => $employee['FirstName'],
            'displayName'       => trim(($employee['FirstName'] ?? '') . ' ' . ($employee['LastName'] ?? '')),
            'userID'            => $userSetup['UserID'],
            'phoneNumber'       => $employee['CellPhoneNumber'],
            'Gender'            => $employee['Gender'],
            'userCategory'      => 'staff',
            'isChangedPassword' => $employee['ChangedPassword'],
            'department'        => $employee['GlobalDimension1Code'],
            'imprestNo'         => $employee['CustomerNo'],
            'HOD'               => true,
            'CEO'               => app(\App\Http\Controllers\Auth\AuthenticatedSessionController::class)->isCEO($employee['No']),
            'isNotified'        => false,
        ];

        $request->session()->put('authUser', $authUser);
        $request->session()->regenerate();

        return response()->json(['user' => $authUser]);
    }

    public function logout(Request $request)
    {
        $request->session()->forget('authUser');
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => session('authUser')]);
    }
}
