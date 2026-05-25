<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;
use Config\Weekday;

class AttendanceModel extends Model
{
    protected $table = 'attendance';
    protected $primaryKey = 'id';
    protected $allowedFields = ['user_id', 'employee_id', 'date', 'status', 'source', 'check_in', 'check_out'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    public function getMonthlyAttendance($employeeId, $month, $year)
    {
        return $this->where('employee_id', $employeeId)
                   ->where('MONTH(date)', $month)
                   ->where('YEAR(date)', $year)
                   ->orderBy('date', 'ASC')
                   ->findAll();
    }

    public function getMonthlyAttendanceForEmployees(int $month, int $year, array $employeeIds = []): array
    {
        $builder = $this->builder();
        $builder->select('attendance.*')
            ->where('MONTH(date)', $month)
            ->where('YEAR(date)', $year);

        if (!empty($employeeIds)) {
            $builder->whereIn('employee_id', $employeeIds);
        }

        return $builder
            ->orderBy('employee_id', 'ASC')
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
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

    public static function getWeekdayDatesInMonth(int $month, int $year): array
    {
        $days = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string)$month, 2, '0', STR_PAD_LEFT);
        $dates = [];
        for ($d = 1; $d <= $days; $d++) {
            $dayPad = str_pad((string)$d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ((int) date('w', strtotime($ymd)) === self::getWeeklyHolidayDay()) {
                $dates[] = $ymd;
            }
        }
        return $dates;
    }

    public static function isWeekday(string $date): bool
    {
        return (int) date('w', strtotime($date)) === self::getWeeklyHolidayDay();
    }

    public static function getEffectiveJoinDateForMonth(?string $joinDate, int $month, int $year): ?string
    {
        if (empty($joinDate)) return null;
        $joinTs = strtotime($joinDate);
        if ($joinTs === false) return null;
        $joinMonth = (int) date('n', $joinTs);
        $joinYear = (int) date('Y', $joinTs);
        if ($joinYear < $year || ($joinYear === $year && $joinMonth < $month)) return null;
        if ($joinYear > $year || ($joinYear === $year && $joinMonth > $month)) {
            $nextMonth = mktime(0, 0, 0, $month + 1, 1, $year);
            return date('Y-m-d', $nextMonth);
        }
        return $joinDate;
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
        
        $tuesdayDates = self::getWeekdayDatesInMonth($month, $year);
        $tuesdayAbsent = [];
        $weekendHolidayCount = 0;
        $weekendAbsentCount = 0;
        $daysInMonth = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string)$month, 2, '0', STR_PAD_LEFT);
        
        $totalAbsents = 0;
        $monWedViolations = 0;

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayPad = str_pad((string)$d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ($asOfDate !== null && $ymd > $asOfDate) continue;
            if ($effectiveJoin !== null && $ymd < $effectiveJoin) continue;
            if (!self::isWeekday($ymd) && ($attMap[$ymd] ?? '') === 'absent') {
                $totalAbsents++;
            }
        }

        $sandwichTuesdays = [];
        foreach ($tuesdayDates as $tue) {
            $tueTs = strtotime($tue);
            $mon = date('Y-m-d', strtotime('-1 day', $tueTs));
            $wed = date('Y-m-d', strtotime('+1 day', $tueTs));
            if (($attMap[$mon] ?? '') === 'absent' || ($attMap[$wed] ?? '') === 'absent') {
                $sandwichTuesdays[$tue] = true;
                $monWedViolations++;
            }
        }

        $today = date('Y-m-d');
        foreach ($tuesdayDates as $tue) {
            if ($asOfDate !== null && $tue > $asOfDate) continue;
            if ($tue > $today) continue;
            if ($effectiveJoin !== null && $tue < $effectiveJoin) continue;

            $status = $attMap[$tue] ?? null;
            $isSandwiched = !empty($sandwichTuesdays[$tue]);
            $becomesAbsent = false;
            
            if ($status === 'absent') {
                $becomesAbsent = true;
            } elseif ($status === 'present' || $status === 'half_day') {
                $becomesAbsent = false;
            } else {
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
            'weekend_holiday_count' => max(0, $weekendHolidayCount),
            'weekend_absent_count' => $weekendAbsentCount,
            'tuesday_absent_map' => $tuesdayAbsent,
            'weekend_dates' => $tuesdayDates
        ];
    }

