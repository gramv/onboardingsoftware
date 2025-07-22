import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  status: 'active' | 'completed' | 'pending_approval';
  location: string;
  notes?: string;
}

interface WeeklyTimesheet {
  weekOf: string;
  entries: TimeEntry[];
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
}

export const TimeTracking: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [selectedWeek] = useState(new Date());
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for time entries
  const timeEntries: TimeEntry[] = [
    {
      id: '1',
      date: '2024-01-15',
      clockIn: '08:00',
      clockOut: '16:00',
      breakStart: '12:00',
      breakEnd: '12:30',
      totalHours: 7.5,
      status: 'completed',
      location: 'Main Lobby',
      notes: 'Regular shift',
    },
    {
      id: '2',
      date: '2024-01-16',
      clockIn: '16:00',
      clockOut: '00:00',
      breakStart: '20:00',
      breakEnd: '20:30',
      totalHours: 7.5,
      status: 'completed',
      location: 'Main Lobby',
    },
    {
      id: '3',
      date: '2024-01-17',
      clockIn: '08:00',
      clockOut: '16:00',
      breakStart: '12:00',
      breakEnd: '12:30',
      totalHours: 7.5,
      status: 'pending_approval',
      location: 'Main Lobby',
    },
    {
      id: '4',
      date: '2024-01-18',
      clockIn: '08:00',
      totalHours: 0,
      status: 'active',
      location: 'Main Lobby',
    },
  ];

  // Mock weekly timesheet data
  const weeklyTimesheets: WeeklyTimesheet[] = [
    {
      weekOf: '2024-01-15',
      entries: timeEntries,
      totalHours: 22.5,
      status: 'submitted',
      submittedAt: '2024-01-19T17:00:00Z',
    },
    {
      weekOf: '2024-01-08',
      entries: [],
      totalHours: 40,
      status: 'approved',
      submittedAt: '2024-01-12T17:00:00Z',
      approvedAt: '2024-01-13T09:00:00Z',
    },
  ];

  const formatTime = (time: string | Date) => {
    if (typeof time === 'string') {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const calculateHoursWorked = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return 0;
    
    const [inHours, inMinutes] = clockIn.split(':').map(Number);
    const [outHours, outMinutes] = clockOut.split(':').map(Number);
    
    let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    
    // Handle overnight shifts
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    return totalMinutes / 60;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimesheetStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClockIn = () => {
    const now = new Date();
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      clockIn: now.toTimeString().slice(0, 5),
      totalHours: 0,
      status: 'active',
      location: 'Main Lobby',
    };
    
    setCurrentEntry(newEntry);
    setIsClockedIn(true);
    console.log('Clocked in:', newEntry);
  };

  const handleClockOut = () => {
    if (currentEntry) {
      const now = new Date();
      const updatedEntry = {
        ...currentEntry,
        clockOut: now.toTimeString().slice(0, 5),
        totalHours: calculateHoursWorked(currentEntry.clockIn, now.toTimeString().slice(0, 5)),
        status: 'completed' as const,
      };
      
      console.log('Clocked out:', updatedEntry);
      setCurrentEntry(null);
      setIsClockedIn(false);
      setIsOnBreak(false);
    }
  };

  const handleBreakStart = () => {
    if (currentEntry) {
      const now = new Date();
      const updatedEntry = {
        ...currentEntry,
        breakStart: now.toTimeString().slice(0, 5),
      };
      setCurrentEntry(updatedEntry);
      setIsOnBreak(true);
      console.log('Break started:', updatedEntry);
    }
  };

  const handleBreakEnd = () => {
    if (currentEntry) {
      const now = new Date();
      const updatedEntry = {
        ...currentEntry,
        breakEnd: now.toTimeString().slice(0, 5),
      };
      setCurrentEntry(updatedEntry);
      setIsOnBreak(false);
      console.log('Break ended:', updatedEntry);
    }
  };

  const submitTimesheet = () => {
    console.log('Submitting timesheet for week of:', selectedWeek);
    setShowTimesheetModal(false);
  };

  const renderClockInOut = () => (
    <Card>
      <CardHeader>
        <CardTitle>Time Clock</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          {/* Current Time Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {formatTime(currentTime)}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Current Status */}
          {isClockedIn && currentEntry && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Currently Clocked In
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Started at {formatTime(currentEntry.clockIn)} • {currentEntry.location}
              </p>
              {isOnBreak && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  On break since {currentEntry.breakStart && formatTime(currentEntry.breakStart)}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isClockedIn ? (
              <Button 
                size="lg" 
                className="h-16 text-lg"
                onClick={handleClockIn}
              >
                <Icon name="Play" size={24} className="mr-2" />
                Clock In
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="error"
                  className="h-16 text-lg"
                  onClick={handleClockOut}
                >
                  <Icon name="Square" size={24} className="mr-2" />
                  Clock Out
                </Button>
                {!isOnBreak ? (
                  <Button 
                    size="lg" 
                    variant="warning"
                    className="h-16 text-lg"
                    onClick={handleBreakStart}
                  >
                    <Icon name="Coffee" size={24} className="mr-2" />
                    Start Break
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    variant="success"
                    className="h-16 text-lg"
                    onClick={handleBreakEnd}
                  >
                    <Icon name="Play" size={24} className="mr-2" />
                    End Break
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">32</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">5</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Days This Week</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTimeEntries = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Time Entries</CardTitle>
          <Button size="sm" onClick={() => setShowTimesheetModal(true)}>
            <Icon name="FileText" size={16} className="mr-1" />
            View Timesheet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timeEntries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Clock" size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'Active'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.location}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  {entry.totalHours.toFixed(1)}h
                </p>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                  {entry.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderWeeklyTimesheets = () => (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Timesheets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weeklyTimesheets.map((timesheet, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name="Calendar" size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Week of {new Date(timesheet.weekOf).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {timesheet.totalHours} hours total
                  </p>
                  {timesheet.submittedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted {new Date(timesheet.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded text-xs font-medium ${getTimesheetStatusColor(timesheet.status)}`}>
                  {timesheet.status.replace('_', ' ').toUpperCase()}
                </div>
                <Button size="sm" variant="ghost" className="mt-1">
                  <Icon name="Eye" size={14} className="mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderTimesheetModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Timesheet</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowTimesheetModal(false)}>
              <Icon name="X" size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Week Selection */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Week of {selectedWeek.toLocaleDateString()}
              </h3>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                <Button size="sm" variant="ghost">
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            </div>

            {/* Time Entries Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Clock In</th>
                    <th className="text-left p-2">Clock Out</th>
                    <th className="text-left p-2">Break</th>
                    <th className="text-left p-2">Total Hours</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="border-b">
                      <td className="p-2">
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="p-2">{formatTime(entry.clockIn)}</td>
                      <td className="p-2">{entry.clockOut ? formatTime(entry.clockOut) : '-'}</td>
                      <td className="p-2">
                        {entry.breakStart && entry.breakEnd 
                          ? `${formatTime(entry.breakStart)} - ${formatTime(entry.breakEnd)}`
                          : '-'
                        }
                      </td>
                      <td className="p-2 font-medium">{entry.totalHours.toFixed(1)}h</td>
                      <td className="p-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="p-2" colSpan={4}>Total Hours:</td>
                    <td className="p-2">{timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0).toFixed(1)}h</td>
                    <td className="p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowTimesheetModal(false)}>
                Close
              </Button>
              <Button onClick={submitTimesheet}>
                <Icon name="Send" size={16} className="mr-1" />
                Submit for Approval
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Time Tracking</h2>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost">
            <Icon name="History" size={16} className="mr-1" />
            History
          </Button>
          <Button size="sm" variant="ghost">
            <Icon name="Download" size={16} className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Clock Interface */}
      {renderClockInOut()}

      {/* Time Tracking Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTimeEntries()}
        {renderWeeklyTimesheets()}
      </div>

      {/* Timesheet Modal */}
      {showTimesheetModal && renderTimesheetModal()}
    </div>
  );
};