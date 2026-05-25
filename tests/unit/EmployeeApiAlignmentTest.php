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
}
