import "./Classes.css";
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
import { onSnapshot, doc } from 'firebase/firestore';
import { useContext, useEffect, useState, useRef } from 'react';
import Loading from '../components/Loading';
import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import isTeacherHost from "../utils/TeacherHost";
import {VAPID_PUBLIC_KEY, urlBase64ToUint8Array} from '../utils/VapidKeyPulic';

export default function Classes() {
  const {
    currentTime,
    turnus,
    classesData,
    setClassesData,
    classId,
    setClassId,
    savedClassId,
    setSavedClassId,
    classesSearchInput,
    setClassesSearchInput
  } = useContext(AppContext);
  const [allCardIds, setAllCardIds] = useState([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPannable, setIsPannable] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const router = useIonRouter();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const classIdParam = queryParams.get("id");
  const classIdFromStorage = localStorage.getItem("classId");
  const prevClassIdRef = useRef();
  const { t } = useTranslation();

  useEffect(() => {
    if (!location.pathname.includes("classes")) return;
    console.log("Classes > classId =", classId);
    console.log("Classes > classIdParam =", classIdParam);
    setClassId(classIdParam);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setTimeout(() => {
      const element = document.querySelector('#classes-ioncontent');
      element?.scrollToTop(0);
    }, 0);
  }, [classId]);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    console.log("Classes > classIdFromStorage =", classIdFromStorage);
    if (classIdFromStorage) {
      setSavedClassId(classIdFromStorage);
      if(classIdParam === null) {
        router.push(`/classes?id=${classIdFromStorage}`, "none", "replace");
      }
    }

    const classesDocRef = doc(db, "schedules", "classes");
    const unsubscribeSchedulesClasses = onSnapshot(
      classesDocRef,
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
            data[newData[i].name] = {
              id: newData[i].name,
              name: newData[i].name.split('').join('.'),
              classroom: newData[i].classroom,
              classteacher: newData[i].classteacher,
              viceteacher: newData[i].viceteacher,
              class_list_link: newData[i].class_list_link,
              newScheduleBlue: newData[i]?.plavi,
              oldScheduleBlue: olData[i]?.plavi,
              newScheduleRed: newData[i]?.crveni,
              oldScheduleRed: olData[i]?.crveni
            };
          }
          //console.log("Classes > newData = ", newData);
          //console.log("Classes > olData = ", olData);
          //console.log("Classes > data = ", data);
          setClassesData(data);
          const orderedIds = newData.map(item => item.name);
          setAllCardIds(orderedIds);
        } else {
          console.log("Classes > No such document!");
        }
      }
    );

    return () => unsubscribeSchedulesClasses();
  }, []);

  useEffect(() => {
    const prevClassId = prevClassIdRef.current;

    if (savedClassId !== prevClassId) {
      // If there was a previous classId, delete its doc
      if (prevClassId) {
        unsubscribeClassNotification(prevClassId);
      }

      // If we have a new classId
      if (savedClassId) {
        subscribeClassNotification(savedClassId);
      }
    }

    // Update ref for next render
    prevClassIdRef.current = savedClassId;
  }, [savedClassId]);

  const unsubscribeClassNotification = async (classId) => {
      console.log(`Classes > unsubscribeClassNotification > Unsubscribe classes_${classId}`);
    
      try {
        // Ensure service worker is ready
        const registration = await navigator.serviceWorker.ready;
    
        // Get current subscription
        const subscription = await registration.pushManager.getSubscription();
    
        if (!subscription) {
          console.log("Classes > No active subscription found.");
          return;
        }
    
        // Tell backend to remove subscription
        const response = await fetch("https://ss-viewer-notifs-api.onrender.com/class/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: classId,
            subscription: subscription,
          }),
        });
    
        if (response.ok) {
          console.log(`[UNSUBSCRIBED] classes_${classId}`);
    
          // Also unsubscribe locally (browser side)
          await subscription.unsubscribe();
          console.log("Classes > Local push subscription removed.");
        } else {
          console.error("Classes > Failed to unsubscribe", await response.text());
        }
    
      } catch (error) {
        console.error("Classes > unsubscribeClassNotification > Error:", error);
      }
    };  
  
    const subscribeClassNotification = async (classId) => {
      console.log("Classes > subscribeClassNotification");
    
      try {
        const permission = await Notification.requestPermission();
    
        if (permission !== "granted") {
          console.log("Classes > subscribeClassNotification > Notification permission denied.");
          return;
        }
    
        console.log("Classes > Notification permission granted.");
  
        // Ensure service worker is ready
        const registration = await navigator.serviceWorker.ready;
    
        // Subscribe for push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
    
        console.log("Classes > Subscription payload:", {classId, subscription});
    
        // Send subscription to backend
        const response = await fetch("https://ss-viewer-notifs-api.onrender.com/class/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: classId,
            subscription: subscription,
          }),
        });
    
        if (response.ok) {
          console.log(`[SUBSCRIBED] classes_${classId}`);
        } else {
          console.error("Classes > Failed to save subscription", await response.text());
        }
    
      } catch (error) {
        console.error("Classes > subscribeClassNotification > Error:", error);
      }
  };

  const handleCardOnClick = (classId) => (event) => {
    setClassesSearchInput("");
    router.push(`/classes?id=${classId}`, "forward", "push");
  };

  const navigateToCard = (direction) => {
    const currentIndex = allCardIds.indexOf(classId.toString());
    let newIndex;

    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allCardIds.length - 1;
    } else {
      newIndex = currentIndex < allCardIds.length - 1 ? currentIndex + 1 : 0;
    }

    router.push(`/classes?id=${allCardIds[newIndex]}`, "forward", "push");
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

  function handleClassroomPartOnClick(classroomId) {
    router.push(`/classrooms?id=${classroomId}`, "forward", "push");
  }

  function handleTeacherPartOnClick(teacherName) {
    router.push(`/teachers?name=${teacherName}`, "forward", "push");
  }

  const renderScheduleTable = (classData) => {
    if (!classData) return null;
    const rows = 14;
    const columns = 5;

    const formatnewCellContent = (content) => {
      if(content === null || content === undefined || content === "")
        content = ":";

      let substitution = false;
      if (content.startsWith("[")) {
        substitution = true;
        content = content.replace(/\[|\]/g, "");
      }
      const [subjectAndClassrromm, teacher] = content.split(':').map(part => part.trim());
      const [subjectPart, classroomPart] = subjectAndClassrromm.split('-').map(part => part.trim());

      return (
        <div className={substitution ? "timeslot-substitution" : "timeslot-original"}>
          <div className="subject-classroom">
            <span className="subject-part">
              {subjectPart}
            </span>
            {classroomPart && ' - '}
            <span
              className="classroom-part clickable"
              onClick={() => handleClassroomPartOnClick(classroomPart)}
            >
              {classroomPart}
            </span>
          </div>
          {teacher &&
            (isTeacherHost ? (
              <div
                className="teacher clickable"
                onClick={() => handleTeacherPartOnClick(teacher)}
              >
                {teacher}
              </div>
            ) : (
              <div className="teacher">{teacher}</div>
            ))
          }
        </div>
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
                    {isTeacherHost && (
                      <div
                        className="class-list-link"
                        onClick={() => {
                          const win = window.open("", "_blank");
                          win.location = classData.class_list_link;
                        }}
                      >
                        Popis učenika
                      </div>
                    )}
                  </div>
                  <div className="class-name">{classData.name}</div>
                  <div className="header-container-right">
                    <div>razrednik:&nbsp;{classData.classteacher}<br />zamjenik:&nbsp;{classData.viceteacher}</div>
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
                  const newCellContent = turnus ? classData.newScheduleBlue[index] : classData.newScheduleRed[index];
                  let oldnewCellContent;
                  if (classData.oldScheduleBlue !== undefined)
                    oldnewCellContent = turnus ? classData.oldScheduleBlue[index] : classData.oldScheduleRed[index];
                  else
                    oldnewCellContent = newCellContent;
                  const currentTurnus = getWeekNumber() % 2 == 0 ? true : false;

                  let backgroundColor = "";

                  return (
                    <td
                      key={j}
                      className={`${(turnus == currentTurnus && i == currentTimeSlotIndex && j + 1 == currentTime.getDay()) ? "current" : ""} ${newCellContent != oldnewCellContent ? "changed" : ""} ${backgroundColor}`}
                    >
                      {newCellContent
                        .split(";")
                        .map((part, idx) => (
                          <div key={idx}>{formatnewCellContent(part.trim())}</div>
                        ))}
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

  if (Object.keys(classesData).length == 0) {
    return (
      <Loading />
    );
  } else if(classId !== null && !allCardIds.includes(classId)) {
      return (
        <PageLayout name="class-not-found">
            <p>{t("classNotFound")}</p>
        </PageLayout>
      );
  }

  return (
    <PageLayout name={`classes${fromCache ? " from-cache" : ""}`} center={false}>
      {classId ? (
        <ZoomableArea onPannableChange={setIsPannable}>
          {isTouchDevice ? (
            <div className="swipe-container" {...handlers}>
              {renderScheduleTable(classesData[classId])}
            </div>
          ) : (
            renderScheduleTable(classesData[classId])
          )}
        </ZoomableArea>
      ) : (
        <IonGrid>
          <IonRow>
            {
              allCardIds
                .filter(id => {
                  const division = classesData[id];
                  if (!division) return false;
                  return (
                    id.toLowerCase().includes(classesSearchInput.toLowerCase()) ||
                    division.name.toLowerCase().includes(classesSearchInput.toLowerCase())
                  );
                })
                .map(id => {
                  const classDivision = classesData[id];
                  return (
                    <IonCol key={id} size="12" size-md="6">
                      <IonCard onClick={handleCardOnClick(id)}>
                        <IonCardHeader>
                          <IonCardTitle>{classDivision.name}</IonCardTitle>
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