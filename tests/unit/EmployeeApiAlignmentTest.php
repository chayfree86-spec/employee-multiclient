<?php

use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class EmployeeApiAlignmentTest extends CIUnitTestCase
{
    public function testEmployeeApiModelAllowsRolePersistence(): void
    {
        $contents = file_get_contents(__DIR__ . '/../../employee-api/app/Models/EmployeeModel.php');

        $this->assertIsString($contents);
        $this->assertStringContainsString("'role'", $contents);
    }

    public function testAdvanceOvertimeFineAmountMustBePositive(): void
    {
        $contents = file_get_contents(__DIR__ . '/../../employee-api/app/Models/AdvanceOvertimeFineModel.php');

        $this->assertIsString($contents);
        $this->assertStringContainsString("'amount' => 'required|numeric|greater_than[0]'", $contents);
        $this->assertStringContainsString('saving_deposit', $contents);
        $this->assertStringContainsString('transfer_loan_to_saving', $contents);
    }

    public function testAdvanceOvertimeFineControllerGuardsBalances(): void
    {
        $contents = file_get_contents(__DIR__ . '/../../employee-api/app/Controllers/AdvanceOvertimeFineController.php');

        $this->assertIsString($contents);
        $this->assertStringContainsString('Received amount exceeds loan balance', $contents);
        $this->assertStringContainsString('Withdraw amount exceeds saving balance', $contents);
        $this->assertStringContainsString('validateMovementBalances', $contents);
    }

    public function testTransferRouteExists(): void
    {
        $contents = file_get_contents(__DIR__ . '/../../employee-api/app/Config/Routes.php');

        $this->assertIsString($contents);
        $this->assertStringContainsString("\$routes->post('aof/transfer'", $contents);
    }

    public function testPayrollSettingsAreExposedThroughApi(): void
    {
        $contents = file_get_contents(__DIR__ . '/../../employee-api/app/Controllers/SettingsController.php');

        $this->assertIsString($contents);
        $this->assertStringContainsString("'payroll_mode'", $contents);
        $this->assertStringContainsString("'monthly_days'", $contents);
        $this->assertStringContainsString('payroll_mode must be "monthly" or "per_day"', $contents);
        $this->assertStringContainsString('monthly_days must be between 28 and 31', $contents);
    }

    public function testPayrollUsesFixedMonthlyDaysDivisorFromBackendSettings(): void
    {
        $settings = file_get_contents(__DIR__ . '/../../employee-api/app/Models/SettingsModel.php');
        $payroll = file_get_contents(__DIR__ . '/../../employee-api/app/Models/PayrollModel.php');

        $this->assertIsString($settings);
        $this->assertIsString($payroll);
        $this->assertStringContainsString("getSetting('payroll_mode', 'monthly')", $settings);
        $this->assertStringContainsString("getSetting('monthly_days', '30')", $settings);
        $this->assertStringContainsString('date(\'t\', mktime(0, 0, 0, $month, 1, $year))', $settings);
        $this->assertStringContainsString('$settingsModel->getDaysDivisor($month, $year)', $payroll);
        $this->assertStringContainsString("'days_divisor' => \$workingDaysInMonth", $payroll);
    }
}
