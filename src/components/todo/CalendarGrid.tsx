import {
  format,
  addDays,
  isSameMonth,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfToday,
  subMonths,
  addMonths,
  getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Todo } from '../../types';

interface CalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  groupedTodos: Record<string, Todo[]>;
  onDropTodoOnDate: (todoId: string, date: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, groupedTodos, onDropTodoOnDate }: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = addDays(monthStart, -getDay(monthStart));
  const endDate = addDays(monthEnd, 6 - getDay(monthEnd));

  const weeks: Date[][] = [];
  let day = startDate;
  while (day <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)] px-2">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-[var(--bg-card)] rounded text-[var(--text-secondary)]" aria-label="Previous month">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentMonth(startOfToday())} className="hover:bg-[var(--bg-card)] text-[var(--text-secondary)] text-sm font-semibold px-2 py-1 rounded">
            Today
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-[var(--bg-card)] rounded text-[var(--text-secondary)]" aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-start border-l border-t border-[var(--border-light)] rounded-tl-lg bg-[var(--bg-sidebar)]">
        <div className="grid grid-cols-7 border-b border-[var(--border-light)] bg-[var(--bg-sidebar)]">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={label} className={`text-center py-2 text-xs text-[var(--text-muted)] border-r border-[var(--border-light)] ${i === 6 ? 'border-r-0' : ''}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-[var(--bg-app)]">
          {weeks.map((week) => (
            <div className="grid grid-cols-7" key={week[0].toISOString()}>
              {week.map((cloneDay) => {
                const dateStr = format(cloneDay, 'yyyy-MM-dd');
                const dayTodos = groupedTodos[dateStr] || [];
                const isSelected = dateStr === selectedDate;
                const isSameMonthDate = isSameMonth(cloneDay, monthStart);
                const isTodayDate = isToday(cloneDay);

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const todoId = e.dataTransfer.getData('text/plain');
                      if (todoId) onDropTodoOnDate(todoId, dateStr);
                    }}
                    className={`flex flex-col p-2 transition-all min-h-[100px] sm:min-h-[120px] border-r border-b border-[var(--border-light)] relative
                      ${!isSameMonthDate ? 'text-[var(--text-faint)]' : isSelected ? 'bg-[var(--bg-card)]' : 'hover:bg-[var(--bg-card)] text-[var(--text-primary)]'}
                    `}
                  >
                    <div className="w-full flex justify-end">
                      <span
                        className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                          isTodayDate ? 'bg-rose-400 text-white' : ''
                        } ${!isTodayDate && isSelected ? 'font-bold' : ''}`}
                      >
                        {!isSameMonthDate && cloneDay.getDate() === 1 ? format(cloneDay, 'MMM d') : format(cloneDay, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 w-full mt-1 flex flex-col items-start gap-1 overflow-y-auto scrollbar-hide py-1">
                      {dayTodos.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={`w-full text-left text-xs px-1.5 py-1 rounded truncate border border-[var(--border-base)] ${
                            t.completed ? 'bg-[var(--bg-app)] text-[var(--text-faint)] line-through' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTodos.length > 3 && <div className="w-full text-left text-[10px] text-[var(--text-muted)] px-1.5">+{dayTodos.length - 3} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
