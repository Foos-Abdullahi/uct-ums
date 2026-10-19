<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('course_assignments', function (Blueprint $table) {
            $table->string('weekday', 12)->nullable()->after('room');
            $table->time('start_time')->nullable()->after('weekday');
            $table->time('end_time')->nullable()->after('start_time');
        });

        DB::table('course_assignments')
            ->select(['id', 'schedule_day', 'schedule_time'])
            ->orderBy('id')
            ->chunkById(100, function ($assignments): void {
                foreach ($assignments as $assignment) {
                    $schedule = [
                        'weekday' => $assignment->schedule_day,
                    ];

                    if (preg_match('/^\s*(.+?)\s*-\s*(.+?)\s*$/', (string) $assignment->schedule_time, $matches)) {
                        $startTimestamp = strtotime($matches[1]);
                        $endTimestamp = strtotime($matches[2]);

                        if ($startTimestamp !== false && $endTimestamp !== false) {
                            $schedule['start_time'] = date('H:i:s', $startTimestamp);
                            $schedule['end_time'] = date('H:i:s', $endTimestamp);
                        }
                    }

                    DB::table('course_assignments')
                        ->where('id', $assignment->id)
                        ->update($schedule);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_assignments', function (Blueprint $table) {
            $table->dropColumn(['weekday', 'start_time', 'end_time']);
        });
    }
};
