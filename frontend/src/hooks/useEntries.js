import { useState, useEffect } from "react";
import { entryService } from "../services/api";

export const useEntries = (year = null) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = async (filterYear = year) => {
    try {
      setLoading(true);
      const data = await entryService.getAll(filterYear);
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const createEntry = async (data) => {
    try {
      const newEntry = await entryService.create(data);
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateEntry = async (id, data) => {
    try {
      const updatedEntry = await entryService.update(id, data);
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        )
      );
      return updatedEntry;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteEntry = async (id) => {
    try {
      await entryService.delete(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    entries,
    loading,
    error,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
