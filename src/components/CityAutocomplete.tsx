import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface City {
  city_id: string;
  city_name: string;
  state_name: string;
  tier: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Search or enter city name...',
}: CityAutocompleteProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (value.trim()) {
      const filtered = cities.filter(
        (city) =>
          city.city_name.toLowerCase().includes(value.toLowerCase()) ||
          city.state_name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowDropdown(false);
    }
    setHighlightedIndex(-1);
  }, [value, cities]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(
          `
          city_id,
          city_name,
          tier,
          states!inner(state_name)
        `
        )
        .eq('is_active', true)
        .order('city_name');

      if (error) throw error;

      const formattedCities = (data || []).map((item: any) => ({
        city_id: item.city_id,
        city_name: item.city_name,
        state_name: item.states.state_name,
        tier: item.tier,
      }));

      setCities(formattedCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  }

  function handleSelect(city: City) {
    onChange(city.city_name);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || filteredCities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
          handleSelect(filteredCities[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  function handleFocus() {
    if (value.trim() && filteredCities.length > 0) {
      setShowDropdown(true);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          autoComplete="off"
        />
      </div>

      {showDropdown && filteredCities.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredCities.map((city, index) => (
            <div
              key={city.city_id}
              onClick={() => handleSelect(city)}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{city.city_name}</span>
                  <span className="text-gray-500 text-sm ml-2">{city.state_name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {city.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
