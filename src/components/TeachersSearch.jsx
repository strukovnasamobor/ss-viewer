import { useIonRouter, IonSearchbar } from '@ionic/react';
import { useContext } from "react";
import { AppContext } from "../AppContext";
import { useTranslation } from 'react-i18next';

export default function TeachersSearch() {
    const { teacherId, teachersSearchInput, setTeachersSearchInput } = useContext(AppContext);
    const router = useIonRouter();
    const { t } = useTranslation();

    const handleSearchInput = (e) => {
        setTeachersSearchInput(e.target.value);
    };

    return (
        <IonSearchbar
            debounce={500}
            onIonInput={(e) => handleSearchInput(e)}
            onClick={() => teacherId && router.push(`/teachers`, "forward")}
            value={teachersSearchInput}
            placeholder={t("searchTeachers")}
        ></IonSearchbar>
    );
}