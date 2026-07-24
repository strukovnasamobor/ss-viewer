import "./Header.css";
import { AppContext } from "../AppContext";
import { menuOutline, saveOutline, homeOutline, swapHorizontalOutline } from "ionicons/icons";
import { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useIonRouter, IonHeader, IonIcon, IonButton, IonButtons, IonAlert } from "@ionic/react";
import { Route, Switch } from 'react-router';
import { useLocation} from "react-router-dom";
import TeachersSearch from "./TeachersSearch";
import ClassesSearch from "./ClassesSearch";
import ClassroomsSearch from "./ClassroomsSearch";
import isTeacherHost from "..//utils/TeacherHost";

export default function Header() {
  const {
    isDarkMode, setIsDarkMode,
    turnus, setTurnus,
    teacherId, setTeacherId,
    savedTeacherId, setSavedTeacherId,
    teachersSearchInput, setTeachersSearchInput,
    classId, setClassId,
    savedClassId, setSavedClassId,
    classesSearchInput, setClassesSearchInput,
    classroomId, setClassroomId,
    savedClassroomId, setSavedClassroomId,
    classroomsSearchInput, setClassroomsSearchInput
  } = useContext(AppContext);
  const dropdownMenuRef = useRef(null);
  const [isDropdownMenuOpen, setIsDropdownOpen] = useState(false);
  const router = useIonRouter();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  function toggleDropdown() {
    setIsDropdownOpen((prev) => !prev);
  }

  // Close the dropdown menu when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleTeachersSaveButtonClick() {
      if (teacherId == savedTeacherId) {
          localStorage.removeItem("teacherId");
          setSavedTeacherId(null);
      } else {
          localStorage.setItem("teacherId", teacherId);
          setSavedTeacherId(teacherId);
      }
  };

  function handleTeachersResetButtonClick() {
    const teacherIdFromStorage = localStorage.getItem("teacherId");
    if (teacherIdFromStorage && teacherIdFromStorage !== teacherId) {
        setTeachersSearchInput("");
        router.push(`/teachers?id=${teacherIdFromStorage}`, "forward");
    }
  };

  function handleClassesSaveButtonClick() {
    if (classId == savedClassId) {
      localStorage.removeItem("classId");
      setSavedClassId(null);
    } else {
      localStorage.setItem("classId", classId);
      setSavedClassId(classId);
    }
  };

  function handleClassroomsSaveButtonClick() {
    if (classroomId == savedClassroomId) {
      localStorage.removeItem("classroomId");
      setSavedClassroomId(null);
    } else {
      localStorage.setItem("classroomId", classroomId);
      setSavedClassroomId(classroomId);
    }
  };

  function handleClassesResetButtonClick() {
    const classIdFromStorage = localStorage.getItem("classId");
    if (classIdFromStorage && classIdFromStorage !== classId) {
      setClassesSearchInput("");
      router.push(`/classes?id=${classIdFromStorage}`, "forward");
    }
  };

  function handleClassroomsResetButtonClick() {
    const classroomIdFromStorage = localStorage.getItem("classroomId");
    if (classroomIdFromStorage && classroomIdFromStorage !== classroomId) {
      setClassroomsSearchInput("");
      router.push(`/classrooms?id=${classroomIdFromStorage}`, "forward");
    }
  };

  function handleSwapTurnusButtonClick() {
    setTurnus(!turnus);
  };

  function toggleDarkMode() {
    setIsDarkMode((prev) => !prev);
    localStorage.setItem("isDarkMode", !isDarkMode);
    console.log("Header > toggleDarkMode() > Dark mode toggled.");
  }

  function changeLanguage() {
    if (i18n.language === "hr") {
      i18n.changeLanguage("en");
    } else {
      i18n.changeLanguage("hr");
    }
  }

  const handleTeachersNavClick = () => {
    let currentParamId = "";
    if (location.pathname.startsWith("/teachers")) {
      const searchParams = new URLSearchParams(location.search);
      currentParamId = searchParams.get("id");
    }

    let targetUrl = "/teachers";
    if (currentParamId === savedTeacherId) {
      targetUrl = "/teachers";
    } else if (currentParamId === teacherId) {
      targetUrl = savedTeacherId ? `/teachers?id=${savedTeacherId}` : "/teachers";
    } else {
      targetUrl = teacherId ? `/teachers?id=${teacherId}` : "/teachers";
    }
  
    router.push(targetUrl, "forward");
  };

  const handleClassesNavClick = () => {
    let currentParamId = "";
    if (location.pathname.startsWith("/classes")) {
      const searchParams = new URLSearchParams(location.search);
      currentParamId = searchParams.get("id");
    }

    let targetUrl = "/classes";
    if (currentParamId === savedClassId) {
      targetUrl = "/classes";
    } else if (currentParamId === classId) {
      targetUrl = savedClassId ? `/classes?id=${savedClassId}` : "/classes";
    } else {
      targetUrl = classId ? `/classes?id=${classId}` : "/classes";
    }
  
    router.push(targetUrl, "forward");
  };

  const handleClassroomsNavClick = () => {
    let currentParamId = "";
    if (location.pathname.startsWith("/classrooms")) {
      const searchParams = new URLSearchParams(location.search);
      currentParamId = searchParams.get("id");
    }

    let targetUrl = "/classrooms";
    if (currentParamId === savedClassroomId) {
      targetUrl = "/classrooms";
    } else if (currentParamId === classroomId) {
      targetUrl = savedClassroomId ? `/classrooms?id=${savedClassroomId}` : "/classrooms";
    } else {
      targetUrl = classroomId ? `/classrooms?id=${classroomId}` : "/classrooms";
    }
  
    router.push(targetUrl, "forward");
  };

  return (
    <IonHeader>
      <div className="header-navigation ion-hide-xl-down">
        <IonButtons>
          {isTeacherHost && (
            <IonButton expand="full" fill="clear" onClick={handleTeachersNavClick}>
              {t("navigation.teachers")}
            </IonButton>
          )}
          <IonButton expand="full" fill="clear" onClick={handleClassesNavClick}>
            {t("navigation.classes")}
          </IonButton>
          <IonButton expand="full" fill="clear" onClick={handleClassroomsNavClick}>
            {t("navigation.classrooms")}
          </IonButton>
        </IonButtons>
      </div>
      <div className="header-title ion-hide-xl-up">SS VIEWER</div>
      <div className="header-icons">
        <Switch>
          <Route exact path={isTeacherHost ? ["/", "/teachers"] : ["/teachers"]}>
            <div className="header-search">
              <TeachersSearch/>
            </div>
            <button className={`icon-button ${teacherId == null ? 'disabled' : ''} ${teacherId === savedTeacherId ? 'saved' : ''}`} onClick={handleTeachersSaveButtonClick}>
              <IonIcon icon={saveOutline} />
            </button>
            <button className={`icon-button ${savedTeacherId == null ? 'disabled' : ''}`}  onClick={handleTeachersResetButtonClick}>
              <IonIcon icon={homeOutline} />
            </button>
          </Route>
          <Route exact path={!isTeacherHost ? ["/", "/classes"] : ["/classes"]}>
            <div className="header-search">
              <ClassesSearch/>
            </div>
            <button className={`icon-button ${classId == null ? 'disabled' : ''} ${classId === savedClassId ? 'saved' : ''}`} onClick={handleClassesSaveButtonClick}>
              <IonIcon icon={saveOutline} />
            </button>
            <button className={`icon-button ${savedClassId == null ? 'disabled' : ''}`}  onClick={handleClassesResetButtonClick}>
              <IonIcon icon={homeOutline} />
            </button>
          </Route>
          <Route exact path={["/classrooms"]}>
            <div className="header-search">
              <ClassroomsSearch/>
            </div>
            <button className={`icon-button ${classroomId == null ? 'disabled' : ''} ${classroomId === savedClassroomId ? 'saved' : ''}`} onClick={handleClassroomsSaveButtonClick}>
              <IonIcon icon={saveOutline} />
            </button>
            <button className={`icon-button ${savedClassroomId == null ? 'disabled' : ''}`}  onClick={handleClassroomsResetButtonClick}>
              <IonIcon icon={homeOutline} />
            </button>
          </Route>
        </Switch>
        <button className={`icon-button`} onClick={handleSwapTurnusButtonClick}>
          <IonIcon icon={swapHorizontalOutline} />
        </button>
        <div className="header-menu" ref={dropdownMenuRef}>
          <button className="icon-button" onClick={toggleDropdown}>
            <IonIcon icon={menuOutline} />
          </button>
          {isDropdownMenuOpen && (
            <div className="dropdown-menu">
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("https://zb.strukovnasamobor.hr/raspored/nastavnici.html", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("scheduleTeachers")}
                </div>
              )}
              <div
                className="dropdown-item"
                onClick={() => {
                  window.open("https://tv.strukovnasamobor.hr/raspored/razredi.html", "_blank");
                  toggleDropdown();
                }}
              >
                {t("scheduleClasses")}
              </div>
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    const win = window.open("", "_blank");
                    win.location = "http://tiny.cc/ss-ras-plavi";
                    toggleDropdown();
                  }}
                >
                  {t("scheduleBlue")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    const win = window.open("", "_blank");
                    win.location = "http://tiny.cc/ss-ras-crveni";
                    toggleDropdown();
                  }}
                >
                  {t("scheduleRed")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    const win = window.open("", "_blank");
                    win.location = "http://tiny.cc/ss-kal";
                    toggleDropdown();
                  }}
                >
                  {t("calendarTeachers")}
                </div>
              )}
              <div
                className="dropdown-item"
                onClick={() => {
                  const win = window.open("", "_blank");
                  win.location = "http://tiny.cc/ss-kalendar";
                  toggleDropdown();
                }}
              >
                {t("calendarStudents")}
              </div>
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("http://tiny.cc/ss-popis", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("studentRoster")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("http://tiny.cc/ss-zaduzenja", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("assignments")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    const win = window.open("", "_blank");
                    win.location = "http://tiny.cc/ss-smjene";
                    toggleDropdown();
                  }}
                >
                  {t("shiftWork")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    const win = window.open("", "_blank");
                    win.location = "http://tiny.cc/ss-evidencija";
                    toggleDropdown();
                  }}
                >
                  {t("workRecord")}
                </div>
              )}
              {isTeacherHost ? (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("https://e-dnevnik.skole.hr", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("eDnevnik")}
                </div>
              ) : (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("https://ocjene.skole.hr", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("eDnevnik")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("https://matica.mzom.hr", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("eMaticna")}
                </div>
              )}
              {isTeacherHost && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    window.open("http://tiny.cc/ss-oo", "_blank");
                    toggleDropdown();
                  }}
                >
                  {t("adultEducation")}
                </div>
              )}
              <div
                className="dropdown-item"
                onClick={() => {
                  window.open("https://www.strukovnasamobor.hr", "_blank");
                  toggleDropdown();
                }}
              >
                {t("schoolWebPage")}
              </div>
              <div
                className="dropdown-item"
                onClick={() => {
                  const win = window.open("", "_blank");
                  win.location = "http://tiny.cc/ss-tlocrt";
                  toggleDropdown();
                }}
              >
                {t("floorPlan")}
              </div>
              <div className="dropdown-item" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <>{t("lightMode")}</>
                ) : (
                  <>{t("darkMode")}</>
                )}
              </div>
              <div className="dropdown-item" onClick={changeLanguage}>
                {t("changeLanguage")}
              </div>
              <div className="dropdown-item" id="present-about" onClick={toggleDropdown}>{t("about")}</div>
              <IonAlert
                trigger="present-about"
                header="SS VIEWER"
                subHeader={t("about.subHeader")}
                message={t("about.message")}
                buttons={[t("ok")]}
              ></IonAlert>
            </div>
          )}
        </div>
      </div>
    </IonHeader>
  );
}