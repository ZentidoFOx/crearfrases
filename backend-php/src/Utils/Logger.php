<?php

namespace App\Utils;

class Logger
{
    private static string $debugLogPath;
    private static string $errorLogPath;
    private static bool $initialized = false;

    private static function init(): void
    {
        if (self::$initialized) {
            return;
        }

        self::$debugLogPath = __DIR__ . '/../../logs/debug.log';
        self::$errorLogPath = __DIR__ . '/../../logs/error.log';
        self::$initialized = true;

        // Create log files if they don't exist
        if (!file_exists(self::$debugLogPath)) {
            touch(self::$debugLogPath);
        }
        if (!file_exists(self::$errorLogPath)) {
            touch(self::$errorLogPath);
        }
    }

    /**
     * Log debug information
     */
    public static function debug(string $message, array $context = []): void
    {
        self::init();
        self::writeLog(self::$debugLogPath, 'DEBUG', $message, $context);
    }

    /**
     * Log info message
     */
    public static function info(string $message, array $context = []): void
    {
        self::init();
        self::writeLog(self::$debugLogPath, 'INFO', $message, $context);
    }

    /**
     * Log warning
     */
    public static function warning(string $message, array $context = []): void
    {
        self::init();
        self::writeLog(self::$debugLogPath, 'WARNING', $message, $context);
    }

    /**
     * Log error
     */
    public static function error(string $message, array $context = []): void
    {
        self::init();
        self::writeLog(self::$errorLogPath, 'ERROR', $message, $context);
        // Also write to debug log
        self::writeLog(self::$debugLogPath, 'ERROR', $message, $context);
    }

    /**
     * Log critical error
     */
    public static function critical(string $message, array $context = []): void
    {
        self::init();
        self::writeLog(self::$errorLogPath, 'CRITICAL', $message, $context);
        self::writeLog(self::$debugLogPath, 'CRITICAL', $message, $context);
    }

    /**
     * Write log entry to file
     */
    private static function writeLog(string $filePath, string $level, string $message, array $context = []): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' | Context: ' . json_encode($context) : '';
        $logEntry = "[{$timestamp}] [{$level}] {$message}{$contextStr}\n";

        file_put_contents($filePath, $logEntry, FILE_APPEND);
    }

    /**
     * Clear debug log
     */
    public static function clearDebug(): void
    {
        self::init();
        file_put_contents(self::$debugLogPath, '');
    }

    /**
     * Clear error log
     */
    public static function clearError(): void
    {
        self::init();
        file_put_contents(self::$errorLogPath, '');
    }

    /**
     * Get last N lines from debug log
     */
    public static function getDebugLines(int $lines = 100): string
    {
        self::init();
        return self::getLastLines(self::$debugLogPath, $lines);
    }

    /**
     * Get last N lines from error log
     */
    public static function getErrorLines(int $lines = 100): string
    {
        self::init();
        return self::getLastLines(self::$errorLogPath, $lines);
    }

    /**
     * Get last N lines from a file
     */
    private static function getLastLines(string $filePath, int $lines): string
    {
        if (!file_exists($filePath)) {
            return '';
        }

        $file = file($filePath);
        if (!$file) {
            return '';
        }

        return implode('', array_slice($file, -$lines));
    }
}
