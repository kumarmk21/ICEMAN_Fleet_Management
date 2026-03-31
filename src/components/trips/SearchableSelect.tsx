import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  required = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setQuery('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={handleOpen}
        className={`flex items-center gap-2 w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'bg-white border-gray-300 hover:border-blue-400'}
          ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className={`flex-1 text-sm truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {required && !disabled && (
        <input
          tabIndex={-1}
          required={required}
          value={value}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
          aria-hidden
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">No results</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors
                    ${option.value === value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
