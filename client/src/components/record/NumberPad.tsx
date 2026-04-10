import { Delete, Check } from 'lucide-react';

interface NumberPadProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
}

const keys = ['1','2','3','4','5','6','7','8','9','.','0'];

export default function NumberPad({ onInput, onDelete, onConfirm }: NumberPadProps) {
  return (
    <div className="bg-gray-50 p-1">
      <div className="grid grid-cols-4 gap-1">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onInput(key)}
            className="flex items-center justify-center bg-white rounded-xl h-14 text-xl font-medium active:bg-gray-100 active:scale-95 transition-all"
          >
            {key}
          </button>
        ))}
        {/* Delete button */}
        <button
          onClick={onDelete}
          className="flex items-center justify-center bg-white rounded-xl h-14 active:bg-gray-100 active:scale-95 transition-all"
        >
          <Delete className="w-5 h-5 text-gray-500" />
        </button>
        {/* Confirm button */}
        <button
          onClick={onConfirm}
          className="col-span-3 flex items-center justify-center bg-primary text-white rounded-xl h-14 text-base font-medium active:bg-primary-light active:scale-95 transition-all"
        >
          <Check className="w-6 h-6 mr-2" /> 确认
        </button>
      </div>
    </div>
  );
}
