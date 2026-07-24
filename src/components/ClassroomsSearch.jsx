import { useIonRouter, IonSearchbar } from '@ionic/react';
import { useContext } from "react";
import { AppContext } from "../AppContext";
import { useTranslation } from 'react-i18next';

export default function ClassroomsSeach() {
    const { classroomId, classroomsSearchInput, setClassroomsSearchInput } = useContext(AppContext);
    const router = useIonRouter();
    const { t } = useTranslation();

    const handleSearchInput = (e) => {
        setClassroomsSearchInput(e.target.value);
    };

    return (
        <IonSearchbar
            debounce={500}
            onIonInput={(e) => handleSearchInput(e)}
            onClick={() => classroomId && router.push(`/classrooms`, "forward")}
            value={classroomsSearchInput}
            placeholder={t("searchClassrooms")}
        ></IonSearchbar>
    );
}