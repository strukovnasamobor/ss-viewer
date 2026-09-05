import "./Teachers.css";
import { AppContext } from "../AppContext";
import PageLayout from "../components/PageLayout";
import ZoomableArea from "../components/ZoomableArea";
import {
  useIonRouter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow
} from '@ionic/react';
import { useLocation } from "react-router-dom";
import { onSnapshot, doc  } from 'firebase/firestore';
import { useContext, useEffect, useState, useRef } from 'react';
import Loading from '../components/Loading';
import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import {VAPID_PUBLIC_KEY, urlBase64ToUint8Array} from '../utils/VapidKeyPulic';

export default function Teachers() {
  const {
    isDarkMode,
    currentTime,
    turnus,
    teachersData,
    setTeachersData,
    teacherId,
    setTeacherId,
    savedTeacherId,
    setSavedTeacherId,
    teachersSearchInput,
    setTeachersSearchInput
  } = useContext(AppContext);
  const [allCardIds, setAllCardIds] = useState([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPannable, setIsPannable] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const router = useIonRouter();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const teacherIdParam = queryParams.get("id");
  const teacherNameParam = queryParams.get("name");
  const teacherIdFromStorage = localStorage.getItem("teacherId");
  const prevTeacherIdRef = useRef();
  const { t } = useTranslation();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorForClassName, setColorForClassName] = useState("");
  const [colorForSubject, setColorForSubject] = useState("");
  const [currentCustomColor, setCurrentCustomColor] = useState("#ffffff");
  const [customColors, setCustomColors] = useState([]);

  const handleDoubleClick = (className, subject) => {
    setColorForClassName(className);
    setColorForSubject(subject);
    const currentColorObj = customColors.find(
      c => c.teacherId === teacherId && c.className === className && c.subject === subject
    );
    const currentColor = currentColorObj ? currentColorObj.color : "#ffffff";
    setCurrentCustomColor(currentColor);
    setShowColorPicker(true);
  };

  const handleColorChange = (e) => {
    const colorValue = e.target.value;
    setCurrentCustomColor(e.target.value);
    const newColorObj = {
      teacherId: teacherId,
      isDarkMode: isDarkMode,
      className: colorForClassName,
      subject: colorForSubject,
      color: colorValue
    };
  
    setCustomColors(prevColors => {
      // If you want to replace color for same teacher/class/subject:
      const filtered = prevColors.filter(
        c => !(c.teacherId === teacherId && c.className === colorForClassName && c.subject === colorForSubject)
      );
      return [...filtered, newColorObj];
    });

    // Save to local storage
    localStorage.setItem("customColors", JSON.stringify(customColors));
  };

  const handleReset = () => {
    setCustomColors(prevColors => {
      const filtered = prevColors.filter(
        c => !(c.teacherId === teacherId && c.className === colorForClassName && c.subject === colorForSubject)
      );
      // Save to local storage
      localStorage.setItem("customColors", JSON.stringify(filtered));
      return filtered;
    });
  };

  const handleResetAll = () => {
    setCustomColors([]);
    localStorage.removeItem("customColors");
  };

  const handleClose = () => {
    setShowColorPicker(false);
  };

  useEffect(() => {
    const storedCustomColors = localStorage.getItem("customColors");
    if (storedCustomColors) {
      setCustomColors(JSON.parse(storedCustomColors));
    }
  }, []);
  
  useEffect(() => {
    if (location.pathname !== "/" && !location.pathname.includes("teachers")) return;
    console.log("Teachers > teacherId =", teacherId);
    console.log("Teachers > teacherIdParam =", teacherIdParam);
    setTeacherId(teacherIdParam);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setTimeout(() => {
      const element = document.querySelector('#teachers-ioncontent');
      element?.scrollToTop(0);
    }, 0);
  }, [teacherId]);

  useEffect(() => {
    if (location.pathname !== "/" && !location.pathname.includes("teachers")) return;
    console.log("Teachers > teacherNameParam =", teacherNameParam);
    
    if (teacherNameParam) {
      const teacher = Object.values(teachersData).find(teacher =>
        teacher.name.toLowerCase().includes(teacherNameParam.toLowerCase())
      );
    
      if (teacher) {
        console.log("Teachers > teacherIdFromName =", teacher.id);
        router.push(`/teachers?id=${teacher.id}`, "none", "replace");
      }
    }
  }, [allCardIds, location.pathname, location.search]);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    console.log("Teachers > teacherIdFromStorage =", teacherIdFromStorage);
    if (teacherIdFromStorage) {
      setSavedTeacherId(teacherIdFromStorage);
      if(teacherIdParam === null && teacherNameParam === null) {
        router.push(`/teachers?id=${teacherIdFromStorage}`, "none", "replace");
      }
    }

    const teacherDocRef = doc(db, "schedules", "teachers");
    const unsubscribeSchedulesTeachers = onSnapshot(
      teacherDocRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          const isFromCache = docSnap.metadata.fromCache;
          setFromCache(isFromCache);

          let newData = docSnap.data().new_data;
          if (newData !== undefined && newData !== null && newData !== "")
            newData = JSON.parse(newData);
          else
            newData = null;
          let olData = docSnap.data().old_data;
          if (olData !== undefined && olData !== null && olData !== "")
            olData = JSON.parse(olData);
          else
            olData = null;
          const data = [];
          for (let i = 0; i < newData.length; i++) {
            data[newData[i].id] = {
              id: newData[i].id,
              name: newData[i].name,
              classteacher: newData[i].classteacher.split('').join('.'),
              viceteacher: newData[i].viceteacher.split('').join('.'),
              newScheduleBlue: newData[i]?.plavi,
              oldScheduleBlue: olData[i]?.plavi,
              newScheduleRed: newData[i]?.crveni,
              oldScheduleRed: olData[i]?.crveni
            };
          }
          //console.log("Teachers > newData = ", newData);
          //console.log("Teachers > olData = ", olData);
          //console.log("Teachers > data = ", data);
          setTeachersData(data);
          const orderedIds = newData.map(item => item.id);
          setAllCardIds(orderedIds);
        } else {
          console.log("Teachers > No such document!");
        }
      }
    );

    return () => unsubscribeSchedulesTeachers();
  }, []);

  useEffect(() => {
    const prevTeacherId = prevTeacherIdRef.current;

    if (savedTeacherId !== prevTeacherId) {
      // If there was a previous teacherId, delete its doc
      if (prevTeacherId) {
        unsubscribeTeacherNotification(prevTeacherId);
      }

      // If we have a new teacherId
      if (savedTeacherId) {
        subscribeTeacherNotification(savedTeacherId);
      }
    }

    // Update ref for next render
    prevTeacherIdRef.current = savedTeacherId;
  }, [savedTeacherId]);

  const unsubscribeTeacherNotification = async (teacherId) => {
    console.log(`Teachers > unsubscribeTeacherNotification > Unsubscribe teachers_${teacherId}`);
  
    try {
      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;
  
      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();
  
      if (!subscription) {
        console.log("Teachers > No active subscription found.");
        return;
      }
  
      // Tell backend to remove subscription
      const response = await fetch("https://ss-viewer-notifs-api.onrender.com/teacher/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacherId,
          subscription: subscription,
        }),
      });
  
      if (response.ok) {
        console.log(`[UNSUBSCRIBED] teachers_${teacherId}`);
  
        // Also unsubscribe locally (browser side)
        await subscription.unsubscribe();
        console.log("Teachers > Local push subscription removed.");
      } else {
        console.error("Teachers > Failed to unsubscribe", await response.text());
      }
  
    } catch (error) {
      console.error("Teachers > unsubscribeTeacherNotification > Error:", error);
    }
  };  

  const subscribeTeacherNotification = async (teacherId) => {
    console.log("Teachers > subscribeTeacherNotification");
  
    try {
      const permission = await Notification.requestPermission();
  
      if (permission !== "granted") {
        console.log("Teachers > subscribeTeacherNotification > Notification permission denied.");
        return;
      }
  
      console.log("Teachers > Notification permission granted.");

      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;
  
      // Subscribe for push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
  
      console.log("Teachers > Subscription payload:", {teacherId, subscription});
  
      // Send subscription to backend
      const response = await fetch("https://ss-viewer-notifs-api.onrender.com/teacher/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacherId,
          subscription: subscription,
        }),
      });
  
      if (response.ok) {
        console.log(`[SUBSCRIBED] teachers_${teacherId}`);
      } else {
        console.error("Teachers > Failed to save subscription", await response.text());
      }
  
    } catch (error) {
      console.error("Teachers > subscribeTeacherNotification > Error:", error);
    }
  };  

  const handleCardOnClick = (teacherId) => (event) => {
    setTeachersSearchInput("");
    router.push(`/teachers?id=${teacherId}`, "forward", "push");
  };

  const navigateToCard = (direction) => {
    const currentIndex = allCardIds.indexOf(teacherId.toString());
    let newIndex;

    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allCardIds.length - 1;
    } else {
      newIndex = currentIndex < allCardIds.length - 1 ? currentIndex + 1 : 0;
    }

    router.push(`/teachers?id=${allCardIds[newIndex]}`, "forward", "push");
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => navigateToCard('right'),
    onSwipedRight: () => navigateToCard('left'),
    trackMouse: true,
    delta: 200, // Increase this value to require a longer swipe
    trackTouch: isTouchDevice && !isPannable
  });

  const timeSlots = [
    '08:00-08:45', '08:50-09:35', '09:40-10:25', '10:40-11:25',
    '11:30-12:15', '12:20-13:05', '13:10-13:55', '14:00-14:45',
    '14:50-15:35', '15:40-16:25', '16:40-17:25', '17:30-18:15',
    '18:20-19:05', '19:10-19:55'
  ];

  const periods = [
    '1.', '2.', '3.', '4.', '5.', '6.', '7./0.', '8./1.',
    '9./2.', '10./3.', '11./4.', '12./5.', '13./6.', '14./7.'
  ];

  function getWeekNumber() {
    let currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 52);
    currentDate.setUTCDate(currentDate.getUTCDate() + 4 - (currentDate.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    // @ts-ignore
    return Math.ceil((((currentDate - yearStart) / 86400000) + 1) / 7);
  }

  function handleClassPartOnClick(classId) {
    classId = classId.slice(0, 2);
    router.push(`/classes?id=${classId}`, "forward", "push");
  }

  function handleClassroomPartOnClick(classroomId) {
    console.log(classroomId);
    router.push(`/classrooms?id=${classroomId}`, "forward", "push");
  }

  function handleTeacherPartOnClick(teacherId) {
    router.push(`/teachers?name=${teacherId}`, "forward", "push");
  }

  const renderScheduleTable = (teacherData) => {
    if (!teacherData) return null;
    const rows = 14;
    const columns = 5;

    const formatnewCellContent = (content) => {
      if(content === null || content === undefined || content === "")
        content = ":";

      const [classAndClassroom, subject] = content.split(':');
      const [originalClassAndClasroom, substitutionClassAndClassroom] = classAndClassroom
        .replace(/\]/g, "") 
        .split("[", 2)
        .map(s => s.trim());
      const [originalClassPart, originalClassroomPart] = originalClassAndClasroom.split('-').map(part => part.trim());
      const [originalSubject, substitutionSubject] = subject
        .replace(/\]/g, "") 
        .split("[", 2)
        .map(s => s.trim());
      let [substitutionClassPart, substitutionClassroomAndTeachersPart] = substitutionClassAndClassroom?.split('-').map(p => p.trim()) || [];
      if(substitutionClassroomAndTeachersPart) {
        var [substitutionClassroomPart, originalTeachersPart] = substitutionClassroomAndTeachersPart.split("(").map(part => part.trim());
        if(originalTeachersPart) {
          var originalTeachers = originalTeachersPart.replace(")", "").split(",").map(s => s.trim());
        }
      }
      if(substitutionSubject) {
        var [substitutionSubjectPart, substitutionTeachersPart] = substitutionSubject.split("(").map(part => part.trim());
        if(substitutionTeachersPart) {
          var substitutionTeachers = substitutionTeachersPart.replace(")", "").split(",").map(s => s.trim());
        }
      }

      return (
        <>
          <div className="timeslot-original">
            <div className="class-classroom">
              <span
                className="class-part clickable"
                onClick={() => handleClassPartOnClick(originalClassPart)}
              >
                {originalClassPart}
              </span>
              {originalClassroomPart && ' - '}
              <span
                className="classroom-part clickable"
                onClick={() => handleClassroomPartOnClick(originalClassroomPart)}
              >
                {originalClassroomPart}
              </span>
            </div>
            <div>
            <div
              className="subject"
              onDoubleClick={(e) => handleDoubleClick(originalClassPart, originalSubject)}
            >
              {originalSubject}
            </div>
            {showColorPicker && (
              <div className="color-picker-overlay" onClick={handleClose}>
                <div className="color-picker-modal" onClick={(e) => e.stopPropagation()}>
                  <label>
                    {t("selectColor")}
                    <input
                      type="color"
                      value={currentCustomColor?.color || "#ffffff"}
                      onInput={handleColorChange}
                    />
                  </label>

                  <button className="color-picker-button" onClick={handleReset}>
                    {t("reset")}
                  </button>

                  <button className="color-picker-button" onClick={handleResetAll}>
                    {t("resetAll")}
                  </button>

                  <button className="color-picker-button" onClick={handleClose}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
          <div className="timeslot-substitution">
            {(substitutionClassAndClassroom &&
              <div className="class-classroom">
                <span
                  className="class-part clickable"
                  onClick={() => handleClassPartOnClick(substitutionClassPart)}
                >
                  {substitutionClassPart}
                </span>
                {substitutionClassPart && ' - '}
                <span
                  className="classroom-part clickable"
                  onClick={() => handleClassroomPartOnClick(substitutionClassroomPart)}
                >
                  {substitutionClassroomPart}
                </span>
              </div>
              )}
              {(substitutionSubjectPart &&
                <div className="subject">{substitutionSubjectPart}</div>
              )}
              {(originalTeachers &&
                <div className="original-teachers">
                  {originalTeachers && " ["}
                  {originalTeachers && originalTeachers.map((part, index) => (
                    <span
                      key={index}
                      className="teacher-part clickable"
                      onClick={() => handleTeacherPartOnClick(part)}
                    >
                      {part}
                      {index < originalTeachers.length - 1 && ", "}
                    </span>
                  ))}
                  {originalTeachers && "]"}
                </div>
              )}
              {(substitutionTeachers &&
                <div className="substitution-teachers">
                  {substitutionTeachers && substitutionTeachers.map((part, index) => (
                    <span
                      key={index}
                      className="teacher-part clickable"
                      onClick={() => handleTeacherPartOnClick(part)}
                    >
                      {part}
                      {index < substitutionTeachers.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
          </div>
        </>
      );
    };

    const formatTimeSlotContent = (content) => {
      const parts = content.split('-');
      return parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          {part.trim()}
        </React.Fragment>
      ));
    };

    const getCurrentTimeSlotIndex = () => {
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      for (let i = 0; i < timeSlots.length; i++) {
        const [start, end] = timeSlots[i].split('-');
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        if (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute))
          return i;
      }
      return -1;
    };

    const currentTimeSlotIndex = getCurrentTimeSlotIndex();
  
    return (
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th colSpan={7}>
                <div className="table-header-container">
                  <div className="header-container-left">
                    <div className="arrow-left" onClick={() => navigateToCard('left')}>
                      <IonIcon size="" icon={chevronBackOutline} />
                    </div>
                  </div>
                  <div className="teacher-name">{teacherData.id} - {teacherData.name}</div>
                  <div className="header-container-right">
                    <div>razrednik:&nbsp;{teacherData.classteacher}<br />zamjenik:&nbsp;{teacherData.viceteacher}</div>
                    <div className="arrow-right" onClick={() => navigateToCard('right')}>
                      <IonIcon size="" icon={chevronForwardOutline} />
                    </div>
                  </div>
                </div>
              </th>
            </tr>
            <tr className={`theader-${turnus ? "blue" : "red"}`}>
              <th className='timeslot' colSpan={2}>{turnus ? "PLAVI" : "CRVENI"}</th>
              <th className='day'>PONEDJELJAK</th>
              <th className='day'>UTORAK</th>
              <th className='day'>SRIJEDA</th>
              <th className='day'>ČETVRTAK</th>
              <th className='day'>PETAK</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, i) => (
              <tr key={i} className={`${i == 6 ? `middle-${turnus ? "blue" : "red"}` : ""}`}>
                <td>{formatTimeSlotContent(timeSlots[i])}</td>
                <td><b>{periods[i]}</b></td>
                {[...Array(columns)].map((_, j) => {
                  const index = i + j * (rows + 1);
                  const newCellContent = turnus ? teacherData.newScheduleBlue[index] : teacherData.newScheduleRed[index];
                  let oldnewCellContent;
                  if (teacherData.oldScheduleBlue !== undefined)
                    oldnewCellContent = turnus ? teacherData.oldScheduleBlue[index] : teacherData.oldScheduleRed[index];
                  else
                    oldnewCellContent = newCellContent;
                  const currentTurnus = getWeekNumber() % 2 == 0 ? true : false;

                  let backgroundColor = "";
                  if (newCellContent.includes("INFORMACIJE")) {
                    backgroundColor = "background-info";
                  }
                  else if (newCellContent.includes("DEŽURSTVO")) {
                    backgroundColor = "background-duty";
                  }
                  else if (newCellContent.includes("VOĐENJE PROCESA RAČUNALOM")) {
                    backgroundColor = "";
                  }               
                  else if (newCellContent.includes("VOĐENJE")) {
                    backgroundColor = "background-administration";
                  }
                  else if (newCellContent.includes("PRAĆENJE")) {
                    backgroundColor = "background-monitoring";
                  }
                  if (backgroundColor == "" && teacherData.name == "Zlatko DAMIJANIĆ") {
                    if (newCellContent.includes("1G") && newCellContent.includes("UVO")) {
                      backgroundColor = "background-blue";
                    }
                    else if (newCellContent.includes("2G") && newCellContent.includes("PRO")) {
                      backgroundColor = "background-green";
                    }
                    else if (newCellContent.includes("3G") && newCellContent.includes("NAP")) {
                      backgroundColor = "background-red-1";
                    }
                    else if (newCellContent.includes("3G") && newCellContent.includes("UMJ")) {
                      backgroundColor = "background-yellow";
                    }
                    else if (newCellContent.includes("4G") && newCellContent.includes("NAP")) {
                      backgroundColor = "background-red-2";
                    }
                    else if (newCellContent.includes("4G") && newCellContent.includes("SAT")) {
                      backgroundColor = "background-orange";
                    }
                  }

                  let customBackgroundColor = "";
                  customColors.forEach(customColor => {
                    if (
                      customColor.teacherId === teacherId &&
                      isDarkMode === customColor.isDarkMode &&
                      newCellContent.includes(customColor.className) &&
                      newCellContent.includes(customColor.subject)
                    ) {
                      customBackgroundColor = customColor.color;
                    }
                  });

                  return (
                    <td
                      key={j}
                      className={`${(turnus == currentTurnus && i == currentTimeSlotIndex && j + 1 == currentTime.getDay()) ? "current" : ""} ${newCellContent != oldnewCellContent ? "changed" : ""} ${backgroundColor}`}
                      style={{backgroundColor: customBackgroundColor}}
                    >
                      {formatnewCellContent(newCellContent)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (Object.keys(teachersData)== 0) {
    return (
      <Loading />
    );
  } else if(teacherId !== null && !allCardIds.includes(teacherId)) {
      return (
        <PageLayout name="teacher-not-found">
            <p>{t("teacherNotFound")}</p>
        </PageLayout>
    );
  }

  return (
    <PageLayout name={`teachers${fromCache ? " from-cache" : ""}`} center={false}>
      {teacherId ? (
        <ZoomableArea onPannableChange={setIsPannable}>
          {isTouchDevice ? (
            <div className="swipe-container" {...handlers}>
              {renderScheduleTable(teachersData[teacherId])}
            </div>
          ) : (
            renderScheduleTable(teachersData[teacherId])
          )}
        </ZoomableArea>
      ) : (
        <IonGrid>
          <IonRow>
            {
              allCardIds
                .filter(id => {
                  const teacher = teachersData[id];
                  if (!teacher) return false;
                  return (
                    id.toLowerCase().includes(teachersSearchInput.toLowerCase()) ||
                    teacher.name.toLowerCase().includes(teachersSearchInput.toLowerCase())
                  );
                })
                .map(id => {
                  const teacher = teachersData[id];
                  return (
                    <IonCol key={id} size="12" size-md="6">
                      <IonCard onClick={handleCardOnClick(id)}>
                        <IonCardHeader>
                          <IonCardTitle>{id} - {teacher.name}</IonCardTitle>
                        </IonCardHeader>
                      </IonCard>
                    </IonCol>
                  );
                })            
            }
          </IonRow>
        </IonGrid>
      )}
    </PageLayout>
  );
};