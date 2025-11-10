<?php

namespace App\Validators;

use App\Utils\Security;

class UserValidator
{
    /**
     * Validate registration data
     */
    public static function validateRegister(array $data): array
    {
        $errors = [];

        // First name
        if (empty($data['first_name'])) {
            $errors['first_name'][] = 'El nombre es requerido';
        } elseif (strlen($data['first_name']) < 2) {
            $errors['first_name'][] = 'El nombre debe tener al menos 2 caracteres';
        } elseif (strlen($data['first_name']) > 100) {
            $errors['first_name'][] = 'El nombre no puede exceder 100 caracteres';
        }

        // Last name
        if (empty($data['last_name'])) {
            $errors['last_name'][] = 'El apellido es requerido';
        } elseif (strlen($data['last_name']) < 2) {
            $errors['last_name'][] = 'El apellido debe tener al menos 2 caracteres';
        } elseif (strlen($data['last_name']) > 100) {
            $errors['last_name'][] = 'El apellido no puede exceder 100 caracteres';
        }

        // Email
        if (empty($data['email'])) {
            $errors['email'][] = 'El email es requerido';
        } elseif (!Security::isValidEmail($data['email'])) {
            $errors['email'][] = 'El email no es válido';
        } elseif (strlen($data['email']) > 255) {
            $errors['email'][] = 'El email no puede exceder 255 caracteres';
        }

        // Password
        if (empty($data['password'])) {
            $errors['password'][] = 'La contraseña es requerida';
        } else {
            $passwordCheck = Security::isStrongPassword($data['password']);
            if (!$passwordCheck['valid']) {
                $errors['password'] = $passwordCheck['errors'];
            }
        }

        // Password confirmation
        if (empty($data['password_confirmation'])) {
            $errors['password_confirmation'][] = 'La confirmación de contraseña es requerida';
        } elseif ($data['password'] !== $data['password_confirmation']) {
            $errors['password_confirmation'][] = 'Las contraseñas no coinciden';
        }

        // Company (optional)
        if (!empty($data['company']) && strlen($data['company']) > 150) {
            $errors['company'][] = 'El nombre de la empresa no puede exceder 150 caracteres';
        }

        // Phone (optional)
        if (!empty($data['phone']) && strlen($data['phone']) > 20) {
            $errors['phone'][] = 'El teléfono no puede exceder 20 caracteres';
        }

        return $errors;
    }

    /**
     * Validate login data
     */
    public static function validateLogin(array $data): array
    {
        $errors = [];

        if (empty($data['email'])) {
            $errors['email'][] = 'El email es requerido';
        } elseif (!Security::isValidEmail($data['email'])) {
            $errors['email'][] = 'El email no es válido';
        }

        if (empty($data['password'])) {
            $errors['password'][] = 'La contraseña es requerida';
        }

        return $errors;
    }

    /**
     * Validate profile update data
     */
    public static function validateProfileUpdate(array $data): array
    {
        $errors = [];

        // First name
        if (isset($data['first_name'])) {
            if (strlen($data['first_name']) < 2) {
                $errors['first_name'][] = 'El nombre debe tener al menos 2 caracteres';
            } elseif (strlen($data['first_name']) > 100) {
                $errors['first_name'][] = 'El nombre no puede exceder 100 caracteres';
            }
        }

        // Last name
        if (isset($data['last_name'])) {
            if (strlen($data['last_name']) < 2) {
                $errors['last_name'][] = 'El apellido debe tener al menos 2 caracteres';
            } elseif (strlen($data['last_name']) > 100) {
                $errors['last_name'][] = 'El apellido no puede exceder 100 caracteres';
            }
        }

        // Phone
        if (isset($data['phone']) && !empty($data['phone'])) {
            if (strlen($data['phone']) > 20) {
                $errors['phone'][] = 'El teléfono no puede exceder 20 caracteres';
            }
        }

        // Company
        if (isset($data['company']) && !empty($data['company'])) {
            if (strlen($data['company']) > 150) {
                $errors['company'][] = 'El nombre de la empresa no puede exceder 150 caracteres';
            }
        }

        // Job title
        if (isset($data['job_title']) && !empty($data['job_title'])) {
            if (strlen($data['job_title']) > 100) {
                $errors['job_title'][] = 'El cargo no puede exceder 100 caracteres';
            }
        }

        return $errors;
    }

    /**
     * Validate password change data
     */
    public static function validatePasswordChange(array $data): array
    {
        $errors = [];

        if (empty($data['current_password'])) {
            $errors['current_password'][] = 'La contraseña actual es requerida';
        }

        if (empty($data['new_password'])) {
            $errors['new_password'][] = 'La nueva contraseña es requerida';
        } else {
            if ($data['new_password'] === $data['current_password']) {
                $errors['new_password'][] = 'La nueva contraseña debe ser diferente a la actual';
            }

            $passwordCheck = Security::isStrongPassword($data['new_password']);
            if (!$passwordCheck['valid']) {
                $errors['new_password'] = $passwordCheck['errors'];
            }
        }

        if (empty($data['new_password_confirmation'])) {
            $errors['new_password_confirmation'][] = 'La confirmación de contraseña es requerida';
        } elseif ($data['new_password'] !== $data['new_password_confirmation']) {
            $errors['new_password_confirmation'][] = 'Las contraseñas no coinciden';
        }

        return $errors;
    }
}
