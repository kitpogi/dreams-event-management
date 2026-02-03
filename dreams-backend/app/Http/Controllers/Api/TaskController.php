<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\BookingDetail;
use Illuminate\Http\Request;
use App\LogsAudit;

class TaskController extends Controller
{
    use LogsAudit;

    /**
     * Get tasks for a specific booking.
     */
    public function index(Request $request, $bookingId)
    {
        $booking = BookingDetail::findOrFail($bookingId);

        // Authorization check: Admin or assigned Coordinator
        $user = $request->user();
        if (!$user->isAdmin()) {
            if (!$user->isCoordinator() || $booking->coordinator_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $tasks = Task::where('booking_id', $bookingId)
            ->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $tasks]);
    }

    /**
     * Create a new task.
     */
    public function store(Request $request, $bookingId)
    {
        $booking = BookingDetail::findOrFail($bookingId);

        // Authorization check
        $user = $request->user();
        if (!$user->isAdmin()) {
            if (!$user->isCoordinator() || $booking->coordinator_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'status' => 'in:pending,completed',
        ]);

        $task = Task::create([
            'booking_id' => $bookingId,
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'status' => $request->status ?? 'pending',
        ]);

        $this->logAudit(
            'task.created',
            $booking,
            null,
            $task->toArray(),
            "Created task '{$task->title}' for booking #{$booking->booking_id}"
        );

        return response()->json(['data' => $task, 'message' => 'Task created successfully'], 201);
    }

    /**
     * Update a task.
     */
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $booking = $task->booking;

        // Authorization check
        $user = $request->user();
        if (!$user->isAdmin()) {
            if (!$user->isCoordinator() || $booking->coordinator_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'status' => 'in:pending,completed',
        ]);

        $oldTask = $task->toArray();
        $task->update($request->all());

        $this->logAudit(
            'task.updated',
            $booking,
            $oldTask,
            $task->toArray(),
            "Updated task '{$task->title}' for booking #{$booking->booking_id}"
        );

        return response()->json(['data' => $task, 'message' => 'Task updated successfully']);
    }

    /**
     * Delete a task.
     */
    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $booking = $task->booking;

        // Authorization check
        $user = $request->user();
        if (!$user->isAdmin()) {
            if (!$user->isCoordinator() || $booking->coordinator_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $taskTitle = $task->title;
        $task->delete();

        $this->logAudit(
            'task.deleted',
            $booking,
            ['id' => $id, 'title' => $taskTitle],
            null,
            "Deleted task '{$taskTitle}' from booking #{$booking->booking_id}"
        );

        return response()->json(['message' => 'Task deleted successfully']);
    }
}
