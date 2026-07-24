import "./App.css";
import { AppContext } from "./AppContext";
import { useContext } from "react";
import {Route, useLocation} from "react-router-dom";
import {getConfig, useIonRouter, IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon, IonRouterOutlet } from "@ionic/react";
import { calendarOutline, schoolOutline, easelOutline } from "ionicons/icons";
import { useTranslation } from 'react-i18next';
import isTeacherHost from "./utils/TeacherHost";

import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Classrooms from "./pages/Classrooms";
import PageNotFound from "./pages/PageNotFound";

export default function App() {
  const { 
    teacherId,
    classId,
    classroomId,
    savedTeacherId,
    savedClassId,
    savedClassroomId
  } = useContext(AppContext);
  const router = useIonRouter();
  const { t } = useTranslation();
  const location = useLocation();
  const config = getConfig();
  config.set('animated', false);

  const normalizedPath = location.pathname.replace(/\/$/, "");
  let isActiveTabTeacher;
  let isActiveTabClasses;
  let isActiveTabClassrooms = normalizedPath.startsWith('/classrooms');

  let showTabs;
  if (isTeacherHost) {
    isActiveTabTeacher = normalizedPath === '' || normalizedPath.startsWith('/teachers');
    isActiveTabClasses = normalizedPath.startsWith('/classes');
    showTabs = ["", "/teachers", "/classes", "/classrooms"].includes(normalizedPath);
  } else {
    isActiveTabTeacher = normalizedPath.startsWith('/teachers');
    isActiveTabClasses = normalizedPath === '' || normalizedPath.startsWith('/classes');
    showTabs = ["", "/classes", "/classrooms"].includes(normalizedPath);
  }
  
  console.log("App > isTeacherHost:", isTeacherHost);
  console.log("App > showTabs:", showTabs);

  const handleClassesTabClick = () => {
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

  const handleTeachersTabClick = () => {
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

  const handleClassroomsTabClick = () => {
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
    <IonTabs>
      {isTeacherHost ? (
        <IonRouterOutlet>
          <Route exact path={["/", "/teachers"]} component={Teachers} />
          <Route exact path="/classes" component={Classes} />
          <Route exact path="/classrooms" component={Classrooms} />
          <Route component={PageNotFound} />
        </IonRouterOutlet>
      ) : (
        <IonRouterOutlet>
          <Route exact path={["/", "/classes"]} component={Classes} />
          <Route exact path="/classrooms" component={Classrooms} />
          <Route component={PageNotFound} />
        </IonRouterOutlet>
      )}
      <IonTabBar slot="bottom" style={{ display: showTabs ? "flex" : "none" }}>
        <IonTabButton 
          tab="classes" 
          selected={isActiveTabClasses}
          onClick={handleClassesTabClick} 
        >
          <IonIcon icon={schoolOutline} />
          <IonLabel>{t("tabs.classes")}</IonLabel>
        </IonTabButton>
        {isTeacherHost && (
          <IonTabButton 
            tab="teachers" 
            selected={isActiveTabTeacher}
            onClick={handleTeachersTabClick} 
          >
            <IonIcon icon={calendarOutline} />
            <IonLabel>{t("tabs.teachers")}</IonLabel>
          </IonTabButton>
        )}
        <IonTabButton
          tab="classrooms"
          selected={isActiveTabClassrooms}
          onClick={handleClassroomsTabClick}
        >
          <IonIcon icon={easelOutline} />
          <IonLabel>{t("tabs.classrooms")}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}