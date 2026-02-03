import React, { useState, useEffect, useCallback } from 'react';
import { taskService } from '../../api/services';
import { Button, Input, LoadingSpinner, FormModal } from '../ui';
import { Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CoordinatorChecklist = ({ bookingId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await taskService.getByBooking(bookingId);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchTasks();
    }
  }, [bookingId, fetchTasks]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setSubmitting(true);
    try {
      await taskService.create(bookingId, newTask);
      toast.success('Task added successfully');
      setNewTask({ title: '', description: '', due_date: '' });
      setShowAddModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic update
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await taskService.update(task.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
      setTasks(oldTasks); // Revert
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    // Optimistic update
    const oldTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      await taskService.delete(taskId);
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      setTasks(oldTasks); // Revert
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coordinator Checklist</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount} of {tasks.length} tasks completed ({progress}%)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            No tasks yet. Add one to get started!
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
                task.status === 'completed' 
                  ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 opacity-75' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleTaskStatus(task)}
                className={`mt-0.5 flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors ${
                  task.status === 'completed' ? 'text-green-500 hover:text-green-600' : ''
                }`}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${
                  task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {task.description}
                  </p>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                    <CalendarIcon className="w-3 h-3" />
                    <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Task"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g., Confirm catering menu"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <Input
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Additional details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date (Optional)
            </label>
            <Input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

export default CoordinatorChecklist;
