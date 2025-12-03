
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  channelName: string;
}

const DeleteChatModal: React.FC<DeleteChatModalProps> = ({ isOpen, onClose, onConfirm, channelName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in">
      <div className="bg-gray-850 w-full max-w-md rounded-lg shadow-2xl p-6 border border-gray-900 transform scale-100 transition-all">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-2">Удалить чат с '{channelName}'?</h2>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 flex gap-3">
             <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
             <p className="text-sm text-gray-300">
               Вы уверены? Это действие удалит чат из вашего списка. История сообщений будет удалена с этого устройства. Это действие необратимо.
             </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 bg-gray-900/50 -mx-6 -mb-6 px-6 py-4 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded hover:underline text-gray-300 text-sm font-medium transition-colors"
          >
            Отмена
          </button>
          <button 
            onClick={onConfirm}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
          >
            Удалить чат
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatModal;
