import { useState } from 'react';
import { 
  Plus, Search, Clock, CheckCircle2, AlertCircle, 
  Leaf, Tractor, ClipboardList, Filter, MoreHorizontal, Minus
} from 'lucide-react';

const mockTasks = [
  { id: 1, title: 'Fertilizing MR1', category: 'Crop Care', priority: 'High', status: 'Pending', assignedTo: 'Jabir' },
  { id: 2, title: 'Land Clearing MR2', category: 'Maintenance', priority: 'Medium', status: 'In Progress', assignedTo: 'Askan' },
  { id: 3, title: 'Tractor Oil Change', category: 'Equipment', priority: 'High', status: 'Pending', assignedTo: 'Jarsan' },
];

export default function Operations() {
  const [tasks, setTasks] = useState(mockTasks);

  const getPriorityColor = (p) => {
    if (p === 'High') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
           <h1 className="text-2xl font-black text-gray-900">Estate Operations</h1>
           <p className="text-sm text-gray-500 font-medium">Coordinate daily field activities and maintenance</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md hover:shadow-lg transition-all">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* ── KANBAN COLUMNS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Pending', 'In Progress', 'Completed'].map((status) => (
          <div key={status} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">{status}</h3>
                <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100">
                   {tasks.filter(t => t.status === status).length}
                </span>
             </div>
             
             <div className="flex flex-col gap-3">
               {tasks.filter(t => t.status === status).map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                       </span>
                       <MoreHorizontal size={14} className="text-gray-300 group-hover:text-gray-600" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-[11px] text-gray-500 font-medium mb-3">{task.category} • {task.assignedTo}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg w-max">
                       <Clock size={12} /> Due Today
                    </div>
                 </div>
               ))}
               
               {/* Add Task Trigger */}
               <button className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} /> Add Task
               </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}