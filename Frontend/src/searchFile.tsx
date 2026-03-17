import React, { createContext, useState, useContext, ReactNode } from 'react';

//New file to allow 'broadcasting' of what user is typing in search, prevents having to pass search data through every single component

interface SearchType {
  search: string;
  setSearch: (query: string) => void;
  category: string;
  setCategory: (category: string) => void;
//Fields to track the date filter
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

const SearchContext = createContext<SearchType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => { //Defines a component that takes children (the entire app) as a prop
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <SearchContext.Provider value={{ search, setSearch, category, setCategory, startDate, endDate, setStartDate, setEndDate }}> { /* The value contains the data */ }
      {children}
    </SearchContext.Provider>
  );
  //Renders rest of the app inside the provider. Without {children}, app disappears. Ensures the UI still shows up while the data moves behind everything.
};

export const useSearch = () => { //Defines a custom hook to talk to Search Context File.
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used within a SearchProvider"); //If you use useSearch() in a component not wrapped by the SearchProvider it will crash the app and tell why
  return context;
};