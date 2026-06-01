<?php

/**
 * CORS configuration for the Laravel ESS app.
 *
 * Replace the existing `config/cors.php` with this file so the React Self-Service
 * Portal (running on a different host / port during development) can authenticate
 * against the Laravel session. The key points:
 *  - `paths` includes `api/*` and the CSRF cookie endpoint.
 *  - `supports_credentials` MUST be true to allow session cookies cross-origin.
 *  - `allowed_origins` should list every front-end origin that may consume the API.
 */

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'csrf-token', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',          // Vite dev server
        'http://localhost:4173',          // Vite preview
        'http://192.168.224.37',          // UAT (port 80 default)
        'http://192.168.224.37:81',       // ess IIS site
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
