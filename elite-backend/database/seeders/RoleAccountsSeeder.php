<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleAccountsSeeder extends Seeder
{
    /**
     * Seed role-based accounts.
     */
    public function run(): void
    {
        // Super Admin: update existing super_admin if present, otherwise create/update by email
        $superEmail = env('SEED_SUPER_ADMIN_EMAIL', 'superadmin@gmail.com');
        $superPassword = env('SEED_SUPER_ADMIN_PASSWORD', 'Password123!');

        $existingSuper = User::where('role', 'superadmin')->first();

        $superData = [
            'name' => env('SEED_SUPER_ADMIN_NAME', 'Hijra Super Admin'),
            'phone' => env('SEED_SUPER_ADMIN_PHONE', '+251911111111'),
            'password' => Hash::make($superPassword),
            'role' => 'superadmin',
            'account_status' => 'active',
            'preferred_language' => 'en',
        ];

        if ($existingSuper) {
            $existingSuper->update(array_merge($superData, ['email' => $superEmail]));
        } else {
            User::updateOrCreate(
                ['email' => $superEmail],
                array_merge($superData, ['email' => $superEmail])
            );
        }

        // Job Seeker (user)
        User::updateOrCreate(
            ['email' => env('SEED_SEEKER_EMAIL', 'user@hijra.local')],
            [
                'name' => env('SEED_SEEKER_NAME', 'Hijra User'),
                'phone' => env('SEED_SEEKER_PHONE', '+251933333333'),
                'password' => Hash::make(env('SEED_SEEKER_PASSWORD', 'Password@123')),
                'role' => 'seeker',
                'account_status' => 'active',
                'preferred_language' => 'en',
            ]
        );

        // Staff
        User::updateOrCreate(
            ['email' => env('SEED_STAFF_EMAIL', 'staff@hijra.local')],
            [
                'name' => env('SEED_STAFF_NAME', 'Hijra Staff'),
                'phone' => env('SEED_STAFF_PHONE', '+251922222222'),
                'password' => Hash::make(env('SEED_STAFF_PASSWORD', 'Password@123')),
                'role' => 'staff',
                'account_status' => 'active',
                'preferred_language' => 'en',
            ]
        );

        // Partner (foreign agency owner placeholder)
        User::updateOrCreate(
            ['email' => env('SEED_PARTNER_EMAIL', 'partner@hijra.local')],
            [
                'name' => env('SEED_PARTNER_NAME', 'Hijra Foreign Partner'),
                'phone' => env('SEED_PARTNER_PHONE', '+251944444444'),
                'password' => Hash::make(env('SEED_PARTNER_PASSWORD', 'Password@123')),
                'role' => 'partner',
                'account_status' => 'pending_approval',
                'preferred_language' => 'en',
            ]
        );
    }
}
