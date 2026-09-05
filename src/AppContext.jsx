import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [turnus, setTurnus] = useState(true);
  const [teachersData, setTeachersData] = useState([]);
  const [teacherId, setTeacherId] = useState(null);
  const [savedTeacherId, setSavedTeacherId] = useState(null);
  const [teachersSearchInput, setTeachersSearchInput] = useState("");
  const [classesData, setClassesData] = useState([]);
  const [classId, setClassId] = useState(null);
  const [savedClassId, setSavedClassId] = useState(null);
  const [classesSearchInput, setClassesSearchInput] = useState("");
  const [classroomsData, setClassroomsData] = useState([]);
  const [classroomId, setClassroomId] = useState(null);
  const [savedClassroomId, setSavedClassroomId] = useState(null);
  const [classroomsSearchInput, setClassroomsSearchInput] = useState("");

  const [isDarkModeStored, setIsDarkModeStored] = useState(() => {
    const storedIsDarkMode = localStorage.getItem("isDarkMode");
    console.log("AppContext > useState() > storedIsDarkMode:", storedIsDarkMode);
    return storedIsDarkMode;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return isDarkModeStored === null
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : isDarkModeStored === "true";
  });

  // Change dark mode when the user changes their preference in the OS settings
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  function getWeekNumber() {
    let currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 52);
    currentDate.setUTCDate(currentDate.getUTCDate() + 4 - (currentDate.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    // @ts-ignore
    return Math.ceil((((currentDate - yearStart) / 86400000) + 1) / 7);
  }

  useEffect(() => {
    getWeekNumber() % 2 != 0 ? setTurnus(true) : setTurnus(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    return () => clearInterval(timer);
  }, []);

  return (
    <AppContext.Provider value={{
      isDarkMode, setIsDarkMode,
      currentTime, setCurrentTime,
      turnus, setTurnus,
      teachersData, setTeachersData,
      teacherId, setTeacherId,
      savedTeacherId, setSavedTeacherId,
      teachersSearchInput, setTeachersSearchInput,
      classesData, setClassesData,
      classId, setClassId,
      savedClassId, setSavedClassId,
      classesSearchInput, setClassesSearchInput,
      classroomsData, setClassroomsData,
      classroomId, setClassroomId,
      savedClassroomId, setSavedClassroomId,
      classroomsSearchInput, setClassroomsSearchInput
    }}>
      {children}
    </AppContext.Provider>
  );
}