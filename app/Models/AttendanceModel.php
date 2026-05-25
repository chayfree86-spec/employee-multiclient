<?php

namespace App\Models;

use CodeIgniter\Model;
use Config\Weekday;

class AttendanceModel extends Model
{
    protected $table = 'attendance';
    protected $primaryKey = 'id';
    protected $allowedFields = ['employee_id', 'date', 'status', 'source', 'check_in', 'check_out'];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = '';

    protected $validationRules = [
        'employee_id' => 'required|integer|is_not_unique[employees.id]',
        'date' => 'required|valid_date[Y-m-d]',
        'status' => 'required|in_list[present,absent,half_day,holiday]',
        'check_in' => 'permit_empty|valid_time[H:i:s]',
        'check_out' => 'permit_empty|valid_time[H:i:s]'
    ];

    protected $validationMessages = [
        'employee_id' => [
            'required' => 'Employee ID is required',
            'integer' => 'Employee ID must be an integer',
            'is_not_unique' => 'Invalid employee ID'
        ],
        'date' => [
            'required' => 'Date is required',
            'valid_date' => 'Invalid date format'
        ],
        'status' => [
            'required' => 'Attendance status is required',
            'in_list' => 'Invalid attendance status'
        ],
        'check_in' => [
            'valid_time' => 'Invalid check-in time format'
        ],
        'check_out' => [
            'valid_time' => 'Invalid check-out time format'
        ]
    ];

    public function getAttendanceByEmployeeAndDate($employeeId, $date)
    {
        return $this->where('employee_id', $employeeId)
                   ->where('date', $date)
                   ->first();
    }

    public function getMonthlyAttendance($employeeId, $month, $year)
    {
        return $this->where('employee_id', $employeeId)
                   ->where('MONTH(date)', $month)
                   ->where('YEAR(date)', $year)
                   ->orderBy('date', 'ASC')
                   ->findAll();
    }

    public function getAttendanceSummary($employeeId, $month, $year)
    {
        return $this->select('status, COUNT(*) as count')
                   ->where('employee_id', $employeeId)
                   ->where('MONTH(date)', $month)
                   ->where('YEAR(date)', $year)
                   ->groupBy('status')
                   ->findAll();
    }

    public static function getWeeklyHolidayDay(): int
    {
        static $weekday = null;

        if ($weekday !== null) {
            return $weekday;
        }

        try {
            $value = (int) (new SettingsModel())->getSetting('weekly_holiday', (string) Weekday::WEEKDAY);
            $weekday = ($value >= 0 && $value <= 6) ? $value : Weekday::WEEKDAY;
        } catch (\Throwable) {
            $weekday = Weekday::WEEKDAY;
        }

        return $weekday;
    }

