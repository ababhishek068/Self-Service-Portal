<?php

use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\StaffApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Self-Service Portal JSON API
|--------------------------------------------------------------------------
|
| These routes provide a JSON facade over the existing Staff controllers
| so the React Self-Service Portal (Vite SPA) can consume them. They share
| the same session as the legacy Blade portal — login through /api/login
| sets `session('authUser')` and the SPA can then call any /api/staff/*
| endpoint on subsequent requests.
|
| To enable, copy this content into the existing routes/api.php file and
| make sure the `web` middleware (sessions + cookies) is applied. Laravel
| 8+ defaults the API routes to `auth:sanctum` only — for our session-based
| use case we mount them under `web` instead so the existing session works.
|
*/

Route::middleware(['web'])->prefix('api')->group(function () {
    // Public auth endpoints
    Route::get('/csrf-token', [AuthApiController::class, 'csrf']);
    Route::post('/login', [AuthApiController::class, 'login']);

    // Authenticated endpoints (session must contain authUser)
    Route::middleware('ess.api.auth')->group(function () {
        Route::post('/logout', [AuthApiController::class, 'logout']);
        Route::get('/me', [AuthApiController::class, 'me']);

        Route::prefix('staff')->group(function () {
            // Dashboard
            Route::get('/dashboard/statistics', [StaffApiController::class, 'dashboardStatistics']);

            // Approvals
            Route::get('/approvals', [StaffApiController::class, 'approvals']);
            Route::get('/approvals/count/{type}/{status}', [StaffApiController::class, 'approvalsCount']);
            Route::get('/approvals/{docNo}', [StaffApiController::class, 'approval']);
            Route::post('/approvals/decide', [StaffApiController::class, 'approvalDecide']);

            // Leave
            Route::get('/leave', [StaffApiController::class, 'leaveList']);
            Route::get('/leave/types', [StaffApiController::class, 'leaveTypes']);
            Route::get('/leave/relievers', [StaffApiController::class, 'leaveRelievers']);
            Route::get('/leave/balance/{type}', [StaffApiController::class, 'leaveBalance']);
            Route::get('/leave/dates/{type}/{days}/{startDate}/{halfDay}', [StaffApiController::class, 'leaveDates']);
            Route::get('/leave/{no}', [StaffApiController::class, 'leaveShow']);
            Route::post('/leave', [StaffApiController::class, 'leaveStore']);
            Route::post('/leave/cancel', [StaffApiController::class, 'leaveCancel']);

            // Master data lookups
            Route::get('/items', [StaffApiController::class, 'items']);
            Route::get('/items/store/{store}', [StaffApiController::class, 'storeItems']);
            Route::get('/services', [StaffApiController::class, 'services']);
            Route::get('/assets', [StaffApiController::class, 'assets']);
            Route::get('/items/{item}/balance/{store}', [StaffApiController::class, 'itemBalance']);
            Route::get('/payroll/years', [StaffApiController::class, 'payrollYears']);
            Route::get('/payroll/years/{year}/months', [StaffApiController::class, 'payrollMonths']);
        });
    });
});
