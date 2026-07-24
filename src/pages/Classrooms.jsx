import "./Classrooms.css";
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
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '../utils/VapidKeyPulic';

export default function Classrooms() {
  const {
    currentTime,
    turnus,
    classroomsData,
    setClassroomsData,
    classroomId,
    setClassroomId,
    savedClassroomId,
    setSavedClassroomId,
    classroomsSearchInput,
    setClassroomsSearchInput
  } = useContext(AppContext);
  const [allCardIds, setAllCardIds] = useState([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPannable, setIsPannable] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const router = useIonRouter();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const classroomIdParam = queryParams.get("id");
  const classroomIdFromStorage = localStorage.getItem("classroomId");
  const prevClassroomIdRef = useRef();
  const { t } = useTranslation();

  useEffect(() => {
    if (!location.pathname.includes("classrooms")) return;
    console.log("Classrooms > classroomId =", classroomId);
    console.log("Classrooms > classroomIdParam =", classroomIdParam);
    setClassroomId(classroomIdParam);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setTimeout(() => {
      const element = document.querySelector('#classrooms-ioncontent');
      element?.scrollToTop(0);
    }, 0);
  }, [classroomId]);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    console.log("Classrooms > classroomIdFromStorage =", classroomIdFromStorage);
    if (classroomIdFromStorage) {
      setSavedClassroomId(classroomIdFromStorage);
      if (classroomIdParam === null) {
        router.push(`/classrooms?id=${classroomIdFromStorage}`, "none", "replace");
      }
    }

    const classroomsDocRef = doc(db, "schedules", "classrooms");
    const unsubscribeSchedulesClassrooms = onSnapshot(
      classroomsDocRef,
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
              name: newData[i].name,
              class: newData[i].class,
              newScheduleBlue: newData[i]?.plavi,
              oldScheduleBlue: olData[i]?.plavi,
              newScheduleRed: newData[i]?.crveni,
              oldScheduleRed: olData[i]?.crveni
            };
          }
          //console.log("Classrooms > newData = ", newData);
          //console.log("Classrooms > olData = ", olData);
          //console.log("Classrooms > data = ", data);
          setClassroomsData(data);
          const orderedIds = newData.map(item => item.name);
          setAllCardIds(orderedIds);
        } else {
          console.log("Classrooms > No such document!");
        }
      }
    );

    return () => unsubscribeSchedulesClassrooms();
  }, []);

  useEffect(() => {
    const prevClassroomId = prevClassroomIdRef.current;

    if (savedClassroomId !== prevClassroomId) {
      // If there was a previous classroomId, delete its doc
      if (prevClassroomId) {
        unsubscribeClassroomNotification(prevClassroomId);
      }

      // If we have a new classroomId
      if (savedClassroomId) {
        subscribeClassroomNotification(savedClassroomId);
      }
    }

    // Update ref for next render
    prevClassroomIdRef.current = savedClassroomId;
  }, [savedClassroomId]);

  const unsubscribeClassroomNotification = async (classroomId) => {
    console.log(`Classrooms > unsubscribeClassNotification > Unsubscribe classrooms_${classroomId}`);

    try {
      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;

      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("Classrooms > No active subscription found.");
        return;
      }

      // Tell backend to remove subscription
      const response = await fetch("https://ss-viewer-notifs-api.onrender.com/classroom/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classroomId: classroomId,
          subscription: subscription,
        }),
      });

      if (response.ok) {
        console.log(`[UNSUBSCRIBED] classrooms_${classroomId}`);

        // Also unsubscribe locally (browser side)
        await subscription.unsubscribe();
        console.log("Classrooms > Local push subscription removed.");
      } else {
        console.error("Classrooms > Failed to unsubscribe", await response.text());
      }

    } catch (error) {
      console.error("Classrooms > unsubscribeClassroomNotification > Error:", error);
    }
  };

  const subscribeClassroomNotification = async (classroomId) => {
    console.log("Classrooms > subscribeClassNotification");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("Classrooms > subscribeClassroomNotification > Notification permission denied.");
        return;
      }

      console.log("Classrooms > Notification permission granted.");

      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;

      // Subscribe for push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("Classrooms > Subscription payload:", { classroomId, subscription });

      // Send subscription to backend
      const response = await fetch("https://ss-viewer-notifs-api.onrender.com/classroom/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classroomId: classroomId,
          subscription: subscription,
        }),
      });

      if (response.ok) {
        console.log(`[SUBSCRIBED] classrooms_${classroomId}`);
      } else {
        console.error("Classrooms > Failed to save subscription", await response.text());
      }

    } catch (error) {
      console.error("Classrooms > subscribeClassroomNotification > Error:", error);
    }
  };

  const handleCardOnClick = (classroomId) => (event) => {
    setClassroomsSearchInput("");
    router.push(`/classrooms?id=${classroomId}`, "forward", "push");
  };

  const navigateToCard = (direction) => {
    const currentIndex = allCardIds.indexOf(classroomId.toString());
    let newIndex;

    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allCardIds.length - 1;
    } else {
      newIndex = currentIndex < allCardIds.length - 1 ? currentIndex + 1 : 0;
    }

    router.push(`/classrooms?id=${allCardIds[newIndex]}`, "forward", "push");
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

  function handleTeacherPartOnClick(teacherName) {
    router.push(`/teachers?name=${teacherName}`, "forward", "push");
  }

  const renderScheduleTable = (classroomData) => {
    if (!classroomData) return null;
    const rows = 14;
    const columns = 5;

    const formatnewCellContent = (content) => {
      if (content === null || content === undefined || content === "")
        content = ":";

      let substitution = false;
      if (content.startsWith("[")) {
        substitution = true;
        content = content.replace(/\[|\]/g, "");
      }
      let [classAndTeacher, subject] = content.split(':').map(part => part.trim());
      if (subject === undefined) {
        subject = "[ ]"
      }
      const [classPart, teacherPart] = classAndTeacher.split('-').map(part => part.trim());

      return (
        <div className={substitution ? "timeslot-substitution" : "timeslot-original"}>
          <div className="class-teacher">
            <span
              className="class-part clickable"
              onClick={() => handleClassPartOnClick(classPart)}
            >
              {classPart}
            </span>
            {classPart && ' - '}
            {isTeacherHost ? (
              <span
                className="teacher-part clickable"
                onClick={() => handleTeacherPartOnClick(teacherPart)}
              >
                {teacherPart}
              </span>
            ) : (
              <span className="teacher-part">{teacherPart}</span>
            )}
          </div>
          <div className="subject">{subject}</div>
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
                  </div>
                  <div className="classroom-name">{classroomData.name}</div>
                  <div className="header-container-right">
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
                  const newCellContent = turnus ? classroomData.newScheduleBlue[index] : classroomData.newScheduleRed[index];
                  let oldnewCellContent;
                  if (classroomData.oldScheduleBlue !== undefined)
                    oldnewCellContent = turnus ? classroomData.oldScheduleBlue[index] : classroomData.oldScheduleRed[index];
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

  if (Object.keys(classroomsData).length == 0) {
    return (
      <Loading />
    );
  } else if (classroomId !== null && !allCardIds.includes(classroomId)) {
    return (
      <PageLayout name="classroom-not-found">
        <p>{t("classroomNotFound")}</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout name={`classrooms${fromCache ? " from-cache" : ""}`} center={false}>
      {classroomId ? (
        <ZoomableArea onPannableChange={setIsPannable}>
          {isTouchDevice ? (
            <div className="swipe-container" {...handlers}>
              {renderScheduleTable(classroomsData[classroomId])}
            </div>
          ) : (
            renderScheduleTable(classroomsData[classroomId])
          )}
        </ZoomableArea>
      ) : (
        <IonGrid>
          <IonRow>
            {
              allCardIds
                .filter(id =>
                  id.toLowerCase().includes(classroomsSearchInput.toLowerCase()) ||
                  classroomsData[id].name.toLowerCase().includes(classroomsSearchInput.toLowerCase())
                )
                .map(id => {
                  const classroomDivision = classroomsData[id];
                  return (
                    <IonCol key={id} size="12" size-md="6">
                      <IonCard onClick={handleCardOnClick(id)}>
                        <IonCardHeader>
                          <IonCardTitle>{classroomDivision.name}</IonCardTitle>
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