    private function getWeekdayAttendanceStatusFromMap(array $attMap, int $month, int $year, ?string $asOfDate = null, ?string $effectiveJoin = null): array
    {
        $tuesdayDates = self::getWeekdayDatesInMonth($month, $year);
        $tuesdayAbsent = [];
        $weekendHolidayCount = 0;
        $weekendAbsentCount = 0;
        $daysInMonth = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string)$month, 2, '0', STR_PAD_LEFT);

        $totalAbsents = 0;
        $monWedViolations = 0;

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayPad = str_pad((string)$d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ($asOfDate !== null && $ymd > $asOfDate) continue;
            if ($effectiveJoin !== null && $ymd < $effectiveJoin) continue;
            if (!self::isWeekday($ymd) && ($attMap[$ymd] ?? '') === 'absent') {
                $totalAbsents++;
            }
        }

        $sandwichTuesdays = [];
        foreach ($tuesdayDates as $tue) {
            $tueTs = strtotime($tue);
            $mon = date('Y-m-d', strtotime('-1 day', $tueTs));
            $wed = date('Y-m-d', strtotime('+1 day', $tueTs));
            if (($attMap[$mon] ?? '') === 'absent' || ($attMap[$wed] ?? '') === 'absent') {
                $sandwichTuesdays[$tue] = true;
                $monWedViolations++;
            }
        }

        $today = date('Y-m-d');
        foreach ($tuesdayDates as $tue) {
            if ($asOfDate !== null && $tue > $asOfDate) continue;
            if ($tue > $today) continue;
            if ($effectiveJoin !== null && $tue < $effectiveJoin) continue;

            $status = $attMap[$tue] ?? null;
            $isSandwiched = !empty($sandwichTuesdays[$tue]);
            $becomesAbsent = false;

            if ($status === 'absent') {
                $becomesAbsent = true;
            } elseif ($status === 'present' || $status === 'half_day') {
                $becomesAbsent = false;
            } else {
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
            'weekend_holiday_count' => max(0, $weekendHolidayCount),
            'weekend_absent_count' => $weekendAbsentCount,
            'tuesday_absent_map' => $tuesdayAbsent,
            'weekend_dates' => $tuesdayDates
        ];
    }

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
        $monthPad = str_pad((string)$month, 2, '0', STR_PAD_LEFT);
        $result = [];
        $today = date('Y-m-d');

        for ($d = 1; $d <= $days; $d++) {
            $dayPad = str_pad((string)$d, 2, '0', STR_PAD_LEFT);
            $ymd = "{$year}-{$monthPad}-{$dayPad}";
            if ($effectiveJoin !== null && $ymd < $effectiveJoin) continue;
            if (isset($attMap[$ymd])) {
                $row = $attMap[$ymd];
                $row['date'] = $ymd;
                if (self::isWeekday($ymd) && !empty($tuesdayAbsentMap[$ymd])) {
                    if ($row['status'] !== 'present' && $row['status'] !== 'half_day') $row['status'] = 'absent';
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
            if ($tue > $today) continue;
            if ($effectiveJoin !== null && $tue < $effectiveJoin) continue;
            if (!isset($attMap[$tue]) || $attMap[$tue] === '') {
                $counts[isset($tuesdayAbsentMap[$tue]) ? 'absent' : 'weekend']++;
            }
        }

        $summary = [];
        foreach ($counts as $status => $count) {
            if ($count > 0) {
                $summary[] = ['status' => $status, 'count' => (string)$count];
            }
        }
        return $summary;
    }

    public function getMonthlyAttendanceSnapshot(array $employees, int $month, int $year): array
    {
        if (empty($employees)) {
            return [];
        }

        $employeeIds = array_map(static fn($employee) => (int) ($employee['id'] ?? 0), $employees);
        $rawRows = $this->getMonthlyAttendanceForEmployees($month, $year, array_filter($employeeIds));
        $rowsByEmployee = [];

        foreach ($rawRows as $row) {
            $employeeId = (int) ($row['employee_id'] ?? 0);
            if ($employeeId <= 0) {
                continue;
            }

            $date = is_string($row['date'] ?? '') ? substr($row['date'], 0, 10) : date('Y-m-d', strtotime($row['date'] ?? ''));
            $row['date'] = $date;

            if (!isset($rowsByEmployee[$employeeId])) {
                $rowsByEmployee[$employeeId] = [];
            }

            $rowsByEmployee[$employeeId][$date] = $row;
        }

        $days = (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        $monthPad = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $today = date('Y-m-d');
        $result = [];

        foreach ($employees as $employee) {
            $employeeId = (int) ($employee['id'] ?? 0);
            if ($employeeId <= 0) {
                continue;
            }

            $employeeRows = $rowsByEmployee[$employeeId] ?? [];
            $attStatusMap = [];
            foreach ($employeeRows as $date => $row) {
                $attStatusMap[$date] = $row['status'] ?? '';
            }

            $effectiveJoin = self::getEffectiveJoinDateForMonth($employee['join_date'] ?? null, $month, $year);
            $weekdayStatus = $this->getWeekdayAttendanceStatusFromMap($attStatusMap, $month, $year, null, $effectiveJoin);
            $tuesdayAbsentMap = $weekdayStatus['tuesday_absent_map'] ?? [];

            for ($d = 1; $d <= $days; $d++) {
                $dayPad = str_pad((string) $d, 2, '0', STR_PAD_LEFT);
                $ymd = "{$year}-{$monthPad}-{$dayPad}";

                if ($effectiveJoin !== null && $ymd < $effectiveJoin) {
                    continue;
                }

                if (isset($employeeRows[$ymd])) {
                    $row = $employeeRows[$ymd];

                    if (self::isWeekday($ymd) && !empty($tuesdayAbsentMap[$ymd])) {
                        if (($row['status'] ?? '') !== 'present' && ($row['status'] ?? '') !== 'half_day') {
                            $row['status'] = 'absent';
                        }
                    } elseif (self::isWeekday($ymd) && ($row['status'] ?? '') === 'holiday') {
                        $row['status'] = 'weekend';
                    }

                    $result[] = [
                        'employee_id' => $employeeId,
                        'date' => $ymd,
                        'status' => $row['status'] ?? '',
                        'check_in' => $row['check_in'] ?? null,
                        'check_out' => $row['check_out'] ?? null,
                    ];
                    continue;
                }

                if (self::isWeekday($ymd) && $ymd <= $today) {
                    $result[] = [
                        'employee_id' => $employeeId,
                        'date' => $ymd,
                        'status' => !empty($tuesdayAbsentMap[$ymd]) ? 'absent' : 'weekend',
                        'check_in' => null,
                        'check_out' => null,
                    ];
                }
            }
        }

        return $result;
    }
}
