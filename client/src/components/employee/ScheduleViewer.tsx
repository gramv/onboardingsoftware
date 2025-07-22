import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  location: string;
  status: 'scheduled' | 'completed' | 'missed' | 'requested_off';
  notes?: string;
}

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}

export const ScheduleViewer: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);

  // Mock data for shifts
  const shifts: Shift[] = [
    {
      id: '1',
      date: '2024-01-15',
      startTime: '08:00',
      endTime: '16:00',
      position: 'Front Desk',
      location: 'Main Lobby',
      status: 'scheduled',
    },
    {
      id: '2',
      date: '2024-01-16',
      startTime: '16:00',
      endTime: '00:00',
      position: 'Front Desk',
      location: 'Main Lobby',
      status: 'scheduled',
    },
    {
      id: '3',
      date: '2024-01-17',
      startTime: '08:00',
      endTime: '16:00',
      position: 'Front Desk',
      location: 'Main Lobby',
      status: 'completed',
    },
    {
      id: '4',
      date: '2024-01-18',
      startTime: '08:00',
      endTime: '16:00',
      position: 'Front Desk',
      location: 'Main Lobby',
      status: 'scheduled',
    },
  ];

  // Mock data for time off requests
  const timeOffRequests: TimeOffRequest[] = [
    {
      id: '1',
      startDate: '2024-01-22',
      endDate: '2024-01-24',
      reason: 'Personal vacation',
      status: 'pending',
      requestedAt: '2024-01-10',
    },
    {
      id: '2',
      startDate: '2024-01-08',
      endDate: '2024-01-08',
      reason: 'Doctor appointment',
      status: 'approved',
      requestedAt: '2024-01-05',
    },
  ];

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getShiftForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.find(shift => shift.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'requested_off':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentWeek);
    
    return (
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="ghost" onClick={() => navigateWeek('prev')}>
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Week of {weekDates[0].toLocaleDateString()}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => navigateWeek('next')}>
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
          <Button size="sm" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const shift = getShiftForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            return (
              <Card 
                key={index} 
                className={`${isToday ? 'ring-2 ring-primary-500' : ''} min-h-[120px]`}
              >
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {dayNames[index]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                  
                  {shift ? (
                    <div className="space-y-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(shift.status)}`}>
                        {shift.status.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
                        <p>{shift.position}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-gray-400">No shift</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUpcomingShifts = () => {
    const upcomingShifts = shifts
      .filter(shift => new Date(shift.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingShifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon name="Calendar" size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(shift.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)} • {shift.position}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(shift.status)}`}>
                  {shift.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            ))}
            
            {upcomingShifts.length === 0 && (
              <div className="text-center py-8">
                <Icon name="Calendar" size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No upcoming shifts scheduled</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTimeOffRequests = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Time Off Requests</CardTitle>
            <Button size="sm" onClick={() => setShowTimeOffModal(true)}>
              <Icon name="Plus" size={16} className="mr-1" />
              Request Time Off
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeOffRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Icon name="Plane" size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.reason}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Requested on {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                  {request.status.toUpperCase()}
                </div>
              </div>
            ))}
            
            {timeOffRequests.length === 0 && (
              <div className="text-center py-8">
                <Icon name="Plane" size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No time off requests</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Schedule</h2>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={viewMode === 'week' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'month' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Schedule View */}
      {viewMode === 'week' && renderWeekView()}

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUpcomingShifts()}
        {renderTimeOffRequests()}
      </div>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Week Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">32</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">24</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Missed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Off Request Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Time Off</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setShowTimeOffModal(false)}>
                  <Icon name="X" size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Please provide a reason for your time off request..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowTimeOffModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowTimeOffModal(false)}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};