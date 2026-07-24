import { useIonRouter, IonSearchbar } from '@ionic/react';
import { useContext } from "react";
import { AppContext } from "../AppContext";
import { useTranslation } from 'react-i18next';

export default function ClassesSearch() {
    const { classId, classesSearchInput, setClassesSearchInput } = useContext(AppContext);
    const router = useIonRouter();
    const { t } = useTranslation();

    const handleSearchInput = (e) => {
        setClassesSearchInput(e.target.value);
    };

    return (
        <IonSearchbar
            debounce={500}
            onIonInput={(e) => handleSearchInput(e)}
            onClick={() => classId && router.push(`/classes`, "forward")}
            value={classesSearchInput}
            placeholder={t("searchClasses")}
        ></IonSearchbar>
    );
}