<?php

namespace Config;

/**
 * Weekday (weekly off) configuration.
 * Tuesday = 2 (PHP date('w'): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
 */
class Weekday
{
    /** Day of week: 2 = Tuesday */
    public const WEEKDAY = 2;

    /** Label for display */
    public const LABEL = 'Tuesday';
}
