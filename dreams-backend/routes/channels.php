<?php

use Illuminate\Support\Facades\Broadcast;

/**
 * User-specific notification channel
 * Only the user themselves can listen to their notifications
 */
Broadcast::channel('notifications.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Admin notifications channel
 * Only admins and coordinators can listen
 */
Broadcast::channel('admin.notifications', function ($user) {
    return $user->role === 'admin' || $user->role === 'coordinator';
});

/**
 * Default user channel (for Laravel Echo)
 */
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