    /**
     * Get weekly holiday dates in month.
     */
    public static function getWeekdayDatesInMonth(int $month, int $year): array
    {
        $days = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $dates = [];
        for ($d = 1; $d <= $days; $d++) {
            $dayPad = str_pad((string) $d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ((int) date('w', strtotime($ymd)) === self::getWeeklyHolidayDay()) {
                $dates[] = $ymd;
            }
        }
        return $dates;
    }

    /**
     * Check if date is the configured weekly holiday.
     */
    public static function isWeekday(string $date): bool
    {
        return (int) date('w', strtotime($date)) === self::getWeeklyHolidayDay();
    }

    /**
     * Get effective join date for filtering attendance in a given month.
     * - join_date in same month: use join_date (attendance from join date only)
     * - join_date before month: return null (include all)
     * - join_date after month: return day after month end (exclude all)
     */
    public static function getEffectiveJoinDateForMonth(?string $joinDate, int $month, int $year): ?string
    {
        if (empty($joinDate)) {
            return null;
        }
        $joinTs = strtotime($joinDate);
        if ($joinTs === false) {
            return null;
        }
        $joinMonth = (int) date('n', $joinTs);
        $joinYear = (int) date('Y', $joinTs);
        if ($joinYear < $year || ($joinYear === $year && $joinMonth < $month)) {
            return null;
        }
        if ($joinYear > $year || ($joinYear === $year && $joinMonth > $month)) {
            $nextMonth = mktime(0, 0, 0, $month + 1, 1, $year);
            return date('Y-m-d', $nextMonth);
        }
        return $joinDate;
    }

    /**
     * Get weekday attendance status: which Tuesdays are Absent.
     * Rule 1: Week ke aage pichhe absent (Mon or Wed) → that Tuesday only becomes Absent.
     * Rule 2: Mahine me 2+ absents (any working day) → ALL Tuesdays become Absent.
     * - 1 absent before weekend → only that Tuesday absent.
     * - 2nd absent (or 2 total) → sara weekend absent.
     * Manual marking on Tuesday takes precedence.
     * @param string|null $asOfDate Optional Y-m-d; when set, only count dates on or before this.
     * @param string|null $joinDate Optional; when set, only count dates on or after join (weekend before join = no benefit).
     */
    /**
     * Compute Tuesday absent map from a given attMap (date => status).
     * Used by getWeekdayAttendanceStatus and syncWeekendRuleForMonth.
     */
    private static function computeTuesdayAbsentMap(array $attMap, int $month, int $year, ?string $effectiveJoin, ?string $asOfDate = null): array
    {
        $tuesdayDates = self::getWeekdayDatesInMonth($month, $year);
        $tuesdayAbsent = [];
        $weekendHolidayCount = 0;
        $weekendAbsentCount = 0;
        $daysInMonth = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        
        $totalAbsents = 0;
        $monWedViolations = 0;

        // Step 1: Count total absents on non-Tuesdays
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayPad = str_pad((string) $d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ($asOfDate !== null && $ymd > $asOfDate) continue;
            if ($effectiveJoin !== null && $ymd < $effectiveJoin) continue;
            if (!self::isWeekday($ymd) && ($attMap[$ymd] ?? '') === 'absent') {
                $totalAbsents++;
            }
        }

        // Step 2: Identify "Sandwich" violations for each Tuesday
        $sandwichTuesdays = [];
        foreach ($tuesdayDates as $tue) {
            $tueTs = strtotime($tue);
            $mon = date('Y-m-d', strtotime('-1 day', $tueTs));
            $wed = date('Y-m-d', strtotime('+1 day', $tueTs));
            $monAbsent = ($attMap[$mon] ?? '') === 'absent';
            $wedAbsent = ($attMap[$wed] ?? '') === 'absent';
            if ($monAbsent || $wedAbsent) {
                $sandwichTuesdays[$tue] = true;
                $monWedViolations++;
            }
        }

        // Step 3: Apply logical rules to each Tuesday
        $today = date('Y-m-d');
        foreach ($tuesdayDates as $tue) {
            if ($asOfDate !== null && $tue > $asOfDate) continue;
            if ($tue > $today) continue; // Do not apply rules to future dates
            if ($effectiveJoin !== null && $tue < $effectiveJoin) continue;

            $status = $attMap[$tue] ?? null;
            $isSandwiched = !empty($sandwichTuesdays[$tue]);
            
            // Rules:
            // 1. Manual Absent stays Absent.
            // 2. Manual Present/Half Day stays Paid Weekend (not absent).
            // 3. Unmarked or Manual 'Holiday' becomes Absent if:
            //    - It is Sandwiched (Mon/Wed absent)
            //    - OR Global Rule applies (2+ total absents or 2+ sandwich violations in month)
            
            $becomesAbsent = false;
            
            if ($status === 'absent') {
                $becomesAbsent = true;
            } elseif ($status === 'present' || $status === 'half_day') {
                $becomesAbsent = false;
            } else {
                // Null, Empty, or 'holiday'
                if ($isSandwiched || $totalAbsents >= 2 || $monWedViolations >= 2) {
                    $becomesAbsent = true;
                }
            }

            if ($becomesAbsent) {
                $tuesdayAbsent[$tue] = true;
                $weekendAbsentCount++;
            } else {
                $weekendHolidayCount++;
            }
        }

        return [
            'weekend_dates' => $tuesdayDates,
            'weekend_holiday_count' => max(0, $weekendHolidayCount),
            'weekend_absent_count' => $weekendAbsentCount,
            'violations' => $monWedViolations,
            'tuesday_absent_map' => $tuesdayAbsent,
        ];
    }

    public function getWeekdayAttendanceStatus(int $employeeId, int $month, int $year, ?string $asOfDate = null, ?string $joinDate = null): array
    {
        $raw = $this->getMonthlyAttendance($employeeId, $month, $year);
        $attMap = [];
        foreach ($raw as $a) {
            $d = is_string($a['date'] ?? '') ? substr($a['date'], 0, 10) : date('Y-m-d', strtotime($a['date'] ?? ''));
            $attMap[$d] = $a['status'] ?? '';
        }
        $effectiveJoin = self::getEffectiveJoinDateForMonth($joinDate, $month, $year);
        return self::computeTuesdayAbsentMap($attMap, $month, $year, $effectiveJoin, $asOfDate);
    }

    /**
     * Sync Tuesday (weekend) attendance in DB by rule: when Mon/Wed absent or 2+ absents in month,
     * write Tuesday as absent (source=weekend_rule). When condition reverts, remove rule-derived Tuesday records.
     */
    public function syncWeekendRuleForMonth(int $employeeId, int $month, int $year, ?string $joinDate = null): void
    {
        $raw = $this->getMonthlyAttendance($employeeId, $month, $year);
        $attMap = [];
        foreach ($raw as $a) {
            $d = is_string($a['date'] ?? '') ? substr($a['date'], 0, 10) : date('Y-m-d', strtotime($a['date'] ?? ''));
            $src = $a['source'] ?? 'manual';
            if (self::isWeekday($d) && $src === 'weekend_rule') {
                continue;
            }
            $attMap[$d] = $a['status'] ?? '';
        }
        $effectiveJoin = self::getEffectiveJoinDateForMonth($joinDate, $month, $year);
        $result = self::computeTuesdayAbsentMap($attMap, $month, $year, $effectiveJoin, null);
        $tuesdayAbsentMap = $result['tuesday_absent_map'] ?? [];
        $tuesdayDates = $result['weekend_dates'] ?? self::getWeekdayDatesInMonth($month, $year);

        $today = date('Y-m-d');
        foreach ($tuesdayDates as $tue) {
            if ($effectiveJoin !== null && $tue < $effectiveJoin) continue;
            $existing = $this->getAttendanceByEmployeeAndDate($employeeId, $tue);
            
            // If it's a future date, it should never have a rule-derived record
            if ($tue > $today) {
                if ($existing && ($existing['source'] ?? 'manual') === 'weekend_rule') {
                    $this->delete($existing['id']);
                }
                continue;
            }

            $shouldBeAbsent = !empty($tuesdayAbsentMap[$tue]);
            $isRuleDerived = $existing && ($existing['source'] ?? 'manual') === 'weekend_rule';

            if ($shouldBeAbsent) {
                if (!$existing) {
                    $this->insert([
                        'employee_id' => $employeeId,
                        'date' => $tue,
                        'status' => 'absent',
                        'source' => 'weekend_rule',
                        'check_in' => null,
                        'check_out' => null,
                    ]);
                } elseif ($isRuleDerived) {
                    $this->update($existing['id'], ['status' => 'absent', 'source' => 'weekend_rule']);
                }
            } else {
                if ($existing && $isRuleDerived) {
                    $this->delete($existing['id']);
                }
            }
        }
    }

    /**
     * Get monthly attendance enriched with weekday (Tuesday) logic.
     * Tuesdays not in DB show as 'holiday'; Tuesdays marked Absent by rule show as 'absent'.
     * @param string|null $joinDate Optional; when set, only include dates on or after join date.
     */
    public function getMonthlyAttendanceEnriched(int $employeeId, int $month, int $year, ?string $joinDate = null): array
    {
        $raw = $this->getMonthlyAttendance($employeeId, $month, $year);
        $attMap = [];
        foreach ($raw as $a) {
            $d = is_string($a['date'] ?? '') ? substr($a['date'], 0, 10) : date('Y-m-d', strtotime($a['date'] ?? ''));
            $attMap[$d] = $a;
        }

        $effectiveJoin = self::getEffectiveJoinDateForMonth($joinDate, $month, $year);
        $weekdayStatus = $this->getWeekdayAttendanceStatus($employeeId, $month, $year, null, $joinDate);
        $tuesdayAbsentMap = $weekdayStatus['tuesday_absent_map'] ?? [];

        $days = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $result = [];
        $today = date('Y-m-d');

        for ($d = 1; $d <= $days; $d++) {
            $dayPad = str_pad((string) $d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ($effectiveJoin !== null && $ymd < $effectiveJoin) continue;
            if (isset($attMap[$ymd])) {
                $row = $attMap[$ymd];
                $row['date'] = $ymd;
                
                // If it's a Tuesday and the rules say it should be absent
                if (self::isWeekday($ymd) && !empty($tuesdayAbsentMap[$ymd])) {
                    // Only override if it wasn't manual 'present' or 'half_day'
                    if ($row['status'] !== 'present' && $row['status'] !== 'half_day') {
                        $row['status'] = 'absent';
                    }
                } elseif (self::isWeekday($ymd) && ($row['status'] ?? '') === 'holiday') {
                    $row['status'] = 'weekend';
                }
                $result[] = $row;
            } elseif (self::isWeekday($ymd) && $ymd <= $today) {
                $result[] = [
                    'date' => $ymd,
                    'status' => !empty($tuesdayAbsentMap[$ymd]) ? 'absent' : 'weekend',
                    'check_in' => null,
                    'check_out' => null,
                ];
            }
        }

        usort($result, fn($a, $b) => strcmp($a['date'] ?? '', $b['date'] ?? ''));
        return $result;
    }

    /**
     * Get attendance summary enriched with weekday logic.
     * Tuesday: manual marking takes precedence; unmarked Tuesdays use rule (holiday by default, absent if Mon/Wed absent).
     * @param string|null $asOfDate Optional Y-m-d date; when set, only count attendance on or before this date.
     * @param string|null $joinDate Optional; when set, only count dates on or after join (weekend before join = no benefit).
     */
    public function getAttendanceSummaryEnriched(int $employeeId, int $month, int $year, ?string $asOfDate = null, ?string $joinDate = null): array
    {
        $raw = $this->getMonthlyAttendance($employeeId, $month, $year);
        $attMap = [];
        $effectiveJoin = self::getEffectiveJoinDateForMonth($joinDate, $month, $year);
        foreach ($raw as $a) {
            $d = is_string($a['date'] ?? '') ? substr($a['date'], 0, 10) : date('Y-m-d', strtotime($a['date'] ?? ''));
            if ($asOfDate !== null && $d > $asOfDate) continue;
            if ($effectiveJoin !== null && $d < $effectiveJoin) continue;
            $attMap[$d] = $a['status'] ?? '';
        }

        $counts = ['present' => 0, 'absent' => 0, 'half_day' => 0, 'weekend' => 0, 'holiday' => 0];
        $tuesdayDates = self::getWeekdayDatesInMonth($month, $year);
        $weekdayStatus = $this->getWeekdayAttendanceStatus($employeeId, $month, $year, $asOfDate, $joinDate);
        $tuesdayAbsentMap = $weekdayStatus['tuesday_absent_map'] ?? [];

        foreach ($raw as $a) {
            $d = is_string($a['date'] ?? '') ? substr($a['date'], 0, 10) : date('Y-m-d', strtotime($a['date'] ?? ''));
            if ($asOfDate !== null && $d > $asOfDate) continue;
            if ($effectiveJoin !== null && $d < $effectiveJoin) continue;
            if (self::isWeekday($d)) {
                $s = $attMap[$d] ?? '';
                if ($s !== '' && $s !== null) {
                    // Check if rule overrides this status
                    if (!empty($tuesdayAbsentMap[$d]) && $s !== 'present' && $s !== 'half_day') {
                        $counts['absent']++;
                    } elseif ($s === 'holiday') {
                        $counts['weekend']++;
                    } elseif (isset($counts[$s])) {
                        $counts[$s]++;
                    }
                } else {
                    $counts[isset($tuesdayAbsentMap[$d]) ? 'absent' : 'weekend']++;
                }
            } else {
                $s = $a['status'] ?? '';
                if ($s === 'holiday') {
                    $counts['holiday']++;
                } elseif (isset($counts[$s])) {
                    $counts[$s]++;
                }
            }
        }

        $today = date('Y-m-d');
        foreach ($tuesdayDates as $tue) {
            if ($asOfDate !== null && $tue > $asOfDate) continue;
            if ($tue > $today) continue; // Ignore future Tuesdays in counts
            if ($effectiveJoin !== null && $tue < $effectiveJoin) continue;
            if (!isset($attMap[$tue]) || $attMap[$tue] === '') {
                $counts[isset($tuesdayAbsentMap[$tue]) ? 'absent' : 'weekend']++;
            }
        }

        $summary = [];
        foreach ($counts as $status => $count) {
            if ($count > 0) {
                $summary[] = ['status' => $status, 'count' => (string) $count];
            }
        }
        return $summary;
    }

    public function markAttendance($employeeId, $date, $status, $checkIn = null, $checkOut = null)
    {
        $data = [
            'employee_id' => $employeeId,
            'date' => $date,
            'status' => $status,
            'source' => 'manual',
            'check_in' => $checkIn,
            'check_out' => $checkOut
        ];

        $existing = $this->getAttendanceByEmployeeAndDate($employeeId, $date);
        if ($existing) {
            return $this->update($existing['id'], $data);
        }
        return $this->insert($data);
    }
}
