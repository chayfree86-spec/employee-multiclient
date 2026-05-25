<?php

namespace Config;

/**
 * Paths
 */
class Paths
{
    /**
     * SYSTEM FOLDER NAME
     */
    public string $systemDirectory = __DIR__ . '/../../../vendor/codeigniter4/framework/system';

    /**
     * APPLICATION FOLDER NAME
     */
    public string $appDirectory = __DIR__ . '/..';

    /**
     * WRITABLE DIRECTORY NAME
     */
    public string $writableDirectory = __DIR__ . '/../../writable';

    /**
     * TESTS DIRECTORY NAME
     */
    public string $testsDirectory = __DIR__ . '/../../../tests';

    /**
     * VIEW DIRECTORY NAME
     */
    public string $viewDirectory = __DIR__ . '/../Views';
}
