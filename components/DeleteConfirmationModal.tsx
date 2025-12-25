import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  id: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  title?: string;
  description?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  id,
  onClose,
  onConfirm,
  title = "Delete Development?",
  description = "This will permanently remove the development and all associated building blocks from the master database. This action is irreversible."
}) => {
  if (!id) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <AlertTriangle size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
          {description}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(id)} 
            className="flex-1 py-4 bg-red-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-red-700 rounded-2xl shadow-lg shadow-red-100 transition-all"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;