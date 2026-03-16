import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Exam, mockExams } from '../data';
import { api } from '../services/api'; // Import API service

interface ExamContextType {
  exams: Exam[];
  addExam: (exam: Exam) => void;
  deleteExam: (id: string) => void;
  updateExam: (updatedExam: Exam) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>(mockExams);

  // API Integration: Fetch Exams on Mount
  /*
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await api.exams.getAll();
        setExams(data);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };
    fetchExams();
  }, []);
  */

  const addExam = async (exam: Exam) => {
    // API Integration: Create Exam
    /*
    try {
      const newExam = await api.exams.create(exam);
      setExams((prev) => [...prev, newExam]);
    } catch (error) {
      console.error('Failed to create exam:', error);
    }
    */
    setExams((prev) => [...prev, exam]);
  };

  const deleteExam = async (id: string) => {
    // API Integration: Delete Exam
    /*
    try {
      await api.exams.delete(id);
      setExams((prev) => prev.filter((exam) => exam.id !== id));
    } catch (error) {
      console.error('Failed to delete exam:', error);
    }
    */
    setExams((prev) => prev.filter((exam) => exam.id !== id));
  };

  const updateExam = async (updatedExam: Exam) => {
    // API Integration: Update Exam
    /*
    try {
      const result = await api.exams.update(updatedExam.id, updatedExam);
      setExams((prev) => prev.map((exam) => (exam.id === updatedExam.id ? result : exam)));
    } catch (error) {
      console.error('Failed to update exam:', error);
    }
    */
    setExams((prev) => prev.map((exam) => (exam.id === updatedExam.id ? updatedExam : exam)));
  };

  return (
    <ExamContext.Provider value={{ exams, addExam, deleteExam, updateExam }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExams() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExams must be used within an ExamProvider');
  }
  return context;
}
