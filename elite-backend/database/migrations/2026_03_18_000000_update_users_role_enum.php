<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Temporarily convert role enum to varchar to allow safe value updates
        DB::statement("ALTER TABLE `users` MODIFY `role` VARCHAR(50) NOT NULL DEFAULT 'seeker'");

        // Map existing admin_type values to the new role strings if the column exists
        try {
            DB::statement("UPDATE `users` SET `role` = 'superadmin' WHERE `admin_type` = 'super_admin'");
            DB::statement("UPDATE `users` SET `role` = 'staff' WHERE `admin_type` = 'staff'");
            DB::statement("UPDATE `users` SET `role` = 'partner' WHERE `admin_type` = 'partner'");
        } catch (\Throwable $e) {
            // ignore if admin_type doesn't exist
        }

        // Update any remaining 'admin' role to 'staff' (safe fallback)
        DB::statement("UPDATE `users` SET `role` = 'staff' WHERE `role` = 'admin'");

        // Update role enum to include superadmin, staff, partner, seeker
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('superadmin','staff','partner','seeker') NOT NULL DEFAULT 'seeker'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin','seeker') NOT NULL DEFAULT 'seeker'");
    }
};
