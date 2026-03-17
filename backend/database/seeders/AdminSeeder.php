<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin user
        User::firstOrCreate(
            ['email' => 'admin@ustadi.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'), // Change this in production!
                'role' => 'ADMIN',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Default admin created:');
        $this->command->info('  Email: admin@ustadi.com');
        $this->command->info('  Password: admin123');
        $this->command->warn('  Please change the password after first login!');
    }
}